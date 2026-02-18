import { db } from '@/lib/db/drizzle';
import { formTypes, caseForms } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import type { FormSchema } from '@/lib/forms/service';

export interface CreateFormTypeInput {
  code: string;
  name: string;
  description?: string;
  category?: string;
  uscisEdition?: string;
  estimatedTimeMinutes?: number;
  formSchema?: FormSchema;
}

export interface UpdateFormTypeInput {
  name?: string;
  description?: string;
  category?: string;
  uscisEdition?: string;
  estimatedTimeMinutes?: number;
  formSchema?: FormSchema;
  isActive?: boolean;
}

// Get all form types (including inactive) with caseForm count
export async function getAllFormTypes() {
  const results = await db
    .select({
      formType: formTypes,
      caseFormCount: count(caseForms.id),
    })
    .from(formTypes)
    .leftJoin(caseForms, eq(formTypes.id, caseForms.formTypeId))
    .groupBy(formTypes.id)
    .orderBy(formTypes.code);

  return results.map((r) => ({
    ...r.formType,
    caseFormCount: r.caseFormCount,
  }));
}

// Get single form type by ID (admin - no isActive filter)
export async function getFormTypeByIdAdmin(id: number) {
  const [formType] = await db
    .select()
    .from(formTypes)
    .where(eq(formTypes.id, id));

  return formType ?? null;
}

// Create a new form type
export async function createFormType(input: CreateFormTypeInput) {
  const [created] = await db
    .insert(formTypes)
    .values({
      code: input.code.toUpperCase(),
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      uscisEdition: input.uscisEdition ?? null,
      estimatedTimeMinutes: input.estimatedTimeMinutes ?? null,
      formSchema: input.formSchema ?? { formCode: input.code.toUpperCase(), parts: [] },
      isActive: true,
      version: 1,
    })
    .returning();

  return created;
}

// Update form type (metadata and/or schema)
export async function updateFormType(id: number, data: UpdateFormTypeInput) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.uscisEdition !== undefined) updateData.uscisEdition = data.uscisEdition;
  if (data.estimatedTimeMinutes !== undefined) updateData.estimatedTimeMinutes = data.estimatedTimeMinutes;
  if (data.formSchema !== undefined) updateData.formSchema = data.formSchema;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(formTypes)
    .set(updateData)
    .where(eq(formTypes.id, id))
    .returning();

  return updated ?? null;
}

// Delete form type — hard delete only if no case forms reference it, otherwise deactivate
export async function deleteFormType(id: number) {
  const [{ caseFormCount }] = await db
    .select({ caseFormCount: count(caseForms.id) })
    .from(caseForms)
    .where(eq(caseForms.formTypeId, id));

  if (caseFormCount > 0) {
    // Soft-deactivate
    const [updated] = await db
      .update(formTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(formTypes.id, id))
      .returning();
    return { action: 'deactivated' as const, formType: updated };
  }

  // Hard delete
  const [deleted] = await db
    .delete(formTypes)
    .where(eq(formTypes.id, id))
    .returning();
  return { action: 'deleted' as const, formType: deleted };
}

// Duplicate a form type
export async function duplicateFormType(id: number) {
  const original = await getFormTypeByIdAdmin(id);
  if (!original) return null;

  const schema = original.formSchema as FormSchema;
  const newCode = `${original.code}-COPY`;
  const newSchema = { ...schema, formCode: newCode };

  return createFormType({
    code: newCode,
    name: `${original.name} (Copy)`,
    description: original.description ?? undefined,
    category: original.category ?? undefined,
    uscisEdition: original.uscisEdition ?? undefined,
    estimatedTimeMinutes: original.estimatedTimeMinutes ?? undefined,
    formSchema: newSchema,
  });
}
