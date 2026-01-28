'use client';

import { Label } from '@/components/ui/label';
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
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <textarea
        id={field.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={4}
        className={`w-full rounded-md border ${
          error ? 'border-red-500' : 'border-input'
        } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
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
