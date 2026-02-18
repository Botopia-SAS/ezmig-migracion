'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AddOptionDialog } from './add-option-dialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FieldTranslation } from '@/lib/forms/service';

interface OptionItem {
  value: string;
  label: string;
}

interface Props {
  options: OptionItem[];
  onChange: (options: OptionItem[]) => void;
  translations?: Record<string, FieldTranslation>;
  onTranslationsChange?: (translations: Record<string, FieldTranslation>) => void;
}

export function OptionsEditor({ options, onChange, translations, onTranslationsChange }: Props) {
  const t = useTranslations('admin.formBuilder.properties.options');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleAddFromDialog(data: { value: string; labels: { en: string; es: string; pt: string } }) {
    onChange([...options, { value: data.value, label: data.labels.en }]);
    if (onTranslationsChange) {
      const current = translations || {};
      onTranslationsChange({
        ...current,
        es: {
          ...current.es,
          options: { ...current.es?.options, [data.value]: data.labels.es },
        },
        pt: {
          ...current.pt,
          options: { ...current.pt?.options, [data.value]: data.labels.pt },
        },
      });
    }
  }

  function handleRemove(index: number) {
    const removedValue = options[index].value;
    onChange(options.filter((_, i) => i !== index));
    // Remove translation entries for the removed option
    if (onTranslationsChange && translations) {
      const updated = { ...translations };
      for (const locale of ['es', 'pt']) {
        if (updated[locale]?.options) {
          const { [removedValue]: _, ...rest } = updated[locale].options!;
          updated[locale] = { ...updated[locale], options: rest };
        }
      }
      onTranslationsChange(updated);
    }
  }

  function handleUpdateValue(index: number, newValue: string) {
    const oldValue = options[index].value;
    const updated = [...options];
    updated[index] = { ...updated[index], value: newValue };
    onChange(updated);
    // Rename the option key in translations
    if (onTranslationsChange && translations && oldValue !== newValue) {
      const updatedTrans = { ...translations };
      for (const locale of ['es', 'pt']) {
        if (updatedTrans[locale]?.options?.[oldValue] !== undefined) {
          const translatedLabel = updatedTrans[locale].options![oldValue];
          const { [oldValue]: _, ...rest } = updatedTrans[locale].options!;
          updatedTrans[locale] = { ...updatedTrans[locale], options: { ...rest, [newValue]: translatedLabel } };
        }
      }
      onTranslationsChange(updatedTrans);
    }
  }

  function handleUpdateLabel(index: number, label: string) {
    const updated = [...options];
    updated[index] = { ...updated[index], label };
    onChange(updated);
  }

  function handleUpdateOptionTranslation(optionValue: string, locale: string, label: string) {
    if (!onTranslationsChange) return;
    const current = translations || {};
    onTranslationsChange({
      ...current,
      [locale]: {
        ...current[locale],
        options: { ...current[locale]?.options, [optionValue]: label },
      },
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = options.findIndex((_, i) => `opt-${i}` === active.id);
    const toIndex = options.findIndex((_, i) => `opt-${i}` === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    const result = [...options];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    onChange(result);
  }

  function handleBulkAdd() {
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const newOptions: OptionItem[] = [];
    const esEntries: Record<string, string> = {};
    const ptEntries: Record<string, string> = {};

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 4) {
        // value|EN|ES|PT format
        const value = parts[0].trim();
        newOptions.push({ value, label: parts[1].trim() });
        esEntries[value] = parts[2].trim();
        ptEntries[value] = parts[3].trim();
      } else if (parts.length >= 2) {
        // value|label (EN only, backward compatible)
        const value = parts[0].trim();
        newOptions.push({ value, label: parts[1].trim() });
        esEntries[value] = '';
        ptEntries[value] = '';
      } else {
        const label = parts[0].trim();
        const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        newOptions.push({ value, label });
        esEntries[value] = '';
        ptEntries[value] = '';
      }
    }

    onChange([...options, ...newOptions]);
    if (onTranslationsChange) {
      const current = translations || {};
      onTranslationsChange({
        ...current,
        es: {
          ...current.es,
          options: { ...current.es?.options, ...esEntries },
        },
        pt: {
          ...current.pt,
          options: { ...current.pt?.options, ...ptEntries },
        },
      });
    }
    setBulkText('');
    setShowBulk(false);
  }

  return (
    <div className="space-y-3">
      {options.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">{t('noOptions')}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={options.map((_, i) => `opt-${i}`)} strategy={verticalListSortingStrategy}>
            {options.map((opt, i) => (
              <SortableOption
                key={`opt-${i}`}
                id={`opt-${i}`}
                option={opt}
                onUpdateValue={(val) => handleUpdateValue(i, val)}
                onUpdateLabel={(val) => handleUpdateLabel(i, val)}
                onUpdateTranslation={(locale, label) =>
                  handleUpdateOptionTranslation(opt.value, locale, label)
                }
                esLabel={translations?.es?.options?.[opt.value] || ''}
                ptLabel={translations?.pt?.options?.[opt.value] || ''}
                onRemove={() => handleRemove(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="flex-1 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          {t('addOption')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowBulk(!showBulk)} className="text-xs">
          {t('bulkAdd')}
        </Button>
      </div>

      {showBulk && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-500">{t('bulkAddHelp')}</p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="text-xs font-mono"
            placeholder="value|EN|ES|PT&#10;another_value|Label|Etiqueta|Rótulo"
          />
          <Button size="sm" onClick={handleBulkAdd} disabled={!bulkText.trim()} className="text-xs">
            {t('addOption')}
          </Button>
        </div>
      )}

      <AddOptionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onConfirm={handleAddFromDialog}
        existingValues={options.map((o) => o.value)}
      />
    </div>
  );
}

// ---- Sortable Option Row ----

interface SortableOptionProps {
  id: string;
  option: OptionItem;
  onUpdateValue: (val: string) => void;
  onUpdateLabel: (val: string) => void;
  onUpdateTranslation: (locale: string, label: string) => void;
  esLabel: string;
  ptLabel: string;
  onRemove: () => void;
}

function SortableOption({
  id,
  option,
  onUpdateValue,
  onUpdateLabel,
  onUpdateTranslation,
  esLabel,
  ptLabel,
  onRemove,
}: SortableOptionProps) {
  const t = useTranslations('admin.formBuilder.properties.options');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-gray-100 p-2 space-y-1 bg-white">
      {/* Value + Delete row */}
      <div className="flex items-center gap-1.5">
        <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0">
          <GripVertical className="h-3 w-3" />
        </button>
        <Input
          value={option.value}
          onChange={(e) => onUpdateValue(e.target.value)}
          className="text-xs h-6 font-mono flex-1"
          placeholder={t('value')}
        />
        <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 shrink-0" title={t('removeOption')}>
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {/* EN / ES / PT label rows */}
      <div className="space-y-0.5 pl-5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 text-center">EN</span>
          <Input
            value={option.label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            className="text-xs h-6 flex-1"
            placeholder={t('label')}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 text-center">ES</span>
          <Input
            value={esLabel}
            onChange={(e) => onUpdateTranslation('es', e.target.value)}
            className="text-xs h-6 flex-1"
            placeholder={t('label')}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 text-center">PT</span>
          <Input
            value={ptLabel}
            onChange={(e) => onUpdateTranslation('pt', e.target.value)}
            className="text-xs h-6 flex-1"
            placeholder={t('label')}
          />
        </div>
      </div>
    </div>
  );
}
