'use client';

import { Button } from '@/components/ui/button';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useTemporalStore } from '@/lib/stores/form-builder-store-temporal';
import { ArrowLeft, Undo2, Redo2, Save, Loader2, Eye, Download, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Props {
  formTypeId: number;
  formCode: string;
  onSave: () => void;
}

export function BuilderToolbar({ formTypeId, formCode, onSave }: Props) {
  const t = useTranslations('admin.formBuilder.toolbar');
  const isDirty = useFormBuilderStore((s) => s.isDirty);
  const isSaving = useFormBuilderStore((s) => s.isSaving);
  const schema = useFormBuilderStore((s) => s.schema);

  const { undo, redo, pastStates, futureStates } = useTemporalStore();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  function handleExport() {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formCode.toLowerCase()}-schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/admin/forms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        </Link>
        <div className="h-6 w-px bg-gray-200" />
        <span className="font-semibold text-gray-900">{formCode}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => undo()} disabled={!canUndo} title={t('undo')}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => redo()} disabled={!canRedo} title={t('redo')}>
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        <Button variant="ghost" size="sm" onClick={handleExport} title={t('export')}>
          <Download className="h-4 w-4 mr-1.5" />
          {t('export')}
        </Button>

        <Link href={`/admin/forms/${formTypeId}/preview`} target="_blank">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1.5" />
            {t('preview')}
          </Button>
        </Link>

        <Button onClick={onSave} disabled={!isDirty || isSaving} size="sm">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {isSaving ? t('saving') : isDirty ? t('save') : t('saved')}
        </Button>
      </div>
    </div>
  );
}
