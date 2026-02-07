'use client';

import { FormRenderer } from '@/components/forms/form-renderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Blocks } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { FormSchema } from '@/lib/forms/service';

interface Props {
  schema: FormSchema;
  formCode: string;
  formTypeId: number;
}

export function PreviewClient({ schema, formCode, formTypeId }: Props) {
  const t = useTranslations('admin.formBuilder.toolbar');

  // No-op handlers since this is just a preview
  async function noopAutosave() {}
  async function noopSave() {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href={`/admin/forms/${formTypeId}/builder`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t('back')}
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-200" />
          <span className="font-semibold text-gray-900">{formCode}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {t('preview')}
          </span>
        </div>
        <Link href={`/admin/forms/${formTypeId}/builder`}>
          <Button size="sm" variant="outline">
            <Blocks className="h-4 w-4 mr-1.5" />
            Builder
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <FormRenderer
          formSchema={schema}
          initialData={{}}
          caseFormId={0}
          onAutosave={noopAutosave}
          onSave={noopSave}
          readOnly={false}
        />
      </div>
    </div>
  );
}
