'use client';

import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useAddElementDialogContext } from './add-element-dialog-provider';
import { CanvasSection } from './canvas-section';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FormPart } from '@/lib/forms/service';

interface Props {
  part: FormPart;
}

export function CanvasPart({ part }: Props) {
  const t = useTranslations('admin.formBuilder.outline');
  const selectedNode = useFormBuilderStore((s) => s.selectedNode);
  const selectNode = useFormBuilderStore((s) => s.selectNode);
  const { requestAddSection } = useAddElementDialogContext();

  const isSelected =
    selectedNode?.type === 'part' && selectedNode.partId === part.id;

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-all',
        isSelected
          ? 'border-violet-400 bg-violet-50/20'
          : 'border-gray-200 bg-white'
      )}
    >
      <button
        type="button"
        onClick={() => selectNode({ type: 'part', partId: part.id })}
        className="w-full text-left mb-3"
      >
        <h3
          className={cn(
            'text-base font-semibold',
            isSelected ? 'text-violet-800' : 'text-gray-900'
          )}
        >
          {part.title}
        </h3>
      </button>

      <div className="space-y-3">
        {part.sections.map((section) => (
          <CanvasSection
            key={section.id}
            section={section}
            partId={part.id}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => requestAddSection(part.id)}
        className="w-full mt-3 text-xs text-gray-500 hover:text-violet-600 border border-dashed border-gray-300 hover:border-violet-400"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('addSection')}
      </Button>
    </div>
  );
}
