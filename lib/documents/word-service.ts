import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { readFile } from 'fs/promises';
import path from 'path';

export interface DocumentData {
  [key: string]: string | number | boolean | DocumentData | DocumentData[];
}

/**
 * Generate a Word document from a template and data
 * @param templateBuffer - Buffer containing the .docx template
 * @param data - Data to fill the template with
 * @returns Buffer containing the generated document
 */
export function generateWordFromTemplate(
  templateBuffer: Buffer,
  data: DocumentData
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer;
}

/**
 * Load a template from the templates directory
 * @param templateName - Name of the template file (without extension)
 * @returns Buffer containing the template
 */
export async function loadTemplate(templateName: string): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    'templates',
    `${templateName}.docx`
  );
  return readFile(templatePath);
}

/**
 * Generate a case summary document
 */
export async function generateCaseSummary(caseData: {
  caseNumber: string;
  caseType: string;
  clientName: string;
  clientEmail: string;
  status: string;
  createdAt: Date;
  notes?: string;
  forms?: Array<{ name: string; status: string }>;
}): Promise<Buffer> {
  const template = await loadTemplate('case-summary');

  return generateWordFromTemplate(template, {
    caseNumber: caseData.caseNumber,
    caseType: caseData.caseType,
    clientName: caseData.clientName,
    clientEmail: caseData.clientEmail,
    status: caseData.status,
    createdAt: caseData.createdAt.toLocaleDateString(),
    notes: caseData.notes || 'No notes',
    forms: caseData.forms || [],
    hasFormsSection: (caseData.forms?.length ?? 0) > 0,
    generatedAt: new Date().toLocaleString(),
  });
}

/**
 * Generate a client intake document
 */
export async function generateClientIntake(clientData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  currentStatus?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}): Promise<Buffer> {
  const template = await loadTemplate('client-intake');

  return generateWordFromTemplate(template, {
    ...clientData,
    fullName: `${clientData.firstName} ${clientData.lastName}`,
    addressLine1: clientData.address?.line1 || '',
    addressLine2: clientData.address?.line2 || '',
    city: clientData.address?.city || '',
    state: clientData.address?.state || '',
    zipCode: clientData.address?.zipCode || '',
    country: clientData.address?.country || 'USA',
    generatedAt: new Date().toLocaleString(),
  });
}

/**
 * Common document types for immigration cases
 */
export const DOCUMENT_TYPES = {
  CASE_SUMMARY: 'case-summary',
  CLIENT_INTAKE: 'client-intake',
  EVIDENCE_CHECKLIST: 'evidence-checklist',
  COVER_LETTER: 'cover-letter',
  DECLARATION: 'declaration',
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];
