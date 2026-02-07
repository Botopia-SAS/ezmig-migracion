'use client';

import { Input } from '@/components/ui/input';
import { FieldWrapper } from './field-wrapper';
import type { FormField } from './index';

interface FieldDateProps {
  field: FormField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldDate({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldDateProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <Input
        id={field.id}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
    </FieldWrapper>
  );
}
