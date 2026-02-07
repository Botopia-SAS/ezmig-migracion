'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Copy, Layers } from 'lucide-react';
import { useFormBuilderStore } from '@/lib/stores/form-builder-store';
import { useTranslations } from 'next-intl';
import { OptionsEditor } from './options-editor';
import { ConditionalEditor } from './conditional-editor';
import type { FormField, FormPart, FormSection } from '@/lib/forms/service';

const LOCALES = ['en', 'es', 'pt'] as const;
const LOCALE_LABELS: Record<string, string> = { en: 'EN', es: 'ES', pt: 'PT' };

// ---- Translatable Input (3 rows: EN / ES / PT) ----

function TranslatableInput({
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

// ---- Main Panel ----

export function PropertiesPanel() {
  const selectedNode = useFormBuilderStore((s) => s.selectedNode);
  const schema = useFormBuilderStore((s) => s.schema);

  if (!selectedNode) {
    return <EmptyProperties />;
  }

  if (selectedNode.type === 'part') {
    const part = schema.parts.find((p) => p.id === selectedNode.partId);
    if (!part) return <EmptyProperties />;
    return <PartProperties part={part} />;
  }

  if (selectedNode.type === 'section') {
    const part = schema.parts.find((p) => p.id === selectedNode.partId);
    const section = part?.sections.find((s) => s.id === selectedNode.sectionId);
    if (!section) return <EmptyProperties />;
    return <SectionProperties partId={selectedNode.partId} section={section} />;
  }

  if (selectedNode.type === 'field') {
    const part = schema.parts.find((p) => p.id === selectedNode.partId);
    const section = part?.sections.find((s) => s.id === selectedNode.sectionId);
    const field = section?.fields.find((f) => f.id === selectedNode.fieldId);
    if (!field) return <EmptyProperties />;
    return (
      <FieldProperties
        partId={selectedNode.partId}
        sectionId={selectedNode.sectionId!}
        field={field}
      />
    );
  }

  return <EmptyProperties />;
}

// ---- Empty State ----

function EmptyProperties() {
  const t = useTranslations('admin.formBuilder.properties');
  const tStats = useTranslations('admin.formBuilder.stats');
  const schema = useFormBuilderStore((s) => s.schema);

  const stats = useMemo(() => {
    let sections = 0;
    let fields = 0;
    let required = 0;
    for (const part of schema.parts) {
      sections += part.sections.length;
      for (const section of part.sections) {
        fields += section.fields.length;
        required += section.fields.filter((f) => f.required).length;
      }
    }
    return { parts: schema.parts.length, sections, fields, required };
  }, [schema]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <Layers className="h-8 w-8 text-gray-300 mb-3" />
      <p className="text-sm text-gray-500 mb-4">{t('noSelection')}</p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
        {(['parts', 'sections', 'fields', 'required'] as const).map((key) => (
          <div key={key} className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-semibold text-gray-900">{stats[key]}</p>
            <p className="text-[10px] text-gray-500">{tStats(key)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Part Properties ----

function PartProperties({ part }: { part: FormPart }) {
  const t = useTranslations('admin.formBuilder.properties.part');
  const updatePart = useFormBuilderStore((s) => s.updatePart);
  const removePart = useFormBuilderStore((s) => s.removePart);
  const selectNode = useFormBuilderStore((s) => s.selectNode);

  function handleTitleChange(locale: string, value: string) {
    if (locale === 'en') {
      updatePart(part.id, { title: value });
    } else {
      const current = part.translations || {};
      updatePart(part.id, {
        translations: {
          ...current,
          [locale]: { ...current[locale], title: value },
        },
      } as any);
    }
  }

  function handleDelete() {
    if (confirm(t('deleteConfirm'))) {
      removePart(part.id);
      selectNode(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{t('title')}</h3>
      <TranslatableInput
        label={t('title')}
        values={{
          en: part.title,
          es: part.translations?.es?.title || '',
          pt: part.translations?.pt?.title || '',
        }}
        onChange={handleTitleChange}
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        className="w-full text-xs"
      >
        <Trash2 className="h-3 w-3 mr-1.5" />
        {t('deletePart')}
      </Button>
    </div>
  );
}

// ---- Section Properties ----

function SectionProperties({ partId, section }: { partId: string; section: FormSection }) {
  const t = useTranslations('admin.formBuilder.properties.section');
  const updateSection = useFormBuilderStore((s) => s.updateSection);
  const removeSection = useFormBuilderStore((s) => s.removeSection);
  const selectNode = useFormBuilderStore((s) => s.selectNode);

  function handleTitleChange(locale: string, value: string) {
    if (locale === 'en') {
      updateSection(partId, section.id, { title: value });
    } else {
      const current = section.translations || {};
      updateSection(partId, section.id, {
        translations: {
          ...current,
          [locale]: { ...current[locale], title: value },
        },
      } as any);
    }
  }

  function handleDescriptionChange(locale: string, value: string) {
    if (locale === 'en') {
      updateSection(partId, section.id, { description: value || undefined });
    } else {
      const current = section.translations || {};
      updateSection(partId, section.id, {
        translations: {
          ...current,
          [locale]: { ...current[locale], description: value || undefined },
        },
      } as any);
    }
  }

  function handleDelete() {
    if (confirm(t('deleteConfirm'))) {
      removeSection(partId, section.id);
      selectNode(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{t('title')}</h3>
      <TranslatableInput
        label={t('title')}
        values={{
          en: section.title,
          es: section.translations?.es?.title || '',
          pt: section.translations?.pt?.title || '',
        }}
        onChange={handleTitleChange}
      />
      <TranslatableInput
        label={t('description')}
        values={{
          en: section.description || '',
          es: section.translations?.es?.description || '',
          pt: section.translations?.pt?.description || '',
        }}
        onChange={handleDescriptionChange}
        component="textarea"
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        className="w-full text-xs"
      >
        <Trash2 className="h-3 w-3 mr-1.5" />
        {t('deleteSection')}
      </Button>
    </div>
  );
}

// ---- Field Properties ----

function FieldProperties({
  partId,
  sectionId,
  field,
}: {
  partId: string;
  sectionId: string;
  field: FormField;
}) {
  const t = useTranslations('admin.formBuilder.properties.field');
  const tTypes = useTranslations('admin.formBuilder.fieldTypes');
  const updateField = useFormBuilderStore((s) => s.updateField);
  const removeField = useFormBuilderStore((s) => s.removeField);
  const duplicateField = useFormBuilderStore((s) => s.duplicateField);
  const selectNode = useFormBuilderStore((s) => s.selectNode);

  const hasOptions = ['select', 'radio', 'checkbox_group'].includes(field.type);
  const fieldPath = `${partId}.${sectionId}.${field.id}`;

  function update(data: Partial<FormField>) {
    updateField(partId, sectionId, field.id, data);
  }

  // Helper to update a translation key for a specific locale
  function updateTranslation(locale: string, key: string, value: string) {
    const current = field.translations || {};
    update({
      translations: {
        ...current,
        [locale]: {
          ...current[locale],
          [key]: value || undefined,
        },
      },
    });
  }

  function handleLabelChange(locale: string, value: string) {
    if (locale === 'en') {
      update({ label: value });
    } else {
      updateTranslation(locale, 'label', value);
    }
  }

  function handlePlaceholderChange(locale: string, value: string) {
    if (locale === 'en') {
      update({ placeholder: value || undefined });
    } else {
      updateTranslation(locale, 'placeholder', value);
    }
  }

  function handleHelpTextChange(locale: string, value: string) {
    if (locale === 'en') {
      update({ helpText: value || undefined });
    } else {
      updateTranslation(locale, 'helpText', value);
    }
  }

  function handleTypeChange(newType: string) {
    const needsOptions = ['select', 'radio', 'checkbox_group'].includes(newType);
    const data: Partial<FormField> = { type: newType as FormField['type'] };
    if (needsOptions && !field.options?.length) {
      data.options = [{ value: 'option1', label: 'Option 1' }];
    }
    if (!needsOptions) {
      data.options = undefined;
    }
    update(data);
  }

  function handleDelete() {
    if (confirm(t('deleteConfirm'))) {
      removeField(partId, sectionId, field.id);
      selectNode(null);
    }
  }

  const allFieldTypes: FormField['type'][] = [
    'text', 'textarea', 'date', 'select', 'radio', 'checkbox',
    'checkbox_group', 'phone', 'email', 'number', 'ssn', 'alien_number',
  ];

  return (
    <div className="p-4">
      <Tabs defaultValue="general">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="general" className="text-xs">
            {useTranslations('admin.formBuilder.properties.tabs')('general')}
          </TabsTrigger>
          <TabsTrigger value="options" className="text-xs" disabled={!hasOptions}>
            {useTranslations('admin.formBuilder.properties.tabs')('options')}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            {useTranslations('admin.formBuilder.properties.tabs')('advanced')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('id')}</Label>
            <Input
              value={field.id}
              onChange={(e) => update({ id: e.target.value })}
              className="text-xs h-8 font-mono"
            />
            <p className="text-[10px] text-gray-400">{t('idHelp')}</p>
          </div>

          <TranslatableInput
            label={t('label')}
            values={{
              en: field.label,
              es: field.translations?.es?.label || '',
              pt: field.translations?.pt?.label || '',
            }}
            onChange={handleLabelChange}
          />

          <div className="space-y-1.5">
            <Label className="text-xs">{t('type')}</Label>
            <Select value={field.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allFieldTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs">
                    {tTypes(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">{t('required')}</Label>
            <Switch
              checked={field.required || false}
              onCheckedChange={(v) => update({ required: v })}
            />
          </div>

          <TranslatableInput
            label={t('placeholder')}
            values={{
              en: field.placeholder || '',
              es: field.translations?.es?.placeholder || '',
              pt: field.translations?.pt?.placeholder || '',
            }}
            onChange={handlePlaceholderChange}
          />

          <TranslatableInput
            label={t('helpText')}
            values={{
              en: field.helpText || '',
              es: field.translations?.es?.helpText || '',
              pt: field.translations?.pt?.helpText || '',
            }}
            onChange={handleHelpTextChange}
            component="textarea"
          />

          {(field.type === 'text' || field.type === 'textarea') && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t('maxLength')}</Label>
              <Input
                type="number"
                min={0}
                value={field.maxLength || ''}
                onChange={(e) =>
                  update({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="text-xs h-8"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="options" className="mt-3">
          {hasOptions && (
            <OptionsEditor
              options={(field.options || []).map((opt) =>
                typeof opt === 'string' ? { value: opt, label: opt } : opt
              )}
              onChange={(opts) => update({ options: opts })}
              translations={field.translations}
              onTranslationsChange={(translations) => update({ translations })}
            />
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pdfField')}</Label>
            <Input
              value={field.pdfField || ''}
              onChange={(e) => update({ pdfField: e.target.value || undefined })}
              className="text-xs h-8 font-mono"
            />
            <p className="text-[10px] text-gray-400">{t('pdfFieldHelp')}</p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <ConditionalEditor
              value={field.conditionalDisplay}
              onChange={(cd) => update({ conditionalDisplay: cd })}
              currentFieldPath={fieldPath}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => duplicateField(partId, sectionId, field.id)}
          className="flex-1 text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          {t('duplicateField')}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="flex-1 text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          {t('deleteField')}
        </Button>
      </div>
    </div>
  );
}
