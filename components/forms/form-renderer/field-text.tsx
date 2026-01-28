'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
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
      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {field.maxLength && (
        <p className="text-xs text-gray-400 text-right">
          {(value || '').length}/{field.maxLength}
        </p>
      )}
    </div>
  );
}
