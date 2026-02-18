'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const LOCALES = ['en', 'es', 'pt'] as const;
export const LOCALE_LABELS: Record<string, string> = { en: 'EN', es: 'ES', pt: 'PT' };

export function TranslatableInput({
  label: fieldLabel,
  values,
  onChange,
  component = 'input',
  rows = 2,
}: {
  label: string;
  values: { en: string; es: string; pt: string };
  onChange: (locale: string, value: string) => void;
  component?: 'input' | 'textarea';
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{fieldLabel}</Label>
      <div className="space-y-1">
        {LOCALES.map((loc) => (
          <div key={loc} className="flex items-start gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 w-5 shrink-0 mt-1.5 text-center">
              {LOCALE_LABELS[loc]}
            </span>
            {component === 'textarea' ? (
              <Textarea
                value={values[loc]}
                onChange={(e) => onChange(loc, e.target.value)}
                className="text-xs min-h-0"
                rows={rows}
              />
            ) : (
              <Input
                value={values[loc]}
                onChange={(e) => onChange(loc, e.target.value)}
                className="text-xs h-7"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
