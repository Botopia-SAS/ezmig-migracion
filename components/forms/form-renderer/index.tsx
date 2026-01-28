'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { FieldText } from './field-text';
import { FieldTextarea } from './field-textarea';
import { FieldDate } from './field-date';
import { FieldSelect } from './field-select';
import { FieldRadio } from './field-radio';
import { FieldCheckbox } from './field-checkbox';

// Types
export interface FormSchema {
  formCode: string;
  parts: FormPart[];
  validationRules?: ValidationRule[];
}

export interface FormPart {
  id: string;
  title: string;
  sections: FormSection[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
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
  conditionalDisplay?: {
    field: string;
    value: string | boolean;
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
  caseFormId: number;
  onAutosave: (fieldPath: string, value: string | null) => Promise<void>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  readOnly?: boolean;
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

export function FormRenderer({
  formSchema,
  initialData,
  caseFormId,
  onAutosave,
  onSave,
  readOnly = false,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentPart = formSchema.parts[currentPartIndex];
  const currentSection = currentPart?.sections[currentSectionIndex];

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

  // Calculate progress
  const calculateProgress = useCallback(() => {
    let totalRequired = 0;
    let filledRequired = 0;

    for (const part of formSchema.parts) {
      for (const section of part.sections) {
        for (const field of section.fields) {
          if (field.required) {
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

  // Render a single field
  const renderField = (field: FormField, partId: string, sectionId: string) => {
    const fieldPath = `${partId}.${sectionId}.${field.id}`;
    const value = getNestedValue(formData, fieldPath);
    const error = errors[fieldPath];

    const commonProps = {
      field,
      value: value as string | undefined,
      onChange: (v: string) => handleFieldChange(fieldPath, v),
      error,
      disabled: readOnly,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'ssn':
      case 'alien_number':
      case 'number':
        return <FieldText key={field.id} {...commonProps} type={field.type} />;
      case 'textarea':
        return <FieldTextarea key={field.id} {...commonProps} />;
      case 'date':
        return <FieldDate key={field.id} {...commonProps} />;
      case 'select':
        return <FieldSelect key={field.id} {...commonProps} />;
      case 'radio':
        return <FieldRadio key={field.id} {...commonProps} />;
      case 'checkbox':
        return (
          <FieldCheckbox
            key={field.id}
            {...commonProps}
            checked={value as boolean}
            onCheckedChange={(v) => handleFieldChange(fieldPath, v)}
          />
        );
      default:
        return <FieldText key={field.id} {...commonProps} />;
    }
  };

  const progress = calculateProgress();

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar Navigation */}
      <aside className="col-span-12 lg:col-span-3">
        <Card className="sticky top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Progress
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progress} className="h-2" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <nav className="space-y-1">
              {formSchema.parts.map((part, partIdx) => (
                <div key={part.id}>
                  <button
                    onClick={() => {
                      setCurrentPartIndex(partIdx);
                      setCurrentSectionIndex(0);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                      partIdx === currentPartIndex
                        ? 'bg-violet-100 text-violet-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {part.title}
                  </button>
                  {partIdx === currentPartIndex && (
                    <div className="ml-3 mt-1 space-y-1">
                      {part.sections.map((section, sectionIdx) => (
                        <button
                          key={section.id}
                          onClick={() => setCurrentSectionIndex(sectionIdx)}
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors',
                            sectionIdx === currentSectionIndex
                              ? 'bg-violet-50 text-violet-600 font-medium'
                              : 'text-gray-500 hover:bg-gray-50'
                          )}
                        >
                          {section.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main Form Content */}
      <main className="col-span-12 lg:col-span-9">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {autosaveStatus === 'saving' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {autosaveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {autosaveStatus === 'idle' && lastSaved && (
              <>
                <Clock className="h-4 w-4" />
                <span>Last saved {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Current Section */}
        {currentSection && (
          <Card>
            <CardHeader>
              <div className="text-sm text-violet-600 font-medium">
                {currentPart.title}
              </div>
              <CardTitle>{currentSection.title}</CardTitle>
              {currentSection.description && (
                <p className="text-sm text-gray-500">
                  {currentSection.description}
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
            Previous
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
                  Saving...
                </>
              ) : (
                'Save Progress'
              )}
            </Button>
            {canGoNext ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={readOnly}
                className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
              >
                Complete Form
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
