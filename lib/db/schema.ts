import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

// Roles globales del sistema
export const userRoleEnum = pgEnum('user_role', [
  'admin',      // Dueño/Admin del SaaS
  'attorney',   // Abogado (Owner de un tenant)
  'staff',      // Staff de un law firm
  'end_user',   // Cliente final (portal separado - futuro)
]);

// Roles dentro de un tenant/team
export const tenantRoleEnum = pgEnum('tenant_role', [
  'owner',   // Dueño del tenant (abogado principal)
  'staff',   // Empleado del law firm
  'client',  // Cliente del abogado
]);

// ============================================
// NUEVOS ENUMS - M2-M4
// ============================================

// Tipos de caso de inmigración
export const caseTypeEnum = pgEnum('case_type', [
  'family_based',     // Petición familiar
  'employment',       // Basado en empleo
  'asylum',           // Asilo
  'naturalization',   // Naturalización
  'adjustment',       // Ajuste de estatus
  'removal_defense',  // Defensa de deportación
  'visa',             // Visas
  'other',            // Otros
]);

// Estado del caso
export const caseStatusEnum = pgEnum('case_status', [
  'intake',       // Recepción inicial
  'in_progress',  // En progreso
  'submitted',    // Enviado a USCIS
  'approved',     // Aprobado
  'denied',       // Denegado
  'on_hold',      // En espera
  'closed',       // Cerrado
]);

// Prioridad del caso
export const casePriorityEnum = pgEnum('case_priority', [
  'low',
  'normal',
  'high',
  'urgent',
]);

// Estado del formulario
export const formStatusEnum = pgEnum('form_status', [
  'not_started',  // Sin comenzar
  'in_progress',  // En progreso
  'completed',    // Completado
  'submitted',    // Enviado
]);

// Estado de validación de evidencia
export const validationStatusEnum = pgEnum('validation_status', [
  'pending',       // Pendiente de revisión
  'valid',         // Válido
  'invalid',       // Inválido
  'needs_review',  // Necesita revisión
]);

// Tipo de agencia (no puede cambiar después del registro)
export const agencyTypeEnum = pgEnum('agency_type', [
  'law_firm',           // Bufete de abogados
  'immigration_services', // Servicios de inmigración
]);

// Estado de la agencia
export const agencyStatusEnum = pgEnum('agency_status', [
  'incomplete',  // < 7 campos completados
  'pending',     // Completo, esperando aprobación
  'active',      // Aprobado y operativo
  'suspended',   // Suspendido temporalmente
  'inactive',    // Desactivado
]);

// ============================================
// NUEVOS ENUMS - TEAM MEMBERS & FREELANCERS
// ============================================

// Tipos de perfil de usuario
export const userProfileTypeEnum = pgEnum('user_profile_type', [
  'agency',
  'team_member',
  'freelancer'
]);

// Roles para Team Members
export const teamMemberRoleEnum = pgEnum('team_member_role', [
  'attorney',           // Abogado
  'paralegal',         // Paralegal
  'legal_assistant',   // Asistente legal
  'admin_assistant',   // Asistente administrativo
  'receptionist',      // Recepcionista
  'other'              // Otro (especificar en custom_role_description)
]);

// Tipos de profesional Freelancer
export const freelancerTypeEnum = pgEnum('freelancer_type', [
  'immigration_attorney',  // Abogado de inmigración
  'form_preparer'         // Preparador de formularios
]);

// Especialidades (compartidas entre Team Members y Freelancers)
export const specialtyEnum = pgEnum('specialty', [
  'asylum',                    // Asilo
  'tps',                      // TPS (Temporary Protected Status)
  'daca',                     // DACA
  'adjustment_status_i485',   // Ajuste de estatus (I-485)
  'family_petitions_i130',    // Peticiones familiares (I-130)
  'employment_petitions_i140', // Peticiones laborales (I-140)
  'work_permit_i765',         // Permiso de trabajo (I-765)
  'naturalization',           // Naturalización
  'deportation_defense',      // Defensa de deportación
  'vawa',                     // VAWA
  'u_visa',                   // U Visa
  't_visa',                   // T Visa
  'other'                     // Otra (especificar en custom)
]);

// Idiomas (compartidos entre Team Members y Freelancers)
export const languageEnum = pgEnum('language', [
  'english',
  'spanish',
  'mandarin',
  'cantonese',
  'tagalog',
  'vietnamese',
  'korean',
  'french',
  'haitian_creole',
  'portuguese',
  'arabic',
  'russian',
  'other'  // Otro (especificar en custom)
]);

// Tipos de entidad comercial para Freelancers
export const businessEntityTypeEnum = pgEnum('business_entity_type', [
  'sole_proprietor',    // Propietario único
  'llc_single_member',  // LLC (Miembro único)
  'llc_multi_member',   // LLC (Múltiples miembros)
  'c_corp',            // Corporation (C-Corp)
  's_corp'             // Corporation (S-Corp)
]);

// Tipo de notificación
export const notificationTypeEnum = pgEnum('notification_type', [
  'case_update',        // Actualización de caso
  'form_completed',     // Formulario completado
  'deadline',           // Fecha límite próxima
  'uscis_status',       // Cambio de estado USCIS
  'document_request',   // Solicitud de documentos
  'payment',            // Relacionado con pagos
  'system',             // Sistema
  'client_registered',  // Nuevo cliente registrado via referral
]);

// Tipos de relación para casos (peticionario-beneficiario)
export const relationshipTypeEnum = pgEnum('relationship_type', [
  'spouse',             // Esposo/Esposa
  'parent',             // Padre/Madre
  'child',              // Hijo/Hija
  'sibling',            // Hermano/Hermana
  'grandparent',        // Abuelo/Abuela
  'grandchild',         // Nieto/Nieta
  'stepparent',         // Padrastro/Madrastra
  'stepchild',          // Hijastro/Hijastra
  'employer',           // Empleador
  'employee',           // Empleado
  'self',               // Uno mismo (para casos donde peticionario = beneficiario)
  'other',              // Otro
]);

// ============================================
// TABLAS EXISTENTES (MODIFICADAS)
// ============================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('attorney'),
  profileType: userProfileTypeEnum('profile_type'), // Nuevo campo para tipo de perfil
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // Stripe fields
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  // Tipo de tenant
  type: varchar('type', { length: 20 }).notNull().default('law_firm'),
  // ============================================
  // CAMPOS DE AGENCIA - REGISTRO
  // ============================================

  // Tipo y estado de agencia (INMUTABLE después del registro)
  agencyType: agencyTypeEnum('agency_type'),
  agencyStatus: agencyStatusEnum('agency_status').default('incomplete'),
  completionPercentage: integer('completion_percentage').default(0),

  // Información básica de la empresa (EDITABLES)
  legalBusinessName: varchar('legal_business_name', { length: 255 }),
  businessNameDba: varchar('business_name_dba', { length: 255 }),
  businessEmail: varchar('business_email', { length: 255 }),
  businessPhone: varchar('business_phone', { length: 20 }),
  website: varchar('website', { length: 500 }),

  // Dirección física (EDITABLES)
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('USA'),

  // Google Maps data
  googlePlaceId: varchar('google_place_id', { length: 255 }),
  coordinatesLat: varchar('coordinates_lat', { length: 50 }), // Como string para mayor precisión
  coordinatesLng: varchar('coordinates_lng', { length: 50 }),

  // Campos específicos por tipo de agencia (SOLO OWNER)
  firmRegistrationNumber: varchar('firm_registration_number', { length: 100 }),
  firmRegistrationState: varchar('firm_registration_state', { length: 50 }),
  businessLicenseNumber: varchar('business_license_number', { length: 100 }),
  disclaimerAccepted: boolean('disclaimer_accepted').default(false),
  disclaimerAcceptedAt: timestamp('disclaimer_accepted_at'),

  // Información del contacto principal/owner (SOLO OWNER)
  ownerFullName: varchar('owner_full_name', { length: 255 }),
  ownerPosition: varchar('owner_position', { length: 100 }),
  ownerEmail: varchar('owner_email', { length: 255 }),
  ownerPhone: varchar('owner_phone', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: tenantRoleEnum('role').notNull().default('staff'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  // Enhanced audit fields
  entityType: varchar('entity_type', { length: 50 }), // 'client', 'case', 'form', 'evidence', 'referral', 'user', 'team', 'token'
  entityId: integer('entity_id'),
  entityName: varchar('entity_name', { length: 255 }), // Display name (e.g., "EZM-2026-00001", "John Doe")
  metadata: jsonb('metadata'), // Additional context as JSON
  changes: jsonb('changes'), // { field: { old: x, new: y } }
  userAgent: text('user_agent'), // Browser/device info
}, (t) => [
  index('idx_activity_logs_team_timestamp').on(t.teamId, t.timestamp),
]);

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: tenantRoleEnum('role').notNull().default('staff'),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// ============================================
// API KEYS - Bearer Token Authentication
// ============================================

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  scopes: jsonb('scopes').notNull().$type<string[]>(),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  isActive: boolean('is_active').notNull().default(true),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_api_keys_team_id').on(t.teamId),
  index('idx_api_keys_key_prefix').on(t.keyPrefix),
]);

// ============================================
// NUEVAS TABLAS - M2: CLIENTES Y CASOS
// ============================================

// Clientes finales del abogado
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id), // NULL hasta que active cuenta

  // Datos personales
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  countryOfBirth: varchar('country_of_birth', { length: 100 }),
  nationality: varchar('nationality', { length: 100 }),

  // Inmigración
  alienNumber: varchar('alien_number', { length: 20 }), // A-Number
  uscisOnlineAccount: varchar('uscis_online_account', { length: 100 }),
  currentStatus: varchar('current_status', { length: 50 }), // H1B, F1, B2, etc.

  // Dirección
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('USA'),

  // Metadata
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Casos de inmigración
export const cases = pgTable('cases', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),

  // Identificadores
  caseNumber: varchar('case_number', { length: 50 }).unique(), // Interno: EZM-2024-00001
  uscisReceiptNumber: varchar('uscis_receipt_number', { length: 20 }), // NBC-123456789

  // Tipo y estado
  caseType: caseTypeEnum('case_type').notNull(),
  status: caseStatusEnum('status').notNull().default('intake'),
  priority: casePriorityEnum('priority').notNull().default('normal'),

  // Fechas
  intakeDate: date('intake_date').defaultNow(),
  filingDeadline: date('filing_deadline'),
  submittedDate: date('submitted_date'),
  decisionDate: date('decision_date'),

  // Asignación
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),

  // Notas
  internalNotes: text('internal_notes'),

  // Metadata
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Relaciones entre personas en un caso (peticionario-beneficiario)
export const caseRelationships = pgTable('case_relationships', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id')
    .notNull()
    .references(() => cases.id, { onDelete: 'cascade' }),

  // Peticionario (quien solicita)
  petitionerId: integer('petitioner_id')
    .notNull()
    .references(() => clients.id),

  // Beneficiario (para quien se solicita)
  beneficiaryId: integer('beneficiary_id')
    .references(() => clients.id), // Puede ser NULL si aún no está registrado

  // Tipo de relación
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  relationshipDetails: text('relationship_details'), // Detalles adicionales si es 'other'

  // Información adicional para contexto
  isPrimaryRelationship: boolean('is_primary_relationship').notNull().default(true),
  marriageDate: date('marriage_date'), // Si aplica
  divorceDate: date('divorce_date'), // Si aplica

  // Metadata
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// NUEVAS TABLAS - M3: FORMULARIOS
// ============================================

// Catálogo de formularios USCIS
export const formTypes = pgTable('form_types', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(), // I-130, I-485, etc.
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Schema JSON del formulario
  formSchema: jsonb('form_schema').notNull(), // Definición de campos
  validationRules: jsonb('validation_rules'), // Reglas de validación

  // Configuración
  estimatedTimeMinutes: integer('estimated_time_minutes'),
  category: varchar('category', { length: 50 }), // family, employment, humanitarian

  // Versión
  uscisEdition: varchar('uscis_edition', { length: 50 }), // "03/31/2023"
  version: integer('version').notNull().default(1),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Formularios asociados a un caso
export const caseForms = pgTable('case_forms', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id')
    .notNull()
    .references(() => cases.id),
  formTypeId: integer('form_type_id')
    .notNull()
    .references(() => formTypes.id),

  // Estado
  status: formStatusEnum('status').notNull().default('not_started'),
  progressPercentage: integer('progress_percentage').notNull().default(0),

  // Datos del formulario (JSON)
  formData: jsonb('form_data').default({}),

  // Tracking
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  submittedAt: timestamp('submitted_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_case_forms_case_status').on(t.caseId, t.status),
]);

// Guardado automático por campo
export const formFieldAutosaves = pgTable('form_field_autosaves', {
  id: serial('id').primaryKey(),
  caseFormId: integer('case_form_id')
    .notNull()
    .references(() => caseForms.id),
  fieldPath: varchar('field_path', { length: 255 }).notNull(), // "part1.petitioner.firstName"
  fieldValue: text('field_value'),

  savedBy: integer('saved_by').references(() => users.id),
  savedAt: timestamp('saved_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_form_field_autosaves_case_form_field').on(t.caseFormId, t.fieldPath),
]);

// Historial de envíos
export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  caseFormId: integer('case_form_id')
    .notNull()
    .references(() => caseForms.id),

  // Snapshot del formulario
  formDataSnapshot: jsonb('form_data_snapshot').notNull(),

  // Estado del envío
  submissionType: varchar('submission_type', { length: 30 }), // draft, efiling, mail
  status: varchar('status', { length: 30 }).notNull().default('pending'), // pending, submitted, confirmed, failed

  // e-Filing info
  efilingConfirmation: varchar('efiling_confirmation', { length: 100 }),
  efilingError: text('efiling_error'),

  // PDF generado
  pdfVersionId: integer('pdf_version_id'),

  submittedBy: integer('submitted_by').references(() => users.id),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

// ============================================
// NUEVAS TABLAS - M3: EVIDENCIAS
// ============================================

// Documentos de soporte
export const evidences = pgTable('evidences', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id')
    .notNull()
    .references(() => cases.id),
  caseFormId: integer('case_form_id').references(() => caseForms.id), // Opcional
  fieldPath: varchar('field_path', { length: 255 }), // "part1.section1.fieldId" — links to specific form field

  // Archivo
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }), // pdf, jpg, png
  fileSize: integer('file_size'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),

  // Clasificación
  category: varchar('category', { length: 100 }), // identity, financial, relationship
  subcategory: varchar('subcategory', { length: 100 }),
  documentDate: date('document_date'),

  // Validación
  validationStatus: validationStatusEnum('validation_status').notNull().default('pending'),
  validationNotes: text('validation_notes'),
  validatedBy: integer('validated_by').references(() => users.id),
  validatedAt: timestamp('validated_at'),

  // Metadata
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('idx_evidences_case_form_field_path').on(t.caseFormId, t.fieldPath),
]);

// Reglas de evidencia por tipo de caso/formulario
export const evidenceRules = pgTable('evidence_rules', {
  id: serial('id').primaryKey(),
  formTypeId: integer('form_type_id').references(() => formTypes.id),
  caseType: caseTypeEnum('case_type'),

  // Regla
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  isRequired: boolean('is_required').notNull().default(false),
  description: text('description'),
  instructions: text('instructions'),

  // Validación automática
  autoValidationRules: jsonb('auto_validation_rules'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// NUEVAS TABLAS - M2: REFERRAL LINKS
// ============================================

// Links de activación para clientes
export const referralLinks = pgTable('referral_links', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }),

  // Link
  code: varchar('code', { length: 50 }).notNull().unique(), // UUID corto

  // Configuración
  expiresAt: timestamp('expires_at'),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').notNull().default(0),

  // Tipos de formulario obligatorios
  formTypeIds: jsonb('form_type_ids').notNull().$type<number[]>().default([]),
  allowedSections: jsonb('allowed_sections'), // Secciones específicas

  // Estado
  isActive: boolean('is_active').notNull().default(true),

  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_referral_links_team_active').on(t.teamId, t.isActive, t.expiresAt),
]);

// Tracking de uso de links
export const referralLinkUsage = pgTable('referral_link_usage', {
  id: serial('id').primaryKey(),
  referralLinkId: integer('referral_link_id')
    .notNull()
    .references(() => referralLinks.id),
  userId: integer('user_id').references(() => users.id),

  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),

  action: varchar('action', { length: 50 }), // visited, form_started, form_completed
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_referral_link_usage_link').on(t.referralLinkId),
]);

// ============================================
// NUEVAS TABLAS - M4: USCIS TRACKER
// ============================================

// Estado de casos en USCIS
export const uscisCaseStatus = pgTable('uscis_case_status', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id')
    .notNull()
    .references(() => cases.id),
  receiptNumber: varchar('receipt_number', { length: 20 }).notNull(),

  // Estado actual
  currentStatus: varchar('current_status', { length: 255 }),
  statusDescription: text('status_description'),
  lastCheckedAt: timestamp('last_checked_at'),

  // Historial de estados
  statusHistory: jsonb('status_history').default([]),

  // Notificaciones
  notifyOnChange: boolean('notify_on_change').notNull().default(true),
  lastNotifiedStatus: varchar('last_notified_status', { length: 255 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// NUEVAS TABLAS - M4: AI Y PDFS
// ============================================

// Logs de interacciones con AI
export const aiLogs = pgTable('ai_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  caseId: integer('case_id').references(() => cases.id),
  caseFormId: integer('case_form_id').references(() => caseForms.id),

  // Request
  prompt: text('prompt').notNull(),
  context: jsonb('context'),

  // Response
  response: text('response'),
  model: varchar('model', { length: 100 }),
  tokensUsed: integer('tokens_used'),

  // Metadata
  actionType: varchar('action_type', { length: 50 }), // form_fill, translation, review, question
  responseTimeMs: integer('response_time_ms'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Versiones de PDFs generados
export const pdfVersions = pgTable('pdf_versions', {
  id: serial('id').primaryKey(),
  caseFormId: integer('case_form_id')
    .notNull()
    .references(() => caseForms.id),

  // Archivo
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSize: integer('file_size'),

  // Metadata
  version: integer('version').notNull().default(1),
  isFinal: boolean('is_final').notNull().default(false),

  generatedBy: integer('generated_by').references(() => users.id),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
});

// ============================================
// NUEVAS TABLAS - NOTIFICACIONES
// ============================================

// Notificaciones del sistema
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').references(() => teams.id),

  // Contenido
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),

  // Referencias
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  caseFormId: integer('case_form_id').references(() => caseForms.id, { onDelete: 'cascade' }),

  // Estado
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),

  // Metadata
  actionUrl: varchar('action_url', { length: 255 }),
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_notifications_user_read').on(t.userId, t.isRead, t.createdAt),
]);

// ============================================
// NUEVAS TABLAS - TEAM MEMBERS & FREELANCERS
// ============================================

// Tabla para Team Members (empleados de agencias)
export const teamMembersProfiles = pgTable('team_members_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  agencyId: integer('agency_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),

  // Información Básica (recomendados)
  fullName: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),

  // Rol y especialización
  role: teamMemberRoleEnum('role').notNull(),
  customRoleDescription: text('custom_role_description'),
  specialties: varchar('specialties', { length: 50 }).array(),
  customSpecialties: text('custom_specialties').array(),

  // Campos específicos para abogados
  barNumber: varchar('bar_number', { length: 100 }),
  barState: varchar('bar_state', { length: 2 }),

  // Perfil profesional
  profilePhotoUrl: text('profile_photo_url'),
  bio: text('bio'),
  languages: varchar('languages', { length: 50 }).array(),
  customLanguages: text('custom_languages').array(),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_team_members_profiles_agency').on(t.agencyId),
  index('idx_team_members_profiles_role').on(t.role),
  uniqueIndex('idx_team_members_profiles_user_agency').on(t.userId, t.agencyId),
]);

// Tabla para Freelancers (profesionales independientes)
export const freelancersProfiles = pgTable('freelancers_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Selector inicial obligatorio
  professionalType: freelancerTypeEnum('professional_type').notNull(),

  // Información personal (recomendados)
  fullName: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  primaryState: varchar('primary_state', { length: 2 }),
  primaryCity: varchar('primary_city', { length: 100 }),

  // Campos para abogados
  barNumber: varchar('bar_number', { length: 100 }),
  primaryBarState: varchar('primary_bar_state', { length: 2 }),
  additionalBarStates: varchar('additional_bar_states', { length: 2 }).array(),
  specialties: varchar('specialties', { length: 50 }).array(),
  customSpecialties: text('custom_specialties').array(),

  // Campos para preparadores
  businessLicenseNumber: varchar('business_license_number', { length: 100 }),
  disclaimerAccepted: boolean('disclaimer_accepted').default(false),
  disclaimerAcceptedAt: timestamp('disclaimer_accepted_at'),

  // Información de empresa (opcional)
  hasBusiness: boolean('has_business').default(false),
  businessName: varchar('business_name', { length: 255 }),
  businessEntityType: businessEntityTypeEnum('business_entity_type'),
  businessWebsite: text('business_website'),

  // Perfil profesional completo
  profilePhotoUrl: text('profile_photo_url'),
  bio: text('bio'),
  yearsExperience: integer('years_experience'),
  languages: varchar('languages', { length: 50 }).array(),
  customLanguages: text('custom_languages').array(),

  // Ubicación y contacto profesional
  officeAddress: text('office_address'),
  officeCity: varchar('office_city', { length: 100 }),
  officeState: varchar('office_state', { length: 2 }),
  officeZipCode: varchar('office_zip_code', { length: 20 }),
  googlePlaceId: text('google_place_id'),
  coordinatesLat: text('coordinates_lat'),
  coordinatesLng: text('coordinates_lng'),

  // Redes y web
  linkedinUrl: text('linkedin_url'),
  personalWebsite: text('personal_website'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_freelancers_profiles_type').on(t.professionalType),
  index('idx_freelancers_profiles_state').on(t.primaryState),
  index('idx_freelancers_profiles_specialties').on(t.specialties),
]);

// ============================================
// RELACIONES
// ============================================

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  // M2-M4 relations
  clients: many(clients),
  cases: many(cases),
  referralLinks: many(referralLinks),
  aiLogs: many(aiLogs),
  notifications: many(notifications),
  apiKeys: many(apiKeys),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  // M2-M4 relations
  clientAccount: many(clients), // If user is linked as a client
  assignedCases: many(cases),
  notifications: many(notifications),
  aiLogs: many(aiLogs),
  apiKeys: many(apiKeys),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  team: one(teams, {
    fields: [apiKeys.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ============================================
// RELACIONES M2-M4
// ============================================

export const clientsRelations = relations(clients, ({ one, many }) => ({
  team: one(teams, {
    fields: [clients.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  cases: many(cases),
  relationshipsAsPetitioner: many(caseRelationships, {
    relationName: 'petitioner',
  }),
  relationshipsAsBeneficiary: many(caseRelationships, {
    relationName: 'beneficiary',
  }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  team: one(teams, {
    fields: [cases.teamId],
    references: [teams.id],
  }),
  client: one(clients, {
    fields: [cases.clientId],
    references: [clients.id],
  }),
  assignedToUser: one(users, {
    fields: [cases.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
  }),
  caseForms: many(caseForms),
  evidences: many(evidences),
  referralLinks: many(referralLinks),
  relationships: many(caseRelationships),
  uscisCaseStatus: one(uscisCaseStatus, {
    fields: [cases.id],
    references: [uscisCaseStatus.caseId],
  }),
  notifications: many(notifications),
  aiLogs: many(aiLogs),
}));

export const formTypesRelations = relations(formTypes, ({ many }) => ({
  caseForms: many(caseForms),
  evidenceRules: many(evidenceRules),
}));

export const caseRelationshipsRelations = relations(caseRelationships, ({ one }) => ({
  case: one(cases, {
    fields: [caseRelationships.caseId],
    references: [cases.id],
  }),
  petitioner: one(clients, {
    fields: [caseRelationships.petitionerId],
    references: [clients.id],
    relationName: 'petitioner',
  }),
  beneficiary: one(clients, {
    fields: [caseRelationships.beneficiaryId],
    references: [clients.id],
    relationName: 'beneficiary',
  }),
  createdByUser: one(users, {
    fields: [caseRelationships.createdBy],
    references: [users.id],
  }),
}));

export const caseFormsRelations = relations(caseForms, ({ one, many }) => ({
  case: one(cases, {
    fields: [caseForms.caseId],
    references: [cases.id],
  }),
  formType: one(formTypes, {
    fields: [caseForms.formTypeId],
    references: [formTypes.id],
  }),
  formFieldAutosaves: many(formFieldAutosaves),
  formSubmissions: many(formSubmissions),
  evidences: many(evidences),
  pdfVersions: many(pdfVersions),
  notifications: many(notifications),
  aiLogs: many(aiLogs),
}));

export const formFieldAutosavesRelations = relations(formFieldAutosaves, ({ one }) => ({
  caseForm: one(caseForms, {
    fields: [formFieldAutosaves.caseFormId],
    references: [caseForms.id],
  }),
  savedByUser: one(users, {
    fields: [formFieldAutosaves.savedBy],
    references: [users.id],
  }),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  caseForm: one(caseForms, {
    fields: [formSubmissions.caseFormId],
    references: [caseForms.id],
  }),
  pdfVersion: one(pdfVersions, {
    fields: [formSubmissions.pdfVersionId],
    references: [pdfVersions.id],
  }),
  submittedByUser: one(users, {
    fields: [formSubmissions.submittedBy],
    references: [users.id],
  }),
}));

export const evidencesRelations = relations(evidences, ({ one }) => ({
  case: one(cases, {
    fields: [evidences.caseId],
    references: [cases.id],
  }),
  caseForm: one(caseForms, {
    fields: [evidences.caseFormId],
    references: [caseForms.id],
  }),
  validatedByUser: one(users, {
    fields: [evidences.validatedBy],
    references: [users.id],
  }),
  uploadedByUser: one(users, {
    fields: [evidences.uploadedBy],
    references: [users.id],
  }),
}));

export const evidenceRulesRelations = relations(evidenceRules, ({ one }) => ({
  formType: one(formTypes, {
    fields: [evidenceRules.formTypeId],
    references: [formTypes.id],
  }),
}));

export const referralLinksRelations = relations(referralLinks, ({ one, many }) => ({
  team: one(teams, {
    fields: [referralLinks.teamId],
    references: [teams.id],
  }),
  case: one(cases, {
    fields: [referralLinks.caseId],
    references: [cases.id],
  }),
  createdByUser: one(users, {
    fields: [referralLinks.createdBy],
    references: [users.id],
  }),
  usages: many(referralLinkUsage),
}));

export const referralLinkUsageRelations = relations(referralLinkUsage, ({ one }) => ({
  referralLink: one(referralLinks, {
    fields: [referralLinkUsage.referralLinkId],
    references: [referralLinks.id],
  }),
  user: one(users, {
    fields: [referralLinkUsage.userId],
    references: [users.id],
  }),
}));

export const uscisCaseStatusRelations = relations(uscisCaseStatus, ({ one }) => ({
  case: one(cases, {
    fields: [uscisCaseStatus.caseId],
    references: [cases.id],
  }),
}));

export const aiLogsRelations = relations(aiLogs, ({ one }) => ({
  team: one(teams, {
    fields: [aiLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [aiLogs.userId],
    references: [users.id],
  }),
  case: one(cases, {
    fields: [aiLogs.caseId],
    references: [cases.id],
  }),
  caseForm: one(caseForms, {
    fields: [aiLogs.caseFormId],
    references: [caseForms.id],
  }),
}));

export const pdfVersionsRelations = relations(pdfVersions, ({ one }) => ({
  caseForm: one(caseForms, {
    fields: [pdfVersions.caseFormId],
    references: [caseForms.id],
  }),
  generatedByUser: one(users, {
    fields: [pdfVersions.generatedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [notifications.teamId],
    references: [teams.id],
  }),
  case: one(cases, {
    fields: [notifications.caseId],
    references: [cases.id],
  }),
  caseForm: one(caseForms, {
    fields: [notifications.caseFormId],
    references: [caseForms.id],
  }),
}));

// ============================================
// RELACIONES NUEVAS TABLAS
// ============================================

export const teamMembersProfilesRelations = relations(teamMembersProfiles, ({ one }) => ({
  user: one(users, {
    fields: [teamMembersProfiles.userId],
    references: [users.id],
  }),
  agency: one(teams, {
    fields: [teamMembersProfiles.agencyId],
    references: [teams.id],
  }),
}));

export const freelancersProfilesRelations = relations(freelancersProfiles, ({ one }) => ({
  user: one(users, {
    fields: [freelancersProfiles.userId],
    references: [users.id],
  }),
}));

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
// M2-M4 Types
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type FormType = typeof formTypes.$inferSelect;
export type NewFormType = typeof formTypes.$inferInsert;
export type CaseForm = typeof caseForms.$inferSelect;
export type NewCaseForm = typeof caseForms.$inferInsert;
export type FormFieldAutosave = typeof formFieldAutosaves.$inferSelect;
export type NewFormFieldAutosave = typeof formFieldAutosaves.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
export type Evidence = typeof evidences.$inferSelect;
export type NewEvidence = typeof evidences.$inferInsert;
export type EvidenceRule = typeof evidenceRules.$inferSelect;
export type NewEvidenceRule = typeof evidenceRules.$inferInsert;
export type ReferralLink = typeof referralLinks.$inferSelect;
export type NewReferralLink = typeof referralLinks.$inferInsert;
export type ReferralLinkUsageRecord = typeof referralLinkUsage.$inferSelect;
export type NewReferralLinkUsageRecord = typeof referralLinkUsage.$inferInsert;
export type UscisCaseStatus = typeof uscisCaseStatus.$inferSelect;
export type NewUscisCaseStatus = typeof uscisCaseStatus.$inferInsert;
export type AiLog = typeof aiLogs.$inferSelect;
export type NewAiLog = typeof aiLogs.$inferInsert;
export type PdfVersion = typeof pdfVersions.$inferSelect;
export type NewPdfVersion = typeof pdfVersions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Nuevos tipos - Team Members & Freelancers
export type TeamMemberProfile = typeof teamMembersProfiles.$inferSelect;
export type NewTeamMemberProfile = typeof teamMembersProfiles.$inferInsert;
export type FreelancerProfile = typeof freelancersProfiles.$inferSelect;
export type NewFreelancerProfile = typeof freelancersProfiles.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// M2-M4 Composite Types
export type ClientWithCases = Client & {
  cases: Case[];
};

export type CaseWithDetails = Case & {
  client: Client;
  caseForms: CaseForm[];
  evidences: Evidence[];
  assignedToUser: User | null;
};

export type CaseFormWithType = CaseForm & {
  formType: FormType;
};

export type CaseWithForms = Case & {
  caseForms: CaseFormWithType[];
};

// ============================================
// TIPOS ESPECÍFICOS DE AGENCIAS
// ============================================

// Tipo para datos de registro de agencia
export interface AgencyRegistrationData {
  // ÚNICO CAMPO OBLIGATORIO SEGÚN TIPO
  agencyType: 'law_firm' | 'immigration_services';

  // Información empresa (todos opcionales)
  legalBusinessName?: string;
  businessNameDba?: string;
  businessEmail?: string;
  businessPhone?: string;
  website?: string;

  // Dirección (todos opcionales)
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  googlePlaceId?: string;
  coordinatesLat?: string;
  coordinatesLng?: string;

  // Específicos por tipo
  firmRegistrationNumber?: string;     // solo law_firm
  firmRegistrationState?: string;      // solo law_firm
  businessLicenseNumber?: string;      // solo immigration_services
  disclaimerAccepted?: boolean;        // OBLIGATORIO solo para immigration_services

  // Contacto principal (todos opcionales)
  ownerFullName?: string;
  ownerPosition?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

// Tipo para datos de Google Maps
export interface AddressData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  placeId: string;
  coordinates: { lat: number; lng: number };
}

// Tipo para validación de campos
export interface FieldPermission {
  field: string;
  editableBy: ('saas_admin' | 'agency_owner' | 'agency_staff')[];
  immutableAfterRegistration?: boolean;
  requiresEmailConfirmation?: boolean;
}

// Tipo para response de registro
export interface AgencyRegistrationResponse {
  success: boolean;
  teamId: string;
  agencyStatus: 'incomplete' | 'pending';
  completionPercentage: number;
  userCreated?: boolean;
}

// ============================================
// TIPOS ESPECÍFICOS - TEAM MEMBERS & FREELANCERS
// ============================================

// Tipos para especialidades y idiomas
export type SpecialtyType =
  | 'asylum'
  | 'tps'
  | 'daca'
  | 'adjustment_status_i485'
  | 'family_petitions_i130'
  | 'employment_petitions_i140'
  | 'work_permit_i765'
  | 'naturalization'
  | 'deportation_defense'
  | 'vawa'
  | 'u_visa'
  | 't_visa'
  | 'other';

export type LanguageType =
  | 'english'
  | 'spanish'
  | 'mandarin'
  | 'cantonese'
  | 'tagalog'
  | 'vietnamese'
  | 'korean'
  | 'french'
  | 'haitian_creole'
  | 'portuguese'
  | 'arabic'
  | 'russian'
  | 'other';

// Tipo para datos de registro de Team Member
export interface TeamMemberRegistrationData {
  // Información básica (recomendados)
  fullName?: string;
  email?: string;
  phone?: string;

  // Rol y especialización (rol es obligatorio)
  role: 'attorney' | 'paralegal' | 'legal_assistant' | 'admin_assistant' | 'receptionist' | 'other';
  customRoleDescription?: string;
  specialties?: SpecialtyType[];
  customSpecialties?: string[];

  // Campos específicos para abogados (solo si role = 'attorney')
  barNumber?: string;
  barState?: string;

  // Perfil profesional (opcionales)
  profilePhotoUrl?: string;
  bio?: string;
  languages?: LanguageType[];
  customLanguages?: string[];
}

// Tipo para datos de registro de Freelancer
export interface FreelancerRegistrationData {
  // Selector inicial OBLIGATORIO
  professionalType: 'immigration_attorney' | 'form_preparer';

  // Información personal (recomendados)
  fullName?: string;
  email?: string;
  phone?: string;
  primaryState?: string;
  primaryCity?: string;

  // Campos para abogados (solo si professionalType = 'immigration_attorney')
  barNumber?: string;
  primaryBarState?: string;
  additionalBarStates?: string[];
  specialties?: SpecialtyType[];
  customSpecialties?: string[];

  // Campos para preparadores (solo si professionalType = 'form_preparer')
  businessLicenseNumber?: string;
  disclaimerAccepted?: boolean; // OBLIGATORIO para form_preparer
  disclaimerAcceptedAt?: Date;

  // Información de empresa (opcional)
  hasBusiness?: boolean;
  businessName?: string;
  businessEntityType?: 'sole_proprietor' | 'llc_single_member' | 'llc_multi_member' | 'c_corp' | 's_corp';
  businessWebsite?: string;

  // Perfil profesional completo (opcionales)
  profilePhotoUrl?: string;
  bio?: string;
  yearsExperience?: number;
  languages?: LanguageType[];
  customLanguages?: string[];

  // Ubicación y contacto profesional (opcionales)
  officeAddress?: string;
  officeCity?: string;
  officeState?: string;
  officeZipCode?: string;
  googlePlaceId?: string;
  coordinatesLat?: string;
  coordinatesLng?: string;

  // Redes y web (opcionales)
  linkedinUrl?: string;
  personalWebsite?: string;
}

// Tipos de respuesta para registro
export interface TeamMemberRegistrationResponse {
  success: boolean;
  teamMemberId: string;
  agencyId: string;
  userCreated?: boolean;
}

export interface FreelancerRegistrationResponse {
  success: boolean;
  freelancerId: string;
  userCreated?: boolean;
}

// ============================================
// ENUMS DE ACTIVIDAD
// ============================================

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  // M2-M4: Client activities
  CREATE_CLIENT = 'CREATE_CLIENT',
  UPDATE_CLIENT = 'UPDATE_CLIENT',
  DELETE_CLIENT = 'DELETE_CLIENT',
  // M2-M4: Case activities
  CREATE_CASE = 'CREATE_CASE',
  UPDATE_CASE = 'UPDATE_CASE',
  DELETE_CASE = 'DELETE_CASE',
  ASSIGN_CASE = 'ASSIGN_CASE',
  // M2-M4: Form activities
  ADD_FORM_TO_CASE = 'ADD_FORM_TO_CASE',
  REMOVE_FORM_FROM_CASE = 'REMOVE_FORM_FROM_CASE',
  START_FORM = 'START_FORM',
  UPDATE_FORM = 'UPDATE_FORM',
  COMPLETE_FORM = 'COMPLETE_FORM',
  SUBMIT_FORM = 'SUBMIT_FORM',
  // M2-M4: Evidence activities
  UPLOAD_EVIDENCE = 'UPLOAD_EVIDENCE',
  VALIDATE_EVIDENCE = 'VALIDATE_EVIDENCE',
  DELETE_EVIDENCE = 'DELETE_EVIDENCE',
  // M2-M4: Referral activities
  CREATE_REFERRAL_LINK = 'CREATE_REFERRAL_LINK',
  USE_REFERRAL_LINK = 'USE_REFERRAL_LINK',
  // M2-M4: PDF activities
  GENERATE_PDF = 'GENERATE_PDF',
  DEMO_EFILING = 'DEMO_EFILING',
  // Agency registration activities
  REGISTER_AGENCY = 'REGISTER_AGENCY',
  UPDATE_AGENCY_SETTINGS = 'UPDATE_AGENCY_SETTINGS',
  COMPLETE_AGENCY_PROFILE = 'COMPLETE_AGENCY_PROFILE',
  // Member & invitation management
  DELETE_TEAM_MEMBER_ACCOUNT = 'DELETE_TEAM_MEMBER_ACCOUNT',
  REVOKE_INVITATION = 'REVOKE_INVITATION',
  // API Key activities
  CREATE_API_KEY = 'CREATE_API_KEY',
  REVOKE_API_KEY = 'REVOKE_API_KEY',
  ROTATE_API_KEY = 'ROTATE_API_KEY',
}

// Roles como constantes para uso en código
export const UserRoles = {
  ADMIN: 'admin',
  ATTORNEY: 'attorney',
  STAFF: 'staff',
  END_USER: 'end_user',
} as const;

export const TenantRoles = {
  OWNER: 'owner',
  STAFF: 'staff',
  CLIENT: 'client',
} as const;

export type UserRoleType = typeof UserRoles[keyof typeof UserRoles];
export type TenantRoleType = typeof TenantRoles[keyof typeof TenantRoles];

// API Keys types
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
