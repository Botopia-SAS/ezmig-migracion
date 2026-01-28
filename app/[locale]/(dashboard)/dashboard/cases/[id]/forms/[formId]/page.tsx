'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormRenderer, type FormSchema } from '@/components/forms/form-renderer';

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
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="col-span-9">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function FormFillingPage({
  params,
}: {
  params: Promise<{ id: string; formId: string }>;
}) {
  const { id: caseId, formId } = use(params);
  const t = useTranslations('dashboard.forms');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: caseForm,
    error,
    isLoading,
    mutate,
  } = useSWR<CaseFormData>(`/api/case-forms/${formId}`, fetcher);

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
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/cases/${caseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToCase')}
          </Link>
        </Button>
        <LoadingSkeleton />
      </section>
    );
  }

  if (error || !caseForm) {
    return (
      <section className="flex-1">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/cases/${caseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToCase')}
          </Link>
        </Button>
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
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/cases/${caseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToCase')}
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <FileText className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              {caseForm.formType.name}
            </h1>
            <p className="text-sm text-gray-500">
              {caseForm.case.caseNumber} • {caseForm.formType.code}
            </p>
          </div>
        </div>

        {isSubmitted && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('formSubmittedReadOnly')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Form Renderer */}
      {formSchema ? (
        <FormRenderer
          formSchema={formSchema}
          initialData={caseForm.formData || {}}
          caseFormId={caseForm.id}
          onAutosave={handleAutosave}
          onSave={handleSave}
          readOnly={isSubmitted}
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
