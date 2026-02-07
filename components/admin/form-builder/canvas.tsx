'use client';

import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { CanvasPart } from './canvas-part';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Canvas() {
  const t = useTranslations('admin.formBuilder');
  const schema = useFormBuilderStore((s) => s.schema);
  const addPart = useFormBuilderStore((s) => s.addPart);

  if (schema.parts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-8">
        <FileText className="h-16 w-16 text-gray-200 mb-4" />
        <p className="text-gray-400 mb-4">{t('outline.emptyParts')}</p>
        <Button variant="outline" onClick={addPart}>
          <Plus className="h-4 w-4 mr-2" />
          {t('outline.addPart')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-4">
        {schema.parts.map((part) => (
          <CanvasPart key={part.id} part={part} />
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={addPart}
          className="w-full text-xs text-gray-500 hover:text-violet-600 border border-dashed border-gray-300 hover:border-violet-400"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t('outline.addPart')}
        </Button>
      </div>
    </div>
  );
}
