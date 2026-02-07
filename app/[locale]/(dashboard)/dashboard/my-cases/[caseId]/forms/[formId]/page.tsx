'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormRenderer, type FormSchema } from '@/components/forms/form-renderer';
import { useHeaderActions } from '@/components/dashboard/header-actions-context';

interface CaseFormData {
  id: number;
  caseId: number;
  formTypeId: number;
  status: string;
  progressPercentage: number;
  formData: Record<string, unknown>;
  formType: {
    id: number;
    code: string;
    name: string;
    formSchema: FormSchema;
  };
  case: {
    id: number;
    caseNumber: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Skeleton className="h-80 w-full" />
        </div>
        <div className="col-span-9">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ClientFormPage({
  params,
}: {
  params: Promise<{ caseId: string; formId: string }>;
}) {
  const { caseId, formId } = use(params);
  const t = useTranslations('dashboard.forms');
  const tMyCases = useTranslations('dashboard.myCases');
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setActions } = useHeaderActions();

  const {
    data: caseForm,
    error,
    isLoading,
    mutate,
  } = useSWR<CaseFormData>(`/api/case-forms/${formId}`, fetcher);

  // Inject header actions (back button, form name, progress)
  useEffect(() => {
    if (caseForm) {
      setActions(
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/my-cases"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{tMyCases('title')}</span>
          </Link>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{caseForm.formType.name}</span>
            <span className="text-xs text-gray-400">{caseForm.formType.code}</span>
          </div>
          <div className="h-5 w-px bg-gray-300" />
          <span className="text-lg font-bold text-violet-600">{progress}%</span>
        </div>
      );
    }
    return () => setActions(null);
  }, [caseForm, progress, setActions, tMyCases]);

  // Handle progress change from FormRenderer
  const handleProgressChange = useCallback((p: number) => {
    setProgress(p);
  }, []);

  // Handle autosave
  const handleAutosave = async (fieldPath: string, value: string | null) => {
    try {
      const response = await fetch(`/api/case-forms/${formId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldPath, fieldValue: value }),
      });

      if (!response.ok) {
        throw new Error('Autosave failed');
      }
    } catch (error) {
      console.error('Autosave error:', error);
    }
  };

  // Handle save progress
  const handleSave = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/case-forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      await mutate();
      toast.success(t('toast.saved'));
    } catch (error) {
      toast.error(t('toast.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <LoadingSkeleton />
      </section>
    );
  }

  if (error || !caseForm) {
    return (
      <section className="flex-1">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('formNotFound')}</AlertDescription>
        </Alert>
      </section>
    );
  }

  const formSchema = caseForm.formType.formSchema;
  const isSubmitted = caseForm.status === 'submitted';

  return (
    <section className="flex-1">
      {isSubmitted && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t('formSubmittedReadOnly')}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Renderer */}
      {formSchema ? (
        <FormRenderer
          formSchema={formSchema}
          initialData={caseForm.formData || {}}
          caseId={caseForm.caseId}
          caseFormId={caseForm.id}
          onAutosave={handleAutosave}
          onSave={handleSave}
          readOnly={isSubmitted}
          onProgressChange={handleProgressChange}
        />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('invalidFormSchema')}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
