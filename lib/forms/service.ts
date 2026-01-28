import { db } from '@/lib/db/drizzle';
import {
  formTypes,
  caseForms,
  formFieldAutosaves,
  cases,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';

// Types
export interface FormSchema {
  formCode: string;
  parts: FormPart[];
  validationRules?: ValidationRule[];
}

export interface FormPart {
  id: string;
  title: string;
  sections: FormSection[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'radio' | 'checkbox' | 'phone' | 'email' | 'number' | 'address' | 'ssn' | 'alien_number';
  label: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  pdfField?: string;
  conditionalDisplay?: {
    field: string;
    value: string | boolean;
  };
  subFields?: Record<string, { pdfField: string; label?: string }>;
}

export interface ValidationRule {
  id: string;
  message: string;
  condition: string;
}

export interface CreateCaseFormInput {
  caseId: number;
  formTypeId: number;
}

export interface UpdateCaseFormInput {
  formData?: Record<string, unknown>;
  status?: 'not_started' | 'in_progress' | 'completed' | 'submitted';
  progressPercentage?: number;
}

// Get all active form types
export async function getFormTypes() {
  const types = await db
    .select()
    .from(formTypes)
    .where(eq(formTypes.isActive, true))
    .orderBy(formTypes.code);

  return types;
}

// Get form type by code
export async function getFormTypeByCode(code: string) {
  const [formType] = await db
    .select()
    .from(formTypes)
    .where(and(eq(formTypes.code, code), eq(formTypes.isActive, true)));

  return formType;
}

// Get form type by ID
export async function getFormTypeById(id: number) {
  const [formType] = await db
    .select()
    .from(formTypes)
    .where(eq(formTypes.id, id));

  return formType;
}

// Create a case form
export async function createCaseForm(
  input: CreateCaseFormInput,
  teamId: number,
  userId: number
) {
  // Verify the case belongs to the team
  const [caseData] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, input.caseId), eq(cases.teamId, teamId), isNull(cases.deletedAt)));

  if (!caseData) {
    throw new Error('Case not found');
  }

  // Verify form type exists
  const formType = await getFormTypeById(input.formTypeId);
  if (!formType) {
    throw new Error('Form type not found');
  }

  // Check if this form type already exists for this case
  const [existingForm] = await db
    .select()
    .from(caseForms)
    .where(
      and(
        eq(caseForms.caseId, input.caseId),
        eq(caseForms.formTypeId, input.formTypeId)
      )
    );

  if (existingForm) {
    throw new Error('This form already exists for this case');
  }

  const [newCaseForm] = await db
    .insert(caseForms)
    .values({
      caseId: input.caseId,
      formTypeId: input.formTypeId,
      status: 'not_started',
      progressPercentage: 0,
      formData: {},
    })
    .returning();

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.ADD_FORM_TO_CASE,
  });

  return newCaseForm;
}

// Get case form by ID
export async function getCaseFormById(caseFormId: number, teamId: number) {
  const [result] = await db
    .select({
      caseForm: caseForms,
      formType: formTypes,
      case: cases,
    })
    .from(caseForms)
    .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
    .innerJoin(cases, eq(caseForms.caseId, cases.id))
    .where(and(eq(caseForms.id, caseFormId), eq(cases.teamId, teamId)));

  if (!result) return null;

  return {
    ...result.caseForm,
    formType: result.formType,
    case: result.case,
  };
}

// Get all forms for a case
export async function getCaseFormsForCase(caseId: number, teamId: number) {
  // First verify case belongs to team
  const [caseData] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId), isNull(cases.deletedAt)));

  if (!caseData) return [];

  const forms = await db
    .select({
      caseForm: caseForms,
      formType: formTypes,
    })
    .from(caseForms)
    .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
    .where(eq(caseForms.caseId, caseId))
    .orderBy(caseForms.createdAt);

  return forms.map((f) => ({
    ...f.caseForm,
    formType: f.formType,
  }));
}

// Update case form
export async function updateCaseForm(
  caseFormId: number,
  teamId: number,
  userId: number,
  data: UpdateCaseFormInput
) {
  // Verify case form exists and belongs to team
  const existingForm = await getCaseFormById(caseFormId, teamId);
  if (!existingForm) {
    throw new Error('Form not found');
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.formData !== undefined) {
    updateData.formData = data.formData;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'in_progress' && !existingForm.startedAt) {
      updateData.startedAt = new Date();
    }
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    }
  }
  if (data.progressPercentage !== undefined) {
    updateData.progressPercentage = data.progressPercentage;
  }

  const [updatedForm] = await db
    .update(caseForms)
    .set(updateData)
    .where(eq(caseForms.id, caseFormId))
    .returning();

  return updatedForm;
}

// Autosave a field
export async function autosaveField(
  caseFormId: number,
  teamId: number,
  userId: number,
  fieldPath: string,
  fieldValue: string | null
) {
  // Verify case form exists and belongs to team
  const existingForm = await getCaseFormById(caseFormId, teamId);
  if (!existingForm) {
    throw new Error('Form not found');
  }

  // Upsert the field value
  await db
    .insert(formFieldAutosaves)
    .values({
      caseFormId,
      fieldPath,
      fieldValue,
      savedBy: userId,
      savedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [formFieldAutosaves.caseFormId, formFieldAutosaves.fieldPath],
      set: {
        fieldValue,
        savedBy: userId,
        savedAt: new Date(),
      },
    });

  // Update the form status to in_progress if it was not_started
  if (existingForm.status === 'not_started') {
    await db
      .update(caseForms)
      .set({
        status: 'in_progress',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(caseForms.id, caseFormId));
  }

  return { success: true };
}

// Get autosaved fields for a case form
export async function getAutosavedFields(caseFormId: number) {
  const fields = await db
    .select()
    .from(formFieldAutosaves)
    .where(eq(formFieldAutosaves.caseFormId, caseFormId));

  // Convert to object
  const autosaveData: Record<string, string | null> = {};
  for (const field of fields) {
    autosaveData[field.fieldPath] = field.fieldValue;
  }

  return autosaveData;
}

// Delete a case form
export async function deleteCaseForm(
  caseFormId: number,
  teamId: number,
  userId: number
) {
  // Verify case form exists and belongs to team
  const existingForm = await getCaseFormById(caseFormId, teamId);
  if (!existingForm) {
    throw new Error('Form not found');
  }

  // Don't allow deleting submitted forms
  if (existingForm.status === 'submitted') {
    throw new Error('Cannot delete submitted forms');
  }

  // Delete autosave data first
  await db
    .delete(formFieldAutosaves)
    .where(eq(formFieldAutosaves.caseFormId, caseFormId));

  // Delete the case form
  await db.delete(caseForms).where(eq(caseForms.id, caseFormId));

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.REMOVE_FORM_FROM_CASE,
  });

  return { success: true };
}

// Calculate form progress based on required fields
export function calculateProgress(
  formSchema: FormSchema,
  formData: Record<string, unknown>
): number {
  let totalRequired = 0;
  let filledRequired = 0;

  for (const part of formSchema.parts) {
    for (const section of part.sections) {
      for (const field of section.fields) {
        if (field.required) {
          totalRequired++;
          const fieldPath = `${part.id}.${section.id}.${field.id}`;
          const value = getNestedValue(formData, fieldPath);
          if (value !== undefined && value !== null && value !== '') {
            filledRequired++;
          }
        }
      }
    }
  }

  if (totalRequired === 0) return 100;
  return Math.round((filledRequired / totalRequired) * 100);
}

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
