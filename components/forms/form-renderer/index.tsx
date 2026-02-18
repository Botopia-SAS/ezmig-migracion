'use client';

import { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, Clock, Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { FieldText } from './field-text';
import { FieldTextarea } from './field-textarea';
import { FieldDate } from './field-date';
import { FieldSelect } from './field-select';
import { FieldRadio } from './field-radio';
import { FieldCheckbox } from './field-checkbox';
import { FieldCheckboxGroup } from './field-checkbox-group';
import { FieldAttachments } from './field-attachments';
import { useFieldEvidences } from '@/hooks/use-field-evidences';
import { ChatWidget } from '@/components/ai-assistant';
import { interpolateField, interpolateText } from '@/lib/forms/name-interpolation';
import type { FormContext } from '@/lib/relationships/service';

// Types
export interface FormSchema {
  formCode: string;
  parts: FormPart[];
  validationRules?: ValidationRule[];
}

export interface FormPart {
  id: string;
  title: string;
  translations?: Record<string, { title?: string }>;
  sections: FormSection[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  translations?: Record<string, { title?: string; description?: string }>;
  fields: FormField[];
}

export interface FieldTranslation {
  label?: string;
  helpText?: string;
  placeholder?: string;
  options?: Record<string, string>;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[] | string[];
  pdfField?: string;
  translations?: Record<string, FieldTranslation>;
  conditionalDisplay?: {
    field: string;
    value: string | boolean | string[];
    operator?: 'equals' | 'notEquals' | 'in' | 'notIn';
  };
}

export interface ValidationRule {
  id: string;
  message: string;
  condition: string;
}

interface FormRendererProps {
  formSchema: FormSchema;
  initialData: Record<string, unknown>;
  caseId?: number;
  caseFormId: number;
  onAutosave: (fieldPath: string, value: string | null) => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  readOnly?: boolean;
  onProgressChange?: (progress: number) => void;
  formContext?: FormContext | null; // Add form context for name interpolation
}

// Get nested value from object using path like "part1.section1.field1"
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

// Set nested value in object
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split('.');
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    } else {
      current[key] = { ...(current[key] as Record<string, unknown>) };
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

// Check if a field should be visible based on conditionalDisplay
function isFieldVisible(
  field: FormField,
  formData: Record<string, unknown>
): boolean {
  if (!field.conditionalDisplay) return true;

  const { field: depPath, value: expected, operator = 'equals' } = field.conditionalDisplay;
  const actual = getNestedValue(formData, depPath);

  switch (operator) {
    case 'equals':
      return actual === expected;
    case 'notEquals':
      return actual !== expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual as string);
    case 'notIn':
      return Array.isArray(expected) && !expected.includes(actual as string);
    default:
      return actual === expected;
  }
}

// Check if a section has all required visible fields filled
// Returns false if the section has no visible required fields (e.g. all conditional & hidden)
function isSectionComplete(
  part: FormPart,
  section: FormSection,
  formData: Record<string, unknown>
): boolean {
  let hasVisibleRequired = false;
  for (const field of section.fields) {
    if (!field.required) continue;
    if (!isFieldVisible(field, formData)) continue;
    hasVisibleRequired = true;
    const fieldPath = `${part.id}.${section.id}.${field.id}`;
    const value = getNestedValue(formData, fieldPath);
    if (value === undefined || value === null || value === '') return false;
  }
  return hasVisibleRequired;
}

// Check if a part has all sections complete
// Returns false if the part has no visible required fields
function isPartComplete(
  part: FormPart,
  formData: Record<string, unknown>
): boolean {
  let hasVisibleRequired = false;
  for (const section of part.sections) {
    for (const field of section.fields) {
      if (!field.required) continue;
      if (!isFieldVisible(field, formData)) continue;
      hasVisibleRequired = true;
      const fieldPath = `${part.id}.${section.id}.${field.id}`;
      const value = getNestedValue(formData, fieldPath);
      if (value === undefined || value === null || value === '') return false;
    }
  }
  return hasVisibleRequired;
}

export function FormRenderer({
  formSchema,
  initialData,
  caseId = 0,
  caseFormId,
  onAutosave,
  onSave,
  readOnly = false,
  onProgressChange,
  formContext = null,
}: FormRendererProps) {
  const t = useTranslations('dashboard.forms.renderer');
  const tForms = useTranslations('forms');
  const locale = useLocale();
  const formKey = formSchema.formCode.toLowerCase(); // e.g. "i-130"

  // Translate schema text with fallback to English schema value
  // Priority: schema translations[locale] → message files → fallback string
  const tf = useCallback(
    (key: string, fallback: string): string => {
      const fullKey = `${formKey}.${key}`;
      return tForms.has(fullKey) ? tForms(fullKey) : fallback;
    },
    [formKey, tForms]
  );

  // Translate a part title with interpolation support
  const translatePartTitle = useCallback(
    (part: FormPart): string => {
      const schemaTitle = part.translations?.[locale]?.title;
      const defaultTitle = part.title;
      const fallbackTitle = (part as any).fallbackTitle;

      // Try schema translation with interpolation first
      if (schemaTitle && formContext && schemaTitle.includes('{{')) {
        const interpolated = interpolateText(schemaTitle, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Try default title with interpolation
      if (defaultTitle && formContext && defaultTitle.includes('{{')) {
        const interpolated = interpolateText(defaultTitle, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Fall back to schema translation without interpolation
      if (schemaTitle) return schemaTitle;

      // Try message file translation
      const messageTranslation = tf(`${part.id}.title`, defaultTitle);
      if (messageTranslation !== defaultTitle) return messageTranslation;

      // Final fallbacks
      return fallbackTitle || defaultTitle;
    },
    [locale, tf, formContext]
  );

  // Translate a section title with interpolation support
  const translateSectionTitle = useCallback(
    (partId: string, section: FormSection): string => {
      const schemaTitle = section.translations?.[locale]?.title;
      const defaultTitle = section.title;
      const fallbackTitle = (section as any).fallbackTitle;

      // Try schema translation with interpolation first
      if (schemaTitle && formContext && schemaTitle.includes('{{')) {
        const interpolated = interpolateText(schemaTitle, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Try default title with interpolation
      if (defaultTitle && formContext && defaultTitle.includes('{{')) {
        const interpolated = interpolateText(defaultTitle, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Fall back to schema translation without interpolation
      if (schemaTitle) return schemaTitle;

      // Try message file translation
      const messageTranslation = tf(`${partId}.${section.id}.title`, defaultTitle);
      if (messageTranslation !== defaultTitle) return messageTranslation;

      // Final fallbacks
      return fallbackTitle || defaultTitle;
    },
    [locale, tf, formContext]
  );

  const translateSectionDescription = useCallback(
    (partId: string, section: FormSection): string | undefined => {
      if (!section.description) return undefined;

      // Priority: schema translations with interpolation → schema default with interpolation → message files → fallback
      const schemaTranslation = section.translations?.[locale]?.description;
      const schemaDefault = section.description;
      const fallbackDescription = (section as any).fallbackDescription;

      // Try schema translation first (highest priority)
      if (schemaTranslation && formContext && schemaTranslation.includes('{{')) {
        const interpolated = interpolateText(schemaTranslation, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Try schema default with interpolation
      if (schemaDefault && formContext && schemaDefault.includes('{{')) {
        const interpolated = interpolateText(schemaDefault, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Fall back to schema translation without interpolation
      if (schemaTranslation) return schemaTranslation;

      // Fall back to fallback description with interpolation
      if (fallbackDescription && formContext && fallbackDescription.includes('{{')) {
        const interpolated = interpolateText(fallbackDescription, formContext, locale);
        if (interpolated !== null) return interpolated;
      }

      // Try message file translation
      const messageTranslation = tf(`${partId}.${section.id}.description`, schemaDefault);
      if (messageTranslation !== schemaDefault) return messageTranslation;

      // Final fallbacks
      return fallbackDescription || schemaDefault;
    },
    [locale, tf, formContext]
  );

  // Translate a field object before passing to child components
  // Priority: name interpolation → schema translations[locale] → message files → field default
  const translateField = useCallback(
    (field: FormField, partId: string, sectionId: string): FormField => {
      const base = `${partId}.${sectionId}.${field.id}`;
      const ft = field.translations?.[locale];

      // First, apply standard translations
      const standardTranslated = {
        ...field,
        label: ft?.label || tf(`${base}.label`, field.label),
        helpText: ft?.helpText || (field.helpText ? tf(`${base}.helpText`, field.helpText) : undefined),
        placeholder: ft?.placeholder || (field.placeholder ? tf(`${base}.placeholder`, field.placeholder) : undefined),
        options: field.options?.map((opt) => {
          if (typeof opt === 'string') return opt;
          const translatedLabel = ft?.options?.[opt.value] || tf(`${base}.options.${opt.value}`, opt.label);
          return { ...opt, label: translatedLabel };
        }) as FormField['options'],
      };

      // Then, apply name interpolation if form context is available
      const interpolated = interpolateField(standardTranslated, formContext, locale);

      return interpolated;
    },
    [locale, tf, formContext]
  );

  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentPart = formSchema.parts[currentPartIndex];
  const currentSection = currentPart?.sections[currentSectionIndex];

  // Field evidence attachments
  const { getForField, removeEvidence, refresh: refreshEvidences } = useFieldEvidences(caseId, caseFormId);
  const hasEvidences = caseId > 0 && caseFormId > 0;

  // Debounced autosave
  const debouncedAutosave = useDebouncedCallback(
    async (fieldPath: string, value: string | null) => {
      if (readOnly) return;
      setAutosaveStatus('saving');
      try {
        await onAutosave(fieldPath, value);
        setLastSaved(new Date());
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Autosave failed:', error);
        setAutosaveStatus('idle');
      }
    },
    1000
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldPath: string, value: unknown) => {
      setFormData((prev) => setNestedValue(prev, fieldPath, value));
      debouncedAutosave(fieldPath, value as string | null);
    },
    [debouncedAutosave]
  );

  // Calculate progress (skip conditionally hidden fields)
  const calculateProgress = useCallback(() => {
    let totalRequired = 0;
    let filledRequired = 0;

    for (const part of formSchema.parts) {
      for (const section of part.sections) {
        for (const field of section.fields) {
          if (field.required && isFieldVisible(field, formData)) {
            totalRequired++;
            const fieldPath = `${part.id}.${section.id}.${field.id}`;
            const value = getNestedValue(formData, fieldPath);
            if (value !== undefined && value !== null && value !== '') {
              filledRequired++;
            }
          }
        }
      }
    }

    if (totalRequired === 0) return 100;
    return Math.round((filledRequired / totalRequired) * 100);
  }, [formSchema, formData]);

  // Report progress to parent
  const progress = calculateProgress();
  const prevProgressRef = useRef(progress);
  useEffect(() => {
    if (onProgressChange && prevProgressRef.current !== progress) {
      prevProgressRef.current = progress;
      onProgressChange(progress);
    }
  }, [progress, onProgressChange]);

  // Also report initial progress on mount
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(calculateProgress());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation
  const canGoNext = currentPartIndex < formSchema.parts.length - 1 ||
    currentSectionIndex < currentPart.sections.length - 1;

  const canGoPrev = currentPartIndex > 0 || currentSectionIndex > 0;

  const handleNext = () => {
    if (currentSectionIndex < currentPart.sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
    } else if (currentPartIndex < formSchema.parts.length - 1) {
      setCurrentPartIndex((prev) => prev + 1);
      setCurrentSectionIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
    } else if (currentPartIndex > 0) {
      setCurrentPartIndex((prev) => prev - 1);
      const prevPart = formSchema.parts[currentPartIndex - 1];
      setCurrentSectionIndex(prevPart.sections.length - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  // Render a single field (returns null if conditionally hidden)
  const renderField = (field: FormField, partId: string, sectionId: string) => {
    // Check conditional visibility
    if (!isFieldVisible(field, formData)) return null;

    const fieldPath = `${partId}.${sectionId}.${field.id}`;
    const value = getNestedValue(formData, fieldPath);
    const error = errors[fieldPath];
    const translatedField = translateField(field, partId, sectionId);

    const commonProps = {
      field: translatedField,
      value: value as string | undefined,
      onChange: (v: string) => handleFieldChange(fieldPath, v),
      error,
      disabled: readOnly,
    };

    let fieldElement: React.ReactNode;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'ssn':
      case 'alien_number':
      case 'number':
        fieldElement = <FieldText {...commonProps} type={field.type} />;
        break;
      case 'textarea':
        fieldElement = <FieldTextarea {...commonProps} />;
        break;
      case 'date':
        fieldElement = <FieldDate {...commonProps} />;
        break;
      case 'select':
        fieldElement = <FieldSelect {...commonProps} />;
        break;
      case 'radio':
        fieldElement = <FieldRadio {...commonProps} />;
        break;
      case 'checkbox':
        fieldElement = (
          <FieldCheckbox
            {...commonProps}
            checked={value as boolean}
            onCheckedChange={(v) => handleFieldChange(fieldPath, v)}
          />
        );
        break;
      case 'checkbox_group':
        fieldElement = (
          <FieldCheckboxGroup
            field={translatedField}
            value={(value as string[]) || []}
            onChange={(v) => handleFieldChange(fieldPath, v)}
            error={error}
            disabled={readOnly}
          />
        );
        break;
      default:
        fieldElement = <FieldText {...commonProps} />;
    }

    return (
      <div key={field.id}>
        {fieldElement}
        {hasEvidences && field.allowEvidences && (
          <FieldAttachments
            caseId={caseId}
            caseFormId={caseFormId}
            fieldPath={fieldPath}
            evidences={getForField(fieldPath)}
            onUploadComplete={refreshEvidences}
            onDelete={removeEvidence}
            disabled={readOnly}
          />
        )}
      </div>
    );
  };

  // Preparar contexto para el asistente IA
  const aiFormContext = {
    formCode: formSchema.formCode,
    currentPart: currentPart ? {
      id: currentPart.id,
      title: translatePartTitle(currentPart),
      index: currentPartIndex + 1,
      total: formSchema.parts.length
    } : null,
    currentSection: currentSection ? {
      id: currentSection.id,
      title: translateSectionTitle(currentPart.id, currentSection),
      description: translateSectionDescription(currentPart.id, currentSection),
      index: currentSectionIndex + 1,
      total: currentPart.sections.length
    } : null,
    currentFields: currentSection?.fields.filter(field => isFieldVisible(field, formData)).map(field => {
      const translatedField = translateField(field, currentPart.id, currentSection.id);
      const fieldPath = `${currentPart.id}.${currentSection.id}.${field.id}`;
      const value = getNestedValue(formData, fieldPath);
      return {
        id: field.id,
        type: field.type,
        label: translatedField.label,
        required: field.required,
        helpText: translatedField.helpText,
        currentValue: value,
        isEmpty: value === undefined || value === null || value === ''
      };
    }),
    progress: progress,
    locale: locale
  };

  return (
    <div className="space-y-4">
      {/* Part Stepper (horizontal) */}
      <div className="flex items-start px-1 pt-1 overflow-x-auto pb-1">
        {formSchema.parts.map((part, idx) => {
            const completed = isPartComplete(part, formData);
            const active = idx === currentPartIndex;
            const translatedPartTitle = translatePartTitle(part);
            const shortTitle = translatedPartTitle.replace(/^Part\s*\d+\.\s*/i, '').replace(/^Parte\s*\d+\.\s*/i, '');

            return (
              <Fragment key={part.id}>
                {/* Connector line (sibling, not child of step) */}
                {idx > 0 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mt-4 min-w-2',
                      isPartComplete(formSchema.parts[idx - 1], formData)
                        ? 'bg-violet-400'
                        : 'bg-gray-200'
                    )}
                  />
                )}
                {/* Step: circle + label */}
                <button
                  onClick={() => {
                    setCurrentPartIndex(idx);
                    setCurrentSectionIndex(0);
                  }}
                  title={translatedPartTitle}
                  className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0',
                      completed && !active && 'bg-violet-600 text-white',
                      active && !completed && 'border-2 border-violet-600 text-violet-600 bg-white',
                      active && completed && 'bg-violet-600 text-white ring-2 ring-violet-300 ring-offset-1',
                      !completed && !active && 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {completed && !active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] leading-tight text-center w-full truncate',
                      active ? 'text-violet-600 font-medium' : completed ? 'text-violet-600' : 'text-gray-400'
                    )}
                  >
                    {shortTitle}
                  </span>
                </button>
              </Fragment>
            );
          })}
      </div>

      {/* 2-column layout: Section sidebar + Form content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Section Sidebar (current part only) */}
        <aside className="col-span-12 lg:col-span-3">
          <Card className="sticky top-16">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {currentPart ? translatePartTitle(currentPart) : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <nav className="space-y-0.5">
                {currentPart?.sections.map((section, sectionIdx) => {
                  const sectionDone = isSectionComplete(currentPart, section, formData);
                  const sectionActive = sectionIdx === currentSectionIndex;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSectionIndex(sectionIdx)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2.5',
                        sectionActive
                          ? 'bg-violet-50 text-violet-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {/* Completion circle */}
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
                          sectionDone && !sectionActive && 'bg-violet-600 text-white',
                          sectionActive && !sectionDone && 'border-2 border-violet-600 text-violet-600 bg-white',
                          sectionActive && sectionDone && 'bg-violet-600 text-white ring-1 ring-violet-300',
                          !sectionDone && !sectionActive && 'bg-gray-200 text-gray-500'
                        )}
                      >
                        {sectionDone && !sectionActive ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          sectionIdx + 1
                        )}
                      </span>
                      <span className="truncate">{translateSectionTitle(currentPart.id, section)}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Form Content */}
        <main className="col-span-12 lg:col-span-9">
          {/* Current Section */}
          {currentSection && (
            <Card>
              <CardHeader>
                <div className="text-sm text-violet-600 font-medium">
                  {translatePartTitle(currentPart)}
                </div>
                <CardTitle>{translateSectionTitle(currentPart.id, currentSection)}</CardTitle>
                {currentSection.description && (
                  <p className="text-sm text-gray-500">
                    {translateSectionDescription(currentPart.id, currentSection)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {currentSection.fields.map((field) =>
                  renderField(field, currentPart.id, currentSection.id)
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!canGoPrev}
            >
              {t('previous')}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || readOnly}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveProgress')
                )}
              </Button>
              {canGoNext ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                >
                  {t('next')}
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={readOnly}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                >
                  {t('completeForm')}
                </Button>
              )}
            </div>
          </div>

          {/* Autosave status */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-3">
            {autosaveStatus === 'saving' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t('saving')}</span>
              </>
            )}
            {autosaveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600">{t('saved')}</span>
              </>
            )}
            {autosaveStatus === 'idle' && lastSaved && (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>{t('lastSaved', { time: lastSaved.toLocaleTimeString() })}</span>
              </>
            )}
          </div>
        </main>
      </div>

      {/* AI Assistant Chat Widget */}
      {!readOnly && (
        <ChatWidget
          formContext={aiFormContext}
        />
      )}
    </div>
  );
}
