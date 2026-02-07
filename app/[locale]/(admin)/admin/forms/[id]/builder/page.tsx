export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getFormTypeByIdAdmin, updateFormType } from '@/lib/admin/form-types-service';
import { BuilderPage } from '@/components/admin/form-builder/builder-page';
import type { FormSchema } from '@/lib/forms/service';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Merge translations from message files (messages/en.json, es.json, pt.json)
 * into the schema's translations fields so the builder shows them pre-filled.
 * Only fills translations that aren't already present in the schema.
 */
function mergeMessageTranslations(schema: FormSchema): FormSchema {
  const formKey = schema.formCode.toLowerCase(); // e.g. "i-130"
  const en = (enMessages as Record<string, any>).forms?.[formKey];
  const es = (esMessages as Record<string, any>).forms?.[formKey];
  const pt = (ptMessages as Record<string, any>).forms?.[formKey];

  if (!en && !es && !pt) return schema;

  return {
    ...schema,
    parts: schema.parts.map((part) => ({
      ...part,
      translations: part.translations?.es?.title
        ? part.translations
        : {
            es: { title: es?.[part.id]?.title || '' },
            pt: { title: pt?.[part.id]?.title || '' },
          },
      sections: part.sections.map((section) => ({
        ...section,
        translations: section.translations?.es?.title
          ? section.translations
          : {
              es: {
                title: es?.[part.id]?.[section.id]?.title || '',
                description: es?.[part.id]?.[section.id]?.description,
              },
              pt: {
                title: pt?.[part.id]?.[section.id]?.title || '',
                description: pt?.[part.id]?.[section.id]?.description,
              },
            },
        fields: section.fields.map((field) => {
          const enField = en?.[part.id]?.[section.id]?.[field.id];
          const esField = es?.[part.id]?.[section.id]?.[field.id];
          const ptField = pt?.[part.id]?.[section.id]?.[field.id];

          // Merge EN helpText/placeholder into field-level properties
          const mergedField = {
            ...field,
            helpText: field.helpText || enField?.helpText || undefined,
            placeholder: field.placeholder || enField?.placeholder || undefined,
          };

          // Skip translations if already present
          if (field.translations?.es?.label) return mergedField;

          return {
            ...mergedField,
            translations: {
              es: {
                label: esField?.label || '',
                helpText: esField?.helpText,
                placeholder: esField?.placeholder,
                options: esField?.options,
              },
              pt: {
                label: ptField?.label || '',
                helpText: ptField?.helpText,
                placeholder: ptField?.placeholder,
                options: ptField?.options,
              },
            },
          };
        }),
      })),
    })),
  };
}

export default async function FormBuilderPage({ params }: PageProps) {
  const { id } = await params;
  const formType = await getFormTypeByIdAdmin(parseInt(id, 10));

  if (!formType) {
    notFound();
  }

  const rawSchema = formType.formSchema as FormSchema;

  // Check if any field is missing schema-level translations or helpText/placeholder
  const formKey = rawSchema.formCode.toLowerCase();
  const enMsgs = (enMessages as Record<string, any>).forms?.[formKey];
  const needsMerge = rawSchema.parts.some((p) =>
    p.sections.some((s) =>
      s.fields.some((f) => {
        if (!f.translations?.es?.label) return true;
        // Also trigger merge if EN message has helpText/placeholder but field doesn't
        const enF = enMsgs?.[p.id]?.[s.id]?.[f.id];
        if (enF?.helpText && !f.helpText) return true;
        if (enF?.placeholder && !f.placeholder) return true;
        return false;
      })
    )
  );

  let schema = rawSchema;
  if (needsMerge) {
    schema = mergeMessageTranslations(rawSchema);
    // Persist the enriched schema so translations are stored in DB
    await updateFormType(formType.id, { formSchema: schema });
  }

  return (
    <BuilderPage
      formTypeId={formType.id}
      formCode={formType.code}
      initialSchema={schema}
    />
  );
}
