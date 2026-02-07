'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useTemporalStore } from '@/lib/stores/form-builder-store-temporal';
import { Undo2, Redo2, Save, Loader2, Eye, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Props {
  formTypeId: number;
  formCode: string;
  onSave: () => void;
}

export function BuilderHeaderPortal({ formTypeId, formCode, onSave }: Props) {
  const t = useTranslations('admin.formBuilder.toolbar');
  const isDirty = useFormBuilderStore((s) => s.isDirty);
  const isSaving = useFormBuilderStore((s) => s.isSaving);
  const schema = useFormBuilderStore((s) => s.schema);

  const { undo, redo, pastStates, futureStates } = useTemporalStore();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('admin-header-portal'));
  }, []);

  function handleExport() {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formCode.toLowerCase()}-schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!portalTarget) return null;

  return createPortal(
    <>
      <span className="font-semibold text-gray-900 text-sm">{formCode}</span>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => undo()} disabled={!canUndo} title={t('undo')}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => redo()} disabled={!canRedo} title={t('redo')}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="sm" className="h-8" onClick={handleExport} title={t('export')}>
        <Download className="h-4 w-4 mr-1.5" />
        {t('export')}
      </Button>
      <Link href={`/admin/forms/${formTypeId}/preview`} target="_blank">
        <Button variant="outline" size="sm" className="h-8">
          <Eye className="h-4 w-4 mr-1.5" />
          {t('preview')}
        </Button>
      </Link>
      <Button onClick={onSave} disabled={!isDirty || isSaving} size="sm" className="h-8">
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-1.5" />
        )}
        {isSaving ? t('saving') : isDirty ? t('save') : t('saved')}
      </Button>
    </>,
    portalTarget,
  );
}
