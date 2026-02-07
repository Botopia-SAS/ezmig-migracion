'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FIELD_TYPE_GROUPS, FIELD_TYPE_ICON } from './field-icons';
import type { FormField } from '@/lib/forms/service';
import { useState } from 'react';

interface Props {
  onSelect: (type: FormField['type']) => void;
}

export function FieldTypePicker({ onSelect }: Props) {
  const t = useTranslations('admin.formBuilder');
  const [open, setOpen] = useState(false);

  function handleSelect(type: FormField['type']) {
    onSelect(type);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t('canvas.addFieldHere')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        {FIELD_TYPE_GROUPS.map((group) => (
          <div key={group.category} className="mb-2 last:mb-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
              {t(`fieldTypeCategories.${group.category}`)}
            </p>
            <div className="grid grid-cols-2 gap-0.5">
              {group.types.map((type) => {
                const Icon = FIELD_TYPE_ICON[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelect(type)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t(`fieldTypes.${type}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
