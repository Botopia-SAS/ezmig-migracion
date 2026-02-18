'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JsonEditorDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('admin.formBuilder.jsonEditor');
  const schema = useFormBuilderStore((s) => s.schema);
  const formTypeId = useFormBuilderStore((s) => s.formTypeId);
  const setSchema = useFormBuilderStore((s) => s.setSchema);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setJsonText(JSON.stringify(schema, null, 2));
      setError(null);
    }
  }, [open, schema]);

  function handleApply() {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.parts || !Array.isArray(parsed.parts)) {
        setError(t('invalidSchema'));
        return;
      }
      setSchema(parsed, formTypeId!);
      // Mark as dirty by triggering a store update
      useFormBuilderStore.setState({ isDirty: true });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invalidJson'));
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
          <textarea
            className="w-full h-[60vh] font-mono text-xs p-4 border rounded-md bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            spellCheck={false}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleCopy}
            title={t('copy')}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleApply}>
            {t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
