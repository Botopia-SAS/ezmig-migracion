import type { FormSchema, FormField, FormPart, FormSection } from '@/lib/forms/service';

/**
 * Walk a form schema and map formData values to PDF AcroForm field names.
 *
 * For each field that has a `pdfField`, we look up
 * `formData["${partId}.${sectionId}.${fieldId}"]` and emit
 * `{ [pdfField]: formattedValue }`.
 *
 * For fields with `subFields` (checkbox_group, radio with per-option checkboxes),
 * we emit one entry per sub-option that matches.
 */
export function mapFormDataToPdfFields(
  schema: FormSchema,
  formData: Record<string, unknown>
): Record<string, string | boolean> {
  const pdfFields: Record<string, string | boolean> = {};

  for (const part of schema.parts) {
    for (const section of part.sections) {
      for (const field of section.fields) {
        const fieldPath = `${part.id}.${section.id}.${field.id}`;
        const rawValue = formData[fieldPath];

        // Skip empty / undefined
        if (rawValue === undefined || rawValue === null || rawValue === '') {
          continue;
        }

        // Check conditional display — skip hidden fields
        if (field.conditionalDisplay && !isFieldVisible(field, formData)) {
          continue;
        }

        mapSingleField(field, rawValue, pdfFields);
      }
    }
  }

  return pdfFields;
}

// ─── helpers ───────────────────────────────────────────────────────

function mapSingleField(
  field: FormField,
  rawValue: unknown,
  out: Record<string, string | boolean>
): void {
  const { type, pdfField, subFields } = field;

  switch (type) {
    case 'checkbox_group': {
      // rawValue is a comma-separated string or array of selected values
      const selected = Array.isArray(rawValue)
        ? rawValue
        : String(rawValue).split(',').map((s) => s.trim()).filter(Boolean);

      if (subFields) {
        for (const val of selected) {
          const sub = subFields[val];
          if (sub?.pdfField) {
            out[sub.pdfField] = true;
          }
        }
      }
      break;
    }

    case 'checkbox': {
      const checked = rawValue === true || rawValue === 'true' || rawValue === 'yes';
      if (pdfField) {
        out[pdfField] = checked;
      }
      break;
    }

    case 'radio':
    case 'select': {
      const strVal = String(rawValue);

      // If subFields exist, each option value maps to a separate PDF checkbox
      if (subFields) {
        const sub = subFields[strVal];
        if (sub?.pdfField) {
          out[sub.pdfField] = true;
        }
      } else if (pdfField) {
        out[pdfField] = strVal;
      }
      break;
    }

    case 'date': {
      // USCIS format: MM/DD/YYYY
      if (pdfField) {
        out[pdfField] = formatDateForUSCIS(String(rawValue));
      }
      break;
    }

    case 'ssn': {
      // PDF field usually has maxLength 9 → digits only (no dashes)
      if (pdfField) {
        out[pdfField] = String(rawValue).replace(/\D/g, '').slice(0, 9);
      }
      break;
    }

    case 'alien_number': {
      // 9-digit A-Number, digits only
      if (pdfField) {
        out[pdfField] = String(rawValue).replace(/\D/g, '').slice(0, 9);
      }
      break;
    }

    case 'phone': {
      // Remove formatting, keep digits only (max 10 for USCIS)
      if (pdfField) {
        out[pdfField] = String(rawValue).replace(/\D/g, '').slice(0, 10);
      }
      break;
    }

    default: {
      // text, textarea, email, number, address
      if (pdfField) {
        out[pdfField] = String(rawValue);
      }
      break;
    }
  }
}

/**
 * Convert various date formats to MM/DD/YYYY for USCIS.
 * Handles ISO (YYYY-MM-DD), MM/DD/YYYY (pass-through), and others.
 */
function formatDateForUSCIS(dateStr: string): string {
  // Already in MM/DD/YYYY?
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // ISO format YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  }

  // Try parsing with Date
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // Return as-is if unparseable
  return dateStr;
}

/**
 * Check whether a field's conditionalDisplay condition is met.
 */
function isFieldVisible(
  field: FormField,
  formData: Record<string, unknown>
): boolean {
  const cond = field.conditionalDisplay;
  if (!cond) return true;

  const depValue = formData[cond.field];
  const operator = cond.operator ?? 'equals';

  switch (operator) {
    case 'equals':
      return depValue === cond.value;
    case 'notEquals':
      return depValue !== cond.value;
    case 'in':
      return Array.isArray(cond.value) && cond.value.includes(String(depValue));
    case 'notIn':
      return Array.isArray(cond.value) && !cond.value.includes(String(depValue));
    default:
      return true;
  }
}
