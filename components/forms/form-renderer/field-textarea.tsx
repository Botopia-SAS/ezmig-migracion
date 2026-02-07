'use client';

import { Textarea } from '@/components/ui/textarea';
import { FieldWrapper } from './field-wrapper';
import type { FormField } from './index';

interface FieldTextareaProps {
  field: FormField;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldTextarea({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldTextareaProps) {
  return (
    <FieldWrapper field={field} error={error} charCount={field.maxLength ? (value || '').length : undefined}>
      <Textarea
        id={field.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={4}
        className={error ? 'border-red-500' : ''}
      />
    </FieldWrapper>
  );
}
