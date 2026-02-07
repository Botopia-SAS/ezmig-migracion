'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldWrapper } from './field-wrapper';
import type { FormField } from './index';

interface FieldSelectProps {
  field: FormField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldSelect({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldSelectProps) {
  const t = useTranslations('dashboard.forms.renderer');
  // Normalize options to { value, label } format
  const normalizedOptions = (field.options || []).map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <FieldWrapper field={field} error={error}>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={field.placeholder || t('selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
}
