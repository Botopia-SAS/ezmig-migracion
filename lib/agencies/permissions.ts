import { User, TeamMember, FieldPermission } from '@/lib/db/schema';

/**
 * Definición de permisos por campo de agencia
 * Según las especificaciones del documento
 */
export const AGENCY_FIELD_PERMISSIONS: FieldPermission[] = [
  // ❌ NUNCA EDITABLES después del registro inicial
  {
    field: 'agencyType',
    editableBy: [], // INMUTABLE
    immutableAfterRegistration: true
  },
  {
    field: 'disclaimerAccepted',
    editableBy: [], // INMUTABLE
    immutableAfterRegistration: true
  },
  {
    field: 'disclaimerAcceptedAt',
    editableBy: [], // INMUTABLE
    immutableAfterRegistration: true
  },

  // 🔒 SOLO ADMIN DEL SAAS
  {
    field: 'agencyStatus',
    editableBy: ['saas_admin']
  },
  {
    field: 'completionPercentage',
    editableBy: ['saas_admin'] // Campo calculado
  },

  // 👑 SOLO OWNER DE LA AGENCIA
  {
    field: 'firmRegistrationNumber',
    editableBy: ['saas_admin', 'agency_owner']
  },
  {
    field: 'firmRegistrationState',
    editableBy: ['saas_admin', 'agency_owner']
  },
  {
    field: 'businessLicenseNumber',
    editableBy: ['saas_admin', 'agency_owner']
  },
  {
    field: 'ownerFullName',
    editableBy: ['saas_admin', 'agency_owner']
  },
  {
    field: 'ownerPosition',
    editableBy: ['saas_admin', 'agency_owner']
  },
  {
    field: 'ownerEmail',
    editableBy: ['saas_admin', 'agency_owner'],
    requiresEmailConfirmation: true
  },
  {
    field: 'ownerPhone',
    editableBy: ['saas_admin', 'agency_owner']
  },

  // 🏢 OWNER Y STAFF PUEDEN EDITAR
  {
    field: 'legalBusinessName',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'businessNameDba',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'businessEmail',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff'],
    requiresEmailConfirmation: true
  },
  {
    field: 'businessPhone',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'website',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'address',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'city',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'state',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'zipCode',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'country',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'googlePlaceId',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'coordinatesLat',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'coordinatesLng',
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  },
  {
    field: 'logoUrl', // Campo existente en teams
    editableBy: ['saas_admin', 'agency_owner', 'agency_staff']
  }
];

/**
 * Determina el rol del usuario en el contexto de la agencia
 */
export function getUserRole(user: User, teamMember: TeamMember | null): string {
  // Admin del SaaS
  if (user.role === 'admin') return 'saas_admin';

  // Roles dentro de la agencia
  if (teamMember?.role === 'owner') return 'agency_owner';
  if (teamMember?.role === 'staff') return 'agency_staff';

  return 'no_access';
}

/**
 * Valida si un usuario puede editar un campo específico de la agencia
 */
export function validateAgencyPermission(
  user: User,
  teamMember: TeamMember | null,
  field: string,
  isRegistration: boolean = false
): { allowed: boolean; reason?: string } {

  const permission = AGENCY_FIELD_PERMISSIONS.find(p => p.field === field);
  if (!permission) {
    // Si no hay regla específica, permitir (para campos no críticos)
    return { allowed: true };
  }

  // Durante registro inicial, la mayoría de campos están permitidos
  if (isRegistration) {
    // Excepto campos inmutables si ya fueron establecidos
    if (permission.immutableAfterRegistration) {
      return {
        allowed: false,
        reason: 'Field cannot be changed after registration'
      };
    }
    return { allowed: true };
  }

  // Determinar rol del usuario
  const userRole = getUserRole(user, teamMember);

  // Verificar permisos
  if (permission.editableBy.includes(userRole as any)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Insufficient permissions. Required: ${permission.editableBy.join(' or ')}`
  };
}

/**
 * Obtiene lista de campos editables para un usuario específico
 */
export function getEditableFields(
  user: User,
  teamMember: TeamMember | null,
  isRegistration: boolean = false
): string[] {
  const userRole = getUserRole(user, teamMember);

  return AGENCY_FIELD_PERMISSIONS
    .filter(permission => {
      if (isRegistration && permission.immutableAfterRegistration) {
        return false;
      }
      return permission.editableBy.includes(userRole as any);
    })
    .map(permission => permission.field);
}

/**
 * Verifica si un campo requiere confirmación por email
 */
export function requiresEmailConfirmation(field: string): boolean {
  const permission = AGENCY_FIELD_PERMISSIONS.find(p => p.field === field);
  return permission?.requiresEmailConfirmation || false;
}

/**
 * Agrupa campos por nivel de permisos para mostrar en UI
 */
export interface FieldGroup {
  title: string;
  description: string;
  fields: string[];
  requiredRole: string[];
  icon?: string;
}

export function getFieldGroups(): FieldGroup[] {
  return [
    {
      title: "Información Básica",
      description: "Información de contacto y ubicación de la agencia",
      fields: [
        'legalBusinessName',
        'businessNameDba',
        'businessEmail',
        'businessPhone',
        'website',
        'address',
        'city',
        'state',
        'zipCode'
      ],
      requiredRole: ['agency_owner', 'agency_staff'],
      icon: 'Building2'
    },
    {
      title: "Detalles Legales",
      description: "Números de registro y licencias específicas",
      fields: [
        'firmRegistrationNumber',
        'firmRegistrationState',
        'businessLicenseNumber'
      ],
      requiredRole: ['agency_owner'],
      icon: 'Scale'
    },
    {
      title: "Administrador Principal",
      description: "Información del contacto principal de la agencia",
      fields: [
        'ownerFullName',
        'ownerPosition',
        'ownerEmail',
        'ownerPhone'
      ],
      requiredRole: ['agency_owner'],
      icon: 'User'
    }
  ];
}