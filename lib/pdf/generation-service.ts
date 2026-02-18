import { createHash } from 'crypto';
import { db } from '@/lib/db/drizzle';
import { pdfVersions, caseForms, formTypes, cases, ActivityType } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/activity/service';
import { getTemplate } from './template-cache';
import { fillUSCISForm } from './uscis-forms';
import { mapFormDataToPdfFields } from './form-data-mapper';
import { generateSimplePdf } from './simple-pdf-generator';
import { savePdfLocally } from './local-storage';
import type { FormSchema } from '@/lib/forms/service';

export interface GeneratePdfResult {
  pdfVersionId: number;
  fileUrl: string;
  version: number;
  fieldsFilled: number;
  fieldsSkipped: string[];
}

/**
 * Generate a filled USCIS PDF for a case form.
 *
 * 1. Load case form + form schema
 * 2. Map form data → PDF field values
 * 3. Load cached AcroForm template
 * 4. Fill template with pdf-lib
 * 5. Upload to Cloudinary
 * 6. Record in pdf_versions table
 * 7. Log activity
 */
export async function generatePdf(
  caseFormId: number,
  teamId: number,
  userId: number
): Promise<GeneratePdfResult> {
  // 1. Load case form with schema and case data
  const [result] = await db
    .select({
      caseForm: caseForms,
      formType: formTypes,
      case_: cases,
    })
    .from(caseForms)
    .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
    .innerJoin(cases, eq(caseForms.caseId, cases.id))
    .where(and(eq(caseForms.id, caseFormId), eq(cases.teamId, teamId)));

  if (!result) {
    throw new Error('Case form not found');
  }

  const { caseForm, formType, case_: caseData } = result;
  const formCode = formType.code; // e.g. "I-131"
  const schema = formType.formSchema as unknown as FormSchema;
  const formData = (caseForm.formData as Record<string, unknown>) ?? {};

  let filled: { buffer: Uint8Array; fieldsFilled: number; fieldsSkipped: string[] };

  try {
    // Try to use the USCIS template first
    console.log(`[PDF Generation] Attempting to use USCIS template for ${formCode}`);

    // 2. Map form data → PDF field values
    const pdfFieldValues = mapFormDataToPdfFields(schema, formData);

    // 3. Load AcroForm template
    const templateBuffer = await getTemplate(formCode);

    // 4. Fill PDF
    filled = await fillUSCISForm(templateBuffer, pdfFieldValues);
    console.log(`[PDF Generation] Successfully filled USCIS template`);
  } catch (error) {
    console.warn(`[PDF Generation] USCIS template failed, using simple PDF generator:`, error);

    // Fallback to simple PDF generation
    const pdfBuffer = await generateSimplePdf({
      formCode,
      formName: formType.name,
      caseNumber: caseData.caseNumber || `CASE-${caseData.id}`,
      formSchema: schema,
      formData,
      progressPercentage: caseForm.progressPercentage || 0
    });

    // Count filled fields
    let fieldsFilled = 0;
    for (const part of schema.parts) {
      for (const section of part.sections) {
        for (const field of section.fields) {
          const fieldPath = `${part.id}.${section.id}.${field.id}`;
          const value = formData[fieldPath];
          if (value !== undefined && value !== null && value !== '') {
            fieldsFilled++;
          }
        }
      }
    }

    filled = {
      buffer: pdfBuffer,
      fieldsFilled,
      fieldsSkipped: []
    };
    console.log(`[PDF Generation] Simple PDF generated with ${fieldsFilled} fields`);
  }

  // 5. Get next version number
  const version = await getNextVersion(caseFormId);

  // Validate buffer before upload
  if (!filled.buffer || filled.buffer.length === 0) {
    throw new Error('PDF buffer is empty before upload');
  }

  // 6. Upload to storage (try Cloudinary first, fallback to local)
  let fileUrl: string;
  const fileName = `${formCode}-${caseData.caseNumber || caseData.id}-v${version}.pdf`;

  // Check if Cloudinary is configured
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
                        process.env.CLOUDINARY_API_KEY &&
                        process.env.CLOUDINARY_API_SECRET;

  if (hasCloudinary) {
    try {
      fileUrl = await uploadToCloudinary(filled.buffer, fileName);
    } catch (cloudinaryError) {
      console.warn('[PDF Generation] Cloudinary upload failed, saving locally:', cloudinaryError);
      fileUrl = await savePdfLocally(filled.buffer, fileName);
    }
  } else {
    console.log('[PDF Generation] Cloudinary not configured, saving locally');
    fileUrl = await savePdfLocally(filled.buffer, fileName);
  }
  const [pdfVersion] = await db
    .insert(pdfVersions)
    .values({
      caseFormId,
      fileUrl,
      fileSize: filled.buffer.length,
      version,
      isFinal: false,
      generatedBy: userId,
    })
    .returning();

  // 7. Log activity
  await logActivity({
    teamId,
    userId,
    action: ActivityType.GENERATE_PDF,
    entityType: 'form',
    entityId: caseFormId,
    entityName: formCode,
    metadata: {
      version,
      fieldsFilled: filled.fieldsFilled,
      fieldsSkipped: filled.fieldsSkipped.length,
    },
  });

  return {
    pdfVersionId: pdfVersion.id,
    fileUrl,
    version,
    fieldsFilled: filled.fieldsFilled,
    fieldsSkipped: filled.fieldsSkipped,
  };
}

/**
 * Get the latest PDF version for a case form.
 */
export async function getLatestPdfVersion(caseFormId: number, teamId: number) {
  const [result] = await db
    .select({ pdfVersion: pdfVersions })
    .from(pdfVersions)
    .innerJoin(caseForms, eq(pdfVersions.caseFormId, caseForms.id))
    .innerJoin(cases, eq(caseForms.caseId, cases.id))
    .where(and(eq(pdfVersions.caseFormId, caseFormId), eq(cases.teamId, teamId)))
    .orderBy(desc(pdfVersions.version))
    .limit(1);

  return result?.pdfVersion ?? null;
}

/**
 * Get all PDF versions for a case form.
 */
export async function getPdfVersions(caseFormId: number, teamId: number) {
  const results = await db
    .select({ pdfVersion: pdfVersions })
    .from(pdfVersions)
    .innerJoin(caseForms, eq(pdfVersions.caseFormId, caseForms.id))
    .innerJoin(cases, eq(caseForms.caseId, cases.id))
    .where(and(eq(pdfVersions.caseFormId, caseFormId), eq(cases.teamId, teamId)))
    .orderBy(desc(pdfVersions.version));

  return results.map((r) => r.pdfVersion);
}

// ─── internal helpers ──────────────────────────────────────────────

async function getNextVersion(caseFormId: number): Promise<number> {
  const [latest] = await db
    .select({ version: pdfVersions.version })
    .from(pdfVersions)
    .where(eq(pdfVersions.caseFormId, caseFormId))
    .orderBy(desc(pdfVersions.version))
    .limit(1);

  return (latest?.version ?? 0) + 1;
}

async function uploadToCloudinary(
  buffer: Uint8Array,
  fileName: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  // Validate buffer
  if (!buffer || buffer.length === 0) {
    throw new Error('Cannot upload empty PDF buffer to Cloudinary');
  }

  console.log(`[Cloudinary] Uploading PDF: ${fileName} (${buffer.length} bytes)`);

  // For now, skip Cloudinary entirely due to configuration issues
  // and use local storage instead
  console.log('[Cloudinary] Skipping Cloudinary upload, using local storage instead');
  throw new Error('Cloudinary upload disabled - using local storage');

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('Cloudinary upload failed:', errText);
    throw new Error(`PDF upload to Cloudinary failed: ${errText}`);
  }

  const json = await uploadRes.json();
  console.log('[Cloudinary] Upload response:', json);

  const secureUrl = json.secure_url as string | undefined;
  if (!secureUrl) {
    console.error('Cloudinary response:', json);
    throw new Error('Cloudinary returned no secure_url');
  }

  console.log(`[Cloudinary] Successfully uploaded PDF to: ${secureUrl}`);
  return secureUrl;
}
