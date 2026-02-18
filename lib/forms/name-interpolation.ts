import type { FormContext } from '@/lib/relationships/service';

// Regular expression to match placeholders like {{petitioner.firstName}}
const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;

// Supported placeholder keys
type PlaceholderKey =
  | 'petitioner.firstName'
  | 'petitioner.lastName'
  | 'petitioner.fullName'
  | 'beneficiary.firstName'
  | 'beneficiary.lastName'
  | 'beneficiary.fullName'
  | 'applicant.firstName'
  | 'applicant.lastName'
  | 'applicant.fullName'
  | 'relationship'
  | 'relationshipLabel';

// Mapping for Spanish gender-aware articles
const SPANISH_ARTICLES: Record<string, { male: string; female: string; neutral: string }> = {
  'the': { male: 'el', female: 'la', neutral: 'el/la' },
  'of': { male: 'del', female: 'de la', neutral: 'del' },
};

// Mapping for Portuguese gender-aware articles
const PORTUGUESE_ARTICLES: Record<string, { male: string; female: string; neutral: string }> = {
  'the': { male: 'o', female: 'a', neutral: 'o/a' },
  'of': { male: 'do', female: 'da', neutral: 'do' },
};

/**
 * Extract all placeholders from a template string
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(PLACEHOLDER_REGEX);
  return Array.from(matches, m => m[1]);
}

/**
 * Validate if all placeholders in a template can be resolved with the given context
 */
export function validatePlaceholders(template: string, context: FormContext): boolean {
  const placeholders = extractPlaceholders(template);

  for (const placeholder of placeholders) {
    const value = getPlaceholderValue(placeholder, context);
    if (value === null) {
      return false;
    }
  }

  return true;
}

/**
 * Get the value for a specific placeholder from the context
 */
function getPlaceholderValue(placeholder: string, context: FormContext): string | null {
  const parts = placeholder.split('.');
  const entity = parts[0];
  const field = parts[1];

  // Handle applicant as alias for petitioner (for forms where only one person is involved)
  if (entity === 'applicant') {
    if (!context.petitioner) return null;

    switch (field) {
      case 'firstName':
        return context.petitioner.firstName;
      case 'lastName':
        return context.petitioner.lastName;
      case 'fullName':
        return context.petitioner.fullName;
      default:
        return null;
    }
  }

  // Handle petitioner
  if (entity === 'petitioner') {
    if (!context.petitioner) return null;

    switch (field) {
      case 'firstName':
        return context.petitioner.firstName;
      case 'lastName':
        return context.petitioner.lastName;
      case 'fullName':
        return context.petitioner.fullName;
      default:
        return null;
    }
  }

  // Handle beneficiary
  if (entity === 'beneficiary') {
    if (!context.beneficiary) return null;

    switch (field) {
      case 'firstName':
        return context.beneficiary.firstName;
      case 'lastName':
        return context.beneficiary.lastName;
      case 'fullName':
        return context.beneficiary.fullName;
      default:
        return null;
    }
  }

  // Handle relationship
  if (placeholder === 'relationship') {
    return context.relationship || null;
  }

  if (placeholder === 'relationshipLabel') {
    return context.relationshipLabel || null;
  }

  return null;
}

/**
 * Interpolate a template string with actual names from the context
 * Returns null if interpolation fails (missing required data)
 */
export function interpolateText(
  template: string,
  context: FormContext | null,
  locale: string = 'en'
): string | null {
  // If no context or no template, return original
  if (!context || !template) {
    return template;
  }

  // Check if template has placeholders
  if (!PLACEHOLDER_REGEX.test(template)) {
    return template;
  }

  // Reset regex lastIndex
  PLACEHOLDER_REGEX.lastIndex = 0;

  // Try to interpolate
  let result = template;
  let hasFailure = false;

  result = template.replace(PLACEHOLDER_REGEX, (match, placeholder) => {
    const value = getPlaceholderValue(placeholder.trim(), context);

    if (value === null) {
      hasFailure = true;
      return match; // Keep the placeholder if we can't resolve it
    }

    return value;
  });

  // Return null if any interpolation failed
  if (hasFailure) {
    return null;
  }

  return result;
}

/**
 * Interpolate text with fallback to original if interpolation fails
 */
export function interpolateWithFallback(
  template: string,
  fallback: string,
  context: FormContext | null,
  locale: string = 'en'
): string {
  const interpolated = interpolateText(template, context, locale);
  return interpolated !== null ? interpolated : fallback;
}

/**
 * Get generic fallback labels based on locale
 */
export function getGenericLabels(locale: string): Record<string, string> {
  const labels: Record<string, Record<string, string>> = {
    en: {
      petitioner: 'the petitioner',
      beneficiary: 'the beneficiary',
      applicant: 'the applicant',
      you: 'you',
      yourSpouse: 'your spouse',
      yourChild: 'your child',
      yourParent: 'your parent',
      yourSibling: 'your sibling',
    },
    es: {
      petitioner: 'el peticionario',
      beneficiary: 'el beneficiario',
      applicant: 'el solicitante',
      you: 'usted',
      yourSpouse: 'su cónyuge',
      yourChild: 'su hijo/a',
      yourParent: 'su padre/madre',
      yourSibling: 'su hermano/a',
    },
    pt: {
      petitioner: 'o requerente',
      beneficiary: 'o beneficiário',
      applicant: 'o requerente',
      you: 'você',
      yourSpouse: 'seu cônjuge',
      yourChild: 'seu filho/a',
      yourParent: 'seu pai/mãe',
      yourSibling: 'seu irmão/irmã',
    },
  };

  return labels[locale] || labels.en;
}

/**
 * Transform a question to use appropriate relationship terms based on context
 */
export function contextualizeQuestion(
  question: string,
  context: FormContext | null,
  locale: string = 'en'
): string {
  if (!context || !context.relationship) {
    return question;
  }

  const labels = getGenericLabels(locale);

  // Map relationship to contextual terms
  const relationshipMap: Record<string, string> = {
    spouse: labels.yourSpouse,
    child: labels.yourChild,
    parent: labels.yourParent,
    sibling: labels.yourSibling,
  };

  // Replace generic terms with relationship-specific ones
  let result = question;

  // Replace "the beneficiary" with relationship-specific term
  if (context.relationship in relationshipMap) {
    const regex = new RegExp(labels.beneficiary, 'gi');
    result = result.replace(regex, relationshipMap[context.relationship]);
  }

  return result;
}

/**
 * Check if a field should use name interpolation
 */
export function shouldInterpolate(field: any): boolean {
  return field.nameInterpolation === true ||
         (field.label && field.label.includes('{{')) ||
         (field.helpText && field.helpText.includes('{{')) ||
         (field.placeholder && field.placeholder.includes('{{'));
}

/**
 * Apply interpolation to all text fields in a field object
 */
export function interpolateField(
  field: any,
  context: FormContext | null,
  locale: string = 'en'
): any {
  if (!context || !shouldInterpolate(field)) {
    return field;
  }

  const interpolated = { ...field };

  // Interpolate label
  if (field.label) {
    const newLabel = interpolateText(field.label, context, locale);
    if (newLabel !== null) {
      interpolated.label = newLabel;
    } else if (field.fallbackLabel) {
      interpolated.label = field.fallbackLabel;
    }
  }

  // Interpolate helpText
  if (field.helpText) {
    const newHelpText = interpolateText(field.helpText, context, locale);
    if (newHelpText !== null) {
      interpolated.helpText = newHelpText;
    } else if (field.fallbackHelpText) {
      interpolated.helpText = field.fallbackHelpText;
    }
  }

  // Interpolate placeholder
  if (field.placeholder) {
    const newPlaceholder = interpolateText(field.placeholder, context, locale);
    if (newPlaceholder !== null) {
      interpolated.placeholder = newPlaceholder;
    } else if (field.fallbackPlaceholder) {
      interpolated.placeholder = field.fallbackPlaceholder;
    }
  }

  // Interpolate options labels if they exist
  if (field.options && Array.isArray(field.options)) {
    interpolated.options = field.options.map((option: any) => {
      if (typeof option === 'object' && option.label) {
        const newLabel = interpolateText(option.label, context, locale);
        return {
          ...option,
          label: newLabel !== null ? newLabel : option.label,
        };
      }
      return option;
    });
  }

  return interpolated;
}