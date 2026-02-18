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

export type AddElementType = 'part' | 'section' | 'field';

interface AddElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementType: AddElementType;
  fieldType?: string;
  onConfirm: (values: { en: string; es: string; pt: string }) => void;
}

export function AddElementDialog({
  open,
  onOpenChange,
  elementType,
  fieldType,
  onConfirm,
}: AddElementDialogProps) {
  const t = useTranslations('admin.formBuilder.addDialog');
  const tTypes = useTranslations('admin.formBuilder.fieldTypes');

  const [values, setValues] = useState({ en: '', es: '', pt: '' });

  useEffect(() => {
    if (open) {
      setValues({ en: '', es: '', pt: '' });
    }
  }, [open]);

  const canSubmit = values.en.trim().length > 0;
  const missingTranslations = canSubmit && (!values.es.trim() || !values.pt.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm(values);
    onOpenChange(false);
  }

  const dialogTitle =
    elementType === 'field'
      ? t('titleField', { type: tTypes(fieldType || 'text') })
      : t(elementType === 'part' ? 'titlePart' : 'titleSection');

  const inputLabel = elementType === 'field' ? t('fieldLabel') : t('elementTitle');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">{inputLabel}</Label>
          {LOCALES.map((locale) => (
            <div key={locale} className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 w-6 shrink-0 text-center">
                {LOCALE_FLAGS[locale]}
              </span>
              <Input
                value={values[locale]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [locale]: e.target.value }))
                }
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
