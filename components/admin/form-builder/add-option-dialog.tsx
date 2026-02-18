'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const LOCALES = ['en', 'es', 'pt'] as const;
const LOCALE_FLAGS: Record<string, string> = { en: 'EN', es: 'ES', pt: 'PT' };
const LOCALE_PLACEHOLDERS: Record<string, string> = { en: 'English', es: 'Español', pt: 'Português' };

function deriveValue(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

interface AddOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { value: string; labels: { en: string; es: string; pt: string } }) => void;
  existingValues: string[];
}

export function AddOptionDialog({
  open,
  onOpenChange,
  onConfirm,
  existingValues,
}: AddOptionDialogProps) {
  const t = useTranslations('admin.formBuilder.addDialog');

  const [value, setValue] = useState('');
  const [labels, setLabels] = useState({ en: '', es: '', pt: '' });
  const [valueTouched, setValueTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setValue('');
      setLabels({ en: '', es: '', pt: '' });
      setValueTouched(false);
    }
  }, [open]);

  function handleEnChange(en: string) {
    setLabels((prev) => ({ ...prev, en }));
    if (!valueTouched) {
      setValue(deriveValue(en));
    }
  }

  const canSubmit =
    value.trim().length > 0 &&
    labels.en.trim().length > 0 &&
    !existingValues.includes(value.trim());
  const missingTranslations = canSubmit && (!labels.es.trim() || !labels.pt.trim());
  const duplicateValue = value.trim().length > 0 && existingValues.includes(value.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm({ value: value.trim(), labels });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('titleOption')}</DialogTitle>
          <DialogDescription>{t('optionDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('optionValue')}</Label>
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setValueTouched(true);
              }}
              className="text-sm h-9 font-mono"
              placeholder="option_value"
            />
            {duplicateValue && (
              <p className="text-xs text-red-500">{t('duplicateValue')}</p>
            )}
          </div>

          <Label className="text-sm font-medium">{t('optionLabel')}</Label>
          {LOCALES.map((locale) => (
            <div key={locale} className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 w-6 shrink-0 text-center">
                {LOCALE_FLAGS[locale]}
              </span>
              <Input
                value={labels[locale]}
                onChange={(e) => {
                  if (locale === 'en') {
                    handleEnChange(e.target.value);
                  } else {
                    setLabels((prev) => ({ ...prev, [locale]: e.target.value }));
                  }
                }}
                placeholder={LOCALE_PLACEHOLDERS[locale]}
                className="text-sm h-9"
                autoFocus={locale === 'en'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) handleSubmit();
                }}
              />
              {locale === 'en' && (
                <span className="text-red-500 text-xs shrink-0">*</span>
              )}
            </div>
          ))}

          {missingTranslations && (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded px-2.5 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{t('missingTranslationsWarning')}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
