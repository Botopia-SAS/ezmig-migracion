import { create } from 'zustand';
import { temporal } from 'zundo';
import type { FormSchema, FormPart, FormSection, FormField } from '@/lib/forms/service';

// ---- Types ----

export interface SelectedNode {
  type: 'part' | 'section' | 'field';
  partId: string;
  sectionId?: string;
  fieldId?: string;
}

export interface FormBuilderState {
  // Data
  schema: FormSchema;
  formTypeId: number | null;
  selectedNode: SelectedNode | null;
  isDirty: boolean;
  isSaving: boolean;

  // Initialization
  setSchema: (schema: FormSchema, formTypeId: number) => void;
  markSaved: () => void;
  setIsSaving: (v: boolean) => void;

  // Selection
  selectNode: (node: SelectedNode | null) => void;

  // Part actions
  addPart: () => void;
  updatePart: (partId: string, data: Partial<Pick<FormPart, 'title' | 'translations'>>) => void;
  removePart: (partId: string) => void;
  reorderParts: (fromIndex: number, toIndex: number) => void;

  // Section actions
  addSection: (partId: string) => void;
  updateSection: (partId: string, sectionId: string, data: Partial<Pick<FormSection, 'title' | 'description' | 'translations'>>) => void;
  removeSection: (partId: string, sectionId: string) => void;
  reorderSections: (partId: string, fromIndex: number, toIndex: number) => void;

  // Field actions
  addField: (partId: string, sectionId: string, type: FormField['type']) => void;
  updateField: (partId: string, sectionId: string, fieldId: string, data: Partial<FormField>) => void;
  removeField: (partId: string, sectionId: string, fieldId: string) => void;
  reorderFields: (partId: string, sectionId: string, fromIndex: number, toIndex: number) => void;
  duplicateField: (partId: string, sectionId: string, fieldId: string) => void;
}

// ---- Helpers ----

function generateId(prefix: string, existing: string[]): string {
  let counter = existing.length + 1;
  let id = `${prefix}${counter}`;
  while (existing.includes(id)) {
    counter++;
    id = `${prefix}${counter}`;
  }
  return id;
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

// ---- Store ----

export const useFormBuilderStore = create<FormBuilderState>()(
  temporal(
    (set) => ({
      schema: { formCode: '', parts: [] },
      formTypeId: null,
      selectedNode: null,
      isDirty: false,
      isSaving: false,

      setSchema: (schema, formTypeId) =>
        set({ schema, formTypeId, isDirty: false, selectedNode: null }),

      markSaved: () => set({ isDirty: false }),

      setIsSaving: (v) => set({ isSaving: v }),

      selectNode: (node) => set({ selectedNode: node }),

      // ---- Part actions ----

      addPart: () =>
        set((state) => {
          const existingIds = state.schema.parts.map((p) => p.id);
          const id = generateId('part', existingIds);
          const newPart: FormPart = {
            id,
            title: `Part ${state.schema.parts.length + 1}`,
            translations: {
              es: { title: '' },
              pt: { title: '' },
            },
            sections: [],
          };
          return {
            schema: { ...state.schema, parts: [...state.schema.parts, newPart] },
            isDirty: true,
            selectedNode: { type: 'part', partId: id },
          };
        }),

      updatePart: (partId, data) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id === partId ? { ...p, ...data } : p
            ),
          },
          isDirty: true,
        })),

      removePart: (partId) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.filter((p) => p.id !== partId),
          },
          isDirty: true,
          selectedNode:
            state.selectedNode?.partId === partId ? null : state.selectedNode,
        })),

      reorderParts: (fromIndex, toIndex) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: arrayMove(state.schema.parts, fromIndex, toIndex),
          },
          isDirty: true,
        })),

      // ---- Section actions ----

      addSection: (partId) =>
        set((state) => {
          const parts = state.schema.parts.map((p) => {
            if (p.id !== partId) return p;
            const existingIds = p.sections.map((s) => s.id);
            const id = generateId('section', existingIds);
            const newSection: FormSection = {
              id,
              title: `Section ${p.sections.length + 1}`,
              translations: {
                es: { title: '' },
                pt: { title: '' },
              },
              fields: [],
            };
            return { ...p, sections: [...p.sections, newSection] };
          });
          const newSectionId = parts
            .find((p) => p.id === partId)
            ?.sections.slice(-1)[0]?.id;
          return {
            schema: { ...state.schema, parts },
            isDirty: true,
            selectedNode: newSectionId
              ? { type: 'section', partId, sectionId: newSectionId }
              : state.selectedNode,
          };
        }),

      updateSection: (partId, sectionId, data) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id !== partId
                ? p
                : {
                    ...p,
                    sections: p.sections.map((s) =>
                      s.id === sectionId ? { ...s, ...data } : s
                    ),
                  }
            ),
          },
          isDirty: true,
        })),

      removeSection: (partId, sectionId) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id !== partId
                ? p
                : { ...p, sections: p.sections.filter((s) => s.id !== sectionId) }
            ),
          },
          isDirty: true,
          selectedNode:
            state.selectedNode?.sectionId === sectionId ? null : state.selectedNode,
        })),

      reorderSections: (partId, fromIndex, toIndex) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id !== partId
                ? p
                : { ...p, sections: arrayMove(p.sections, fromIndex, toIndex) }
            ),
          },
          isDirty: true,
        })),

      // ---- Field actions ----

      addField: (partId, sectionId, type) =>
        set((state) => {
          const parts = state.schema.parts.map((p) => {
            if (p.id !== partId) return p;
            return {
              ...p,
              sections: p.sections.map((s) => {
                if (s.id !== sectionId) return s;
                const existingIds = s.fields.map((f) => f.id);
                const id = generateId('field', existingIds);
                const needsOptions = ['select', 'radio', 'checkbox_group'].includes(type);
                const newField: FormField = {
                  id,
                  type,
                  label: `New ${type} field`,
                  required: false,
                  translations: {
                    es: { label: '' },
                    pt: { label: '' },
                  },
                  ...(needsOptions
                    ? {
                        options: [{ value: 'option1', label: 'Option 1' }],
                        translations: {
                          es: { label: '', options: { option1: '' } },
                          pt: { label: '', options: { option1: '' } },
                        },
                      }
                    : {}),
                };
                return { ...s, fields: [...s.fields, newField] };
              }),
            };
          });
          const section = parts
            .find((p) => p.id === partId)
            ?.sections.find((s) => s.id === sectionId);
          const newFieldId = section?.fields.slice(-1)[0]?.id;
          return {
            schema: { ...state.schema, parts },
            isDirty: true,
            selectedNode: newFieldId
              ? { type: 'field', partId, sectionId, fieldId: newFieldId }
              : state.selectedNode,
          };
        }),

      updateField: (partId, sectionId, fieldId, data) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id !== partId
                ? p
                : {
                    ...p,
                    sections: p.sections.map((s) =>
                      s.id !== sectionId
                        ? s
                        : {
                            ...s,
                            fields: s.fields.map((f) =>
                              f.id === fieldId ? { ...f, ...data } : f
                            ),
                          }
                    ),
                  }
            ),
          },
          isDirty: true,
        })),

      removeField: (partId, sectionId, fieldId) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id !== partId
                ? p
                : {
                    ...p,
                    sections: p.sections.map((s) =>
                      s.id !== sectionId
                        ? s
                        : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
                    ),
                  }
            ),
          },
          isDirty: true,
          selectedNode:
            state.selectedNode?.fieldId === fieldId ? null : state.selectedNode,
        })),

      reorderFields: (partId, sectionId, fromIndex, toIndex) =>
        set((state) => ({
          schema: {
            ...state.schema,
            parts: state.schema.parts.map((p) =>
              p.id !== partId
                ? p
                : {
                    ...p,
                    sections: p.sections.map((s) =>
                      s.id !== sectionId
                        ? s
                        : { ...s, fields: arrayMove(s.fields, fromIndex, toIndex) }
                    ),
                  }
            ),
          },
          isDirty: true,
        })),

      duplicateField: (partId, sectionId, fieldId) =>
        set((state) => {
          const parts = state.schema.parts.map((p) => {
            if (p.id !== partId) return p;
            return {
              ...p,
              sections: p.sections.map((s) => {
                if (s.id !== sectionId) return s;
                const original = s.fields.find((f) => f.id === fieldId);
                if (!original) return s;
                const existingIds = s.fields.map((f) => f.id);
                const newId = generateId('field', existingIds);
                const copy: FormField = {
                  ...original,
                  id: newId,
                  label: `${original.label} (copy)`,
                  translations: original.translations
                    ? structuredClone(original.translations)
                    : undefined,
                };
                const idx = s.fields.findIndex((f) => f.id === fieldId);
                const fields = [...s.fields];
                fields.splice(idx + 1, 0, copy);
                return { ...s, fields };
              }),
            };
          });
          return { schema: { ...state.schema, parts }, isDirty: true };
        }),
    }),
    {
      // zundo options: only track schema changes for undo/redo
      partialize: (state) => ({ schema: state.schema }),
      limit: 50,
    }
  )
);
