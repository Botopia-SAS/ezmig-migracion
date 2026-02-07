'use client';

import { Input } from '@/components/ui/input';
import { FieldWrapper } from './field-wrapper';
import type { FormField } from './index';

interface FieldTextProps {
  field: FormField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  type?: string;
}

export function FieldText({
  field,
  value,
  onChange,
  error,
  disabled,
  type = 'text',
}: FieldTextProps) {
  const inputType = type === 'email' ? 'email' : type === 'number' ? 'number' : 'text';

  return (
    <FieldWrapper field={field} error={error} charCount={field.maxLength ? (value || '').length : undefined}>
      <Input
        id={field.id}
        type={inputType}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
    </FieldWrapper>
  );
}
