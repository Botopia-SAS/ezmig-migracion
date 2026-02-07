import { AgencyRegistrationData } from '@/lib/db/schema';

/**
 * Calcula el porcentaje de completitud de un perfil de agencia
 * Basado en las especificaciones: 9 campos importantes para el cálculo
 */
export function calculateCompletionPercentage(data: AgencyRegistrationData): number {
  const requiredFields = [
    'legalBusinessName',
    'businessEmail',
    'businessPhone',
    'address',
    'city',
    'state',
    'zipCode',
    'ownerFullName',
    'ownerEmail'
  ] as const;

  const completedFields = requiredFields.filter(field => {
    const value = data[field];
    return value && value.trim().length > 0;
  }).length;

  return Math.round((completedFields / requiredFields.length) * 100);
}

/**
 * Determina el estado de la agencia basado en el porcentaje de completitud
 */
export function determineAgencyStatus(completionPercentage: number): 'incomplete' | 'pending' {
  // Si tiene 7 de 9 campos (77% o más) = pending
  // Si tiene menos = incomplete
  return completionPercentage >= 77 ? 'pending' : 'incomplete';
}

/**
 * Valida que el disclaimer esté aceptado para servicios de inmigración
 */
export function validateDisclaimer(data: AgencyRegistrationData): { valid: boolean; error?: string } {
  if (data.agencyType === 'immigration_services' && !data.disclaimerAccepted) {
    return {
      valid: false,
      error: 'You must accept the disclaimer to continue'
    };
  }

  return { valid: true };
}

/**
 * Lista de estados que requieren licencia específica para servicios de inmigración
 */
export const STATES_REQUIRING_LICENSE = ['CA', 'NY', 'IL', 'NV', 'OR'];

/**
 * Verifica si un estado requiere licencia específica
 */
export function requiresStateLicense(state?: string): boolean {
  if (!state) return false;
  return STATES_REQUIRING_LICENSE.includes(state.toUpperCase());
}

/**
 * Genera mensaje de advertencia para estados que requieren licencia
 */
export function getStateLicenseWarning(state: string): string | null {
  if (!requiresStateLicense(state)) return null;

  return `⚠️ Su estado requiere licencia específica para operar servicios de inmigración. Le recomendamos agregar el número de licencia ahora, pero puede hacerlo más tarde.`;
}

/**
 * Formatea número de teléfono automáticamente
 */
export function formatPhoneNumber(phone: string): string {
  // Remover todo excepto números
  const numbers = phone.replace(/\D/g, '');

  // Si tiene 10 dígitos, formatear como (123) 456-7890
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }

  // Si tiene 11 dígitos y empieza con 1, remover el 1 y formatear
  if (numbers.length === 11 && numbers[0] === '1') {
    const cleaned = numbers.slice(1);
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Devolver como está si no coincide con formato esperado
  return phone;
}

/**
 * Valida formato de código postal USA
 */
export function validateZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Auto-completa https:// para URLs
 */
export function normalizeWebsite(website: string): string {
  if (!website) return website;

  const trimmed = website.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Valida formato de email de manera básica
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Cuenta campos vacíos importantes para el modal de advertencia
 */
export function countEmptyImportantFields(data: AgencyRegistrationData): {
  count: number;
  fields: string[];
} {
  const importantFields = [
    { key: 'legalBusinessName', label: 'Nombre legal de la empresa' },
    { key: 'businessEmail', label: 'Email de la empresa' },
    { key: 'address', label: 'Dirección completa' },
    { key: 'ownerFullName', label: 'Nombre del administrador' },
    { key: 'ownerEmail', label: 'Email del administrador' }
  ];

  const emptyFields = importantFields.filter(field => {
    const value = data[field.key as keyof AgencyRegistrationData];
    return !value || (typeof value === 'string' && value.trim().length === 0);
  });

  return {
    count: emptyFields.length,
    fields: emptyFields.map(f => f.label)
  };
}