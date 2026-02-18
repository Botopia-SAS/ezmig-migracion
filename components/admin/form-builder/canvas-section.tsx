'use client';

import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useAddElementDialogContext } from './add-element-dialog-provider';
import { CanvasField } from './canvas-field';
import { FieldTypePicker } from './field-type-picker';
import { cn } from '@/lib/utils';
import type { FormSection } from '@/lib/forms/service';

interface Props {
  section: FormSection;
  partId: string;
}

export function CanvasSection({ section, partId }: Props) {
  const selectedNode = useFormBuilderStore((s) => s.selectedNode);
  const selectNode = useFormBuilderStore((s) => s.selectNode);
  const { requestAddField } = useAddElementDialogContext();

  const isSelected =
    selectedNode?.type === 'section' &&
    selectedNode.partId === partId &&
    selectedNode.sectionId === section.id;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all',
        isSelected
          ? 'border-violet-400 bg-violet-50/30'
          : 'border-gray-200 bg-gray-50/50'
      )}
    >
      <button
        type="button"
        onClick={() => selectNode({ type: 'section', partId, sectionId: section.id })}
        className="w-full text-left mb-2"
      >
        <h4 className={cn(
          'text-sm font-medium',
          isSelected ? 'text-violet-800' : 'text-gray-700'
        )}>
          {section.title}
        </h4>
        {section.description && (
          <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
        )}
      </button>

      <div className="space-y-1.5">
        {section.fields.map((field) => (
          <CanvasField
            key={field.id}
            field={field}
            partId={partId}
            sectionId={section.id}
          />
        ))}
      </div>

      <div className="mt-2">
        <FieldTypePicker
          onSelect={(type) => requestAddField(partId, section.id, type)}
        />
      </div>
    </div>
  );
}
