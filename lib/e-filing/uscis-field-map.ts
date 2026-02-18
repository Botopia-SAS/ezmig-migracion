import type { FormSchema, FormField } from '@/lib/forms/service';

/**
 * A single field mapping: tells the bot what to fill, where, and how.
 */
export interface WebFieldMapping {
  fieldPath: string;
  label: string;
  value: string;
  inputType: 'text' | 'select' | 'radio' | 'checkbox' | 'date';
  selectors?: string[];
}

/**
 * Walk the form schema + data and build a flat list of fields the bot should
 * attempt to fill on the USCIS website.
 *
 * Uses field labels for generic matching (the bot will search by label text
 * as a fallback when CSS selectors don't match).
 */
export function buildFieldMappings(
  formSchema: FormSchema,
  formData: Record<string, unknown>
): WebFieldMapping[] {
  const mappings: WebFieldMapping[] = [];

  for (const part of formSchema.parts) {
    for (const section of part.sections) {
      for (const field of section.fields) {
        const fieldPath = `${part.id}.${section.id}.${field.id}`;
        // Support both flat keys ("part1.relationship.filingFor") and nested objects
        const rawValue = getNestedValue(formData, fieldPath);

        if (rawValue === undefined || rawValue === null || rawValue === '') {
          continue;
        }

        // Skip hidden conditional fields
        if (field.conditionalDisplay && !isFieldVisible(field, formData)) {
          continue;
        }

        const inputType = resolveInputType(field.type);
        const value = formatValue(field, rawValue);

        if (value !== null) {
          mappings.push({
            fieldPath,
            label: field.label,
            value,
            inputType,
            selectors: buildSelectors(field),
          });
        }
      }
    }
  }

  return mappings;
}

// ─── Helpers ─────────────────────────────────────────────────────

function resolveInputType(
  fieldType: FormField['type']
): WebFieldMapping['inputType'] {
  switch (fieldType) {
    case 'select':
      return 'select';
    case 'radio':
      return 'radio';
    case 'checkbox':
    case 'checkbox_group':
      return 'checkbox';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

function formatValue(field: FormField, rawValue: unknown): string | null {
  const str = String(rawValue);

  switch (field.type) {
    case 'date': {
      const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
      return str;
    }
    case 'ssn':
      return str.replace(/\D/g, '').slice(0, 9);
    case 'alien_number':
      return str.replace(/\D/g, '').slice(0, 9);
    case 'phone':
      return str.replace(/\D/g, '').slice(0, 10);
    case 'checkbox':
      return rawValue === true || rawValue === 'true' ? 'true' : 'false';
    default:
      return str;
  }
}

/**
 * Build CSS selectors to try for a field. Uses the pdfField name (which often
 * matches USCIS HTML ids/names) and the field label as aria-label fallback.
 */
function buildSelectors(field: FormField): string[] {
  const selectors: string[] = [];

  if (field.pdfField) {
    // USCIS online forms sometimes use the same field naming as the PDF
    const cleanName = field.pdfField
      .replace(/^form1\[0\]\./, '')
      .replace(/\[\d+\]/g, '')
      .replace(/^P\d+\./, '');
    selectors.push(`[name*="${cleanName}"]`);
    selectors.push(`[id*="${cleanName}"]`);
  }

  // Fallback: aria-label or placeholder matching
  const labelWords = field.label
    .replace(/[()]/g, '')
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  selectors.push(`[aria-label*="${labelWords}" i]`);
  selectors.push(`[placeholder*="${labelWords}" i]`);

  return selectors;
}

/**
 * Resolves a dot-separated path against a nested object.
 * Falls back to flat key lookup if nested resolution fails.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  // Try flat key first (for pre-flattened data)
  if (path in obj) return obj[path];

  // Walk nested structure
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function isFieldVisible(
  field: FormField,
  formData: Record<string, unknown>
): boolean {
  const cond = field.conditionalDisplay;
  if (!cond) return true;

  const depValue = getNestedValue(formData, cond.field);
  const operator = cond.operator ?? 'equals';

  switch (operator) {
    case 'equals':
      return depValue === cond.value;
    case 'notEquals':
      return depValue !== cond.value;
    case 'in':
      return Array.isArray(cond.value) && cond.value.includes(String(depValue));
    case 'notIn':
      return (
        Array.isArray(cond.value) && !cond.value.includes(String(depValue))
      );
    default:
      return true;
  }
}
