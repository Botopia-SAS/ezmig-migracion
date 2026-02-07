'use client';

import { useFormBuilderStore, type SelectedNode } from '@/lib/stores/form-builder-store';
import { FIELD_TYPE_ICON } from './field-icons';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { FormField } from '@/lib/forms/service';

interface Props {
  field: FormField;
  partId: string;
  sectionId: string;
}

export function CanvasField({ field, partId, sectionId }: Props) {
  const t = useTranslations('admin.formBuilder');
  const selectedNode = useFormBuilderStore((s) => s.selectedNode);
  const selectNode = useFormBuilderStore((s) => s.selectNode);

  const isSelected =
    selectedNode?.type === 'field' &&
    selectedNode.partId === partId &&
    selectedNode.sectionId === sectionId &&
    selectedNode.fieldId === field.id;

  const Icon = FIELD_TYPE_ICON[field.type] || FIELD_TYPE_ICON.text;

  return (
    <button
      type="button"
      onClick={() => selectNode({ type: 'field', partId, sectionId, fieldId: field.id })}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-all hover:border-violet-300 hover:shadow-sm',
        isSelected
          ? 'border-violet-500 bg-violet-50 shadow-sm ring-1 ring-violet-200'
          : 'border-gray-200 bg-white'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-violet-600' : 'text-gray-400')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', isSelected ? 'text-violet-900 font-medium' : 'text-gray-800')}>
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </p>
        <p className="text-[10px] text-gray-400 font-mono">{field.id}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {t(`fieldTypes.${field.type}`)}
        </Badge>
        {field.conditionalDisplay && (
          <GitBranch className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
    </button>
  );
}
