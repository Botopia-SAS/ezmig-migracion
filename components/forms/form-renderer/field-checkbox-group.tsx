'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { FieldWrapper } from './field-wrapper';
import type { FormField } from './index';

interface FieldCheckboxGroupProps {
  field: FormField;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldCheckboxGroup({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldCheckboxGroupProps) {
  const options = (field.options || []).map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const handleToggle = (optValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optValue]);
    } else {
      onChange(value.filter((v) => v !== optValue));
    }
  };

  return (
    <FieldWrapper field={field} error={error}>
      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-3">
            <Checkbox
              id={`${field.id}-${opt.value}`}
              checked={value.includes(opt.value)}
              onCheckedChange={(checked) =>
                handleToggle(opt.value, checked as boolean)
              }
              disabled={disabled}
            />
            <label
              htmlFor={`${field.id}-${opt.value}`}
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </FieldWrapper>
  );
}
