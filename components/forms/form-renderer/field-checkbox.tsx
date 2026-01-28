'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { FormField } from './index';

interface FieldCheckboxProps {
  field: FormField;
  checked: boolean | undefined;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldCheckbox({
  field,
  checked,
  onCheckedChange,
  error,
  disabled,
}: FieldCheckboxProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <Checkbox
          id={field.id}
          checked={checked || false}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        <div className="space-y-1">
          <Label
            htmlFor={field.id}
            className="font-normal cursor-pointer leading-relaxed"
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.helpText && (
            <p className="text-xs text-gray-500">{field.helpText}</p>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 ml-7">{error}</p>}
    </div>
  );
}
