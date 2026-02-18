import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import path from 'path';

export interface FormFieldValue {
  name: string;
  value: string | boolean;
  type?: 'text' | 'checkbox' | 'dropdown' | 'radio';
}

export interface FilledPDFResult {
  buffer: Uint8Array;
  fileName: string;
  fieldsFilled: number;
  fieldsSkipped: string[];
}

/**
 * Load PDF bytes from a source (URL, file path, or ArrayBuffer)
 */
async function loadPdfBytes(source: string | ArrayBuffer): Promise<ArrayBuffer> {
  if (source instanceof ArrayBuffer) {
    return source;
  }
  if (source.startsWith('http')) {
    const response = await fetch(source);
    return response.arrayBuffer();
  }
  const buffer = await readFile(source);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * Fill a USCIS PDF form with provided data.
 * USCIS PDFs are encrypted, so we use ignoreEncryption: true.
 * @param templateSource - Path, URL, or ArrayBuffer of the PDF template
 * @param formData - Record of field names to values
 * @returns Filled PDF as Uint8Array
 */
export async function fillUSCISForm(
  templateSource: string | ArrayBuffer,
  formData: Record<string, string | boolean>
): Promise<FilledPDFResult> {
  const pdfBytes = await loadPdfBytes(templateSource);

  if (!pdfBytes || pdfBytes.byteLength === 0) {
    throw new Error('Failed to load PDF template: empty or invalid buffer');
  }

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false
    });
  } catch (error) {
    console.error('Failed to load PDF document:', error);
    // Try loading with a different approach for problematic PDFs
    try {
      console.log('Attempting to load PDF with minimal parsing...');
      pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes), {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false
      });
    } catch (retryError) {
      console.error('Second attempt to load PDF also failed:', retryError);
      throw new Error(`Failed to load PDF document: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  if (!pdfDoc) {
    throw new Error('PDF document is undefined after loading');
  }

  let form;
  try {
    form = pdfDoc.getForm();
  } catch (formError) {
    console.error('Failed to get PDF form:', formError);
    throw new Error(`Failed to access PDF form fields: ${formError instanceof Error ? formError.message : 'unknown error'}`);
  }

  let fieldsFilled = 0;
  const fieldsSkipped: string[] = [];

  for (const [fieldName, value] of Object.entries(formData)) {
    try {
      const field = form.getField(fieldName);

      if (field instanceof PDFTextField) {
        field.setText(String(value));
        fieldsFilled++;
      } else if (field instanceof PDFCheckBox) {
        if (value === true || value === 'true' || value === 'Yes') {
          field.check();
        } else {
          field.uncheck();
        }
        fieldsFilled++;
      } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) {
        field.select(String(value));
        fieldsFilled++;
      }
    } catch {
      fieldsSkipped.push(fieldName);
    }
  }

  // Skip appearance updates — USCIS AcroForm templates contain rich-text
  // fields that cause pdf-lib to throw when regenerating appearances.
  let filledPdfBytes;
  try {
    filledPdfBytes = await pdfDoc.save({
      updateFieldAppearances: false,
      useObjectStreams: false  // Disable object streams for better compatibility
    });
  } catch (saveError) {
    console.error('Failed to save PDF:', saveError);
    // Try saving without any options as a last resort
    try {
      console.log('Attempting to save PDF with minimal options...');
      filledPdfBytes = await pdfDoc.save();
    } catch (retrySaveError) {
      console.error('Second attempt to save PDF also failed:', retrySaveError);
      throw new Error(`Failed to save PDF: ${saveError instanceof Error ? saveError.message : 'unknown error'}`);
    }
  }

  if (!filledPdfBytes || filledPdfBytes.length === 0) {
    throw new Error('PDF save produced empty or invalid output');
  }

  return {
    buffer: filledPdfBytes,
    fileName: typeof templateSource === 'string' ? path.basename(templateSource) : 'filled-form.pdf',
    fieldsFilled,
    fieldsSkipped,
  };
}

/**
 * Get all field names from a PDF form
 * @param templateSource - Path, URL, or ArrayBuffer of the PDF template
 * @returns Array of field information
 */
export async function getFormFields(templateSource: string | ArrayBuffer): Promise<Array<{
  name: string;
  type: string;
  isReadOnly: boolean;
  isRequired: boolean;
}>> {
  const pdfBytes = await loadPdfBytes(templateSource);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  return fields.map((field) => {
    let type = 'unknown';
    if (field instanceof PDFTextField) type = 'text';
    else if (field instanceof PDFCheckBox) type = 'checkbox';
    else if (field instanceof PDFDropdown) type = 'dropdown';
    else if (field instanceof PDFRadioGroup) type = 'radio';

    return {
      name: field.getName(),
      type,
      isReadOnly: field.isReadOnly(),
      isRequired: field.isRequired(),
    };
  });
}

/**
 * Common USCIS form templates
 */
export const USCIS_FORMS = {
  'I-130': {
    name: 'Petition for Alien Relative',
    description: 'Used by U.S. citizens and permanent residents to establish a relationship with eligible relatives',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-130.pdf',
  },
  'I-485': {
    name: 'Application to Register Permanent Residence or Adjust Status',
    description: 'Used to apply for lawful permanent resident status (Green Card)',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf',
  },
  'I-765': {
    name: 'Application for Employment Authorization',
    description: 'Used to request an Employment Authorization Document (EAD)',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf',
  },
  'I-131': {
    name: 'Application for Travel Document',
    description: 'Used to apply for Advance Parole, Refugee Travel Document, or Reentry Permit',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-131.pdf',
  },
  'I-864': {
    name: 'Affidavit of Support Under Section 213A of the INA',
    description: 'Financial sponsor form required for most family-based immigrants',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf',
  },
  'N-400': {
    name: 'Application for Naturalization',
    description: 'Used to apply for U.S. citizenship',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf',
  },
  'I-129F': {
    name: 'Petition for Alien Fiancé(e)',
    description: 'Used by U.S. citizens to petition for fiancé(e) to come to the U.S.',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-129f.pdf',
  },
  'I-140': {
    name: 'Immigrant Petition for Alien Workers',
    description: 'Used by employers to petition for employment-based immigrant visas',
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-140.pdf',
  },
} as const;

export type USCISFormCode = keyof typeof USCIS_FORMS;

/**
 * Map case form data to USCIS PDF field names
 * This is a simplified example - actual mappings would be more complex
 */
export function mapCaseDataToFormFields(
  formCode: USCISFormCode,
  caseData: Record<string, unknown>
): Record<string, string | boolean> {
  // Base mapping that would be customized per form
  const baseMapping: Record<string, string | boolean> = {};

  // Common fields across forms
  if (caseData.firstName) {
    baseMapping['Pt1Line1a_GivenName'] = String(caseData.firstName);
  }
  if (caseData.lastName) {
    baseMapping['Pt1Line1b_FamilyName'] = String(caseData.lastName);
  }
  if (caseData.middleName) {
    baseMapping['Pt1Line1c_MiddleName'] = String(caseData.middleName);
  }
  if (caseData.dateOfBirth) {
    baseMapping['Pt1Line7_DOB'] = String(caseData.dateOfBirth);
  }
  if (caseData.email) {
    baseMapping['Pt1Line14_Email'] = String(caseData.email);
  }
  if (caseData.phone) {
    baseMapping['Pt1Line13_DaytimePhone'] = String(caseData.phone);
  }

  // Address fields
  if (caseData.addressLine1) {
    baseMapping['Pt1Line8a_StreetNumberName'] = String(caseData.addressLine1);
  }
  if (caseData.city) {
    baseMapping['Pt1Line8c_CityOrTown'] = String(caseData.city);
  }
  if (caseData.state) {
    baseMapping['Pt1Line8d_State'] = String(caseData.state);
  }
  if (caseData.zipCode) {
    baseMapping['Pt1Line8e_ZipCode'] = String(caseData.zipCode);
  }

  return baseMapping;
}
