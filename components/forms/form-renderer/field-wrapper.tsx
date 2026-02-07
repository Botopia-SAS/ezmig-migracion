'use client';

import { Label } from '@/components/ui/label';
import type { FormField } from './index';

interface FieldWrapperProps {
  field: FormField;
  error?: string;
  children: React.ReactNode;
  /** Show character count when maxLength is set */
  charCount?: number;
}

export function FieldWrapper({ field, error, children, charCount }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {field.maxLength && charCount !== undefined && (
        <p className="text-xs text-gray-400 text-right">
          {charCount}/{field.maxLength}
        </p>
      )}
    </div>
  );
}
