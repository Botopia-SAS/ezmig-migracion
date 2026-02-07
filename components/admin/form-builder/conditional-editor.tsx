'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useTranslations } from 'next-intl';
import type { FormField } from '@/lib/forms/service';

interface ConditionalDisplay {
  field: string;
  value: string | boolean | string[];
  operator?: 'equals' | 'notEquals' | 'in' | 'notIn';
}

interface Props {
  value: ConditionalDisplay | undefined;
  onChange: (value: ConditionalDisplay | undefined) => void;
  currentFieldPath: string; // e.g. "part1.section1.field1" — to exclude from deps list
}

export function ConditionalEditor({ value, onChange, currentFieldPath }: Props) {
  const t = useTranslations('admin.formBuilder.properties.conditional');
  const schema = useFormBuilderStore((s) => s.schema);

  // Build a flat list of all field paths + their options
  const allFields = useMemo(() => {
    const fields: { path: string; label: string; options?: { value: string; label: string }[] }[] = [];
    for (const part of schema.parts) {
      for (const section of part.sections) {
        for (const field of section.fields) {
          const path = `${part.id}.${section.id}.${field.id}`;
          if (path !== currentFieldPath) {
            fields.push({
              path,
              label: `${field.label} (${path})`,
              options: field.options as { value: string; label: string }[] | undefined,
            });
          }
        }
      }
    }
    return fields;
  }, [schema, currentFieldPath]);

  const enabled = !!value;
  const selectedFieldPath = value?.field || '';
  const selectedField = allFields.find((f) => f.path === selectedFieldPath);

  function handleToggle(checked: boolean) {
    if (checked) {
      onChange({ field: '', value: '', operator: 'equals' });
    } else {
      onChange(undefined);
    }
  }

  function handleFieldChange(fieldPath: string) {
    onChange({ ...value!, field: fieldPath });
  }

  function handleOperatorChange(op: string) {
    onChange({ ...value!, operator: op as ConditionalDisplay['operator'] });
  }

  function handleValueChange(val: string) {
    onChange({ ...value!, value: val });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{t('enabled')}</Label>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('dependsOn')}</Label>
            <Select value={selectedFieldPath} onValueChange={handleFieldChange}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder={t('dependsOnPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {allFields.map((f) => (
                  <SelectItem key={f.path} value={f.path} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('operator')}</Label>
            <Select value={value?.operator || 'equals'} onValueChange={handleOperatorChange}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">{t('operators.equals')}</SelectItem>
                <SelectItem value="notEquals">{t('operators.notEquals')}</SelectItem>
                <SelectItem value="in">{t('operators.in')}</SelectItem>
                <SelectItem value="notIn">{t('operators.notIn')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('value')}</Label>
            {selectedField?.options ? (
              <Select
                value={typeof value?.value === 'string' ? value.value : ''}
                onValueChange={handleValueChange}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder={t('valuePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {selectedField.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={typeof value?.value === 'string' ? value.value : ''}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={t('valuePlaceholder')}
                className="text-xs h-8"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
