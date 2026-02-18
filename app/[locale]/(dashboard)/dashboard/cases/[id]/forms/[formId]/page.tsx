'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ArrowLeft, AlertCircle, Download, RefreshCw, Loader2, FileText, CheckCircle2, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

export default function FormFillingPage({
  params,
}: {
  params: Promise<{ id: string; formId: string }>;
}) {
  const { id: caseId, formId } = use(params);
  const t = useTranslations('dashboard.forms');
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setActions } = useHeaderActions();
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: caseForm,
    error,
    isLoading,
    mutate,
  } = useSWR<CaseFormData>(`/api/case-forms/${formId}`, fetcher, {
    onSuccess: (data) => {
      // Set initial progress from server data
      if (data?.progressPercentage !== undefined) {
        setProgress(data.progressPercentage);
      }
    }
  });

  // Inject header actions (back button, form name, progress)
  useEffect(() => {
    if (caseForm) {
      setActions(
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/cases/${caseId}`}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('backToCase')}</span>
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
  }, [caseForm, progress, setActions, caseId, t]);

  // Mark form as completed
  const handleMarkAsCompleted = useCallback(async () => {
    try {
      const response = await fetch(`/api/case-forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        await mutate();
        toast.success(t('toast.formCompleted') || 'Form marked as completed!');
      }
    } catch (error) {
      console.error('Failed to mark as completed:', error);
    }
  }, [formId, mutate, t]);

  // Handle progress change from FormRenderer
  const handleProgressChange = useCallback((p: number) => {
    setProgress(p);

    // Debounce persisting progress to DB (2s)
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      fetch(`/api/case-forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercentage: p }),
      }).catch(() => {});
    }, 2000);

    // Auto-complete the form when 100% progress is reached
    if (p >= 100 && caseForm?.status === 'in_progress') {
      handleMarkAsCompleted();
    }
  }, [caseForm?.status, handleMarkAsCompleted, formId]);

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
  const isCompleted = caseForm.status === 'completed' || isSubmitted;

  return (
    <section className="flex-1">
      {/* Always show PDF section */}
      <PdfSection caseFormId={caseForm.id} formCode={caseForm.formType.code} progress={progress} />

      {isSubmitted && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('formSubmittedReadOnly')}
          </AlertDescription>
        </Alert>
      )}

      {/* Mark as Complete Button */}
      {caseForm.status === 'in_progress' && progress >= 75 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">
              Form is {progress}% complete
            </span>
            <span className="text-green-600">
              Ready to mark as completed and generate PDF
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsCompleted}
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            <Check className="h-4 w-4 mr-1" />
            Mark as Complete
          </Button>
        </div>
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
          formContext={caseForm.formContext}
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

function PdfSection({ caseFormId, formCode, progress = 0 }: { caseFormId: number; formCode: string; progress?: number }) {
  const t = useTranslations('dashboard.forms');
  const [generating, setGenerating] = useState(false);

  const { data: pdfInfo, mutate } = useSWR<{
    hasPdf: boolean;
    latestVersion: {
      id: number;
      fileUrl: string;
      version: number;
      generatedAt: string;
    } | null;
  }>(`/api/case-forms/${caseFormId}/pdf`, fetcher);

  const handleDownload = () => {
    if (pdfInfo?.latestVersion?.fileUrl) {
      // Handle both Cloudinary URLs and local URLs
      const url = pdfInfo.latestVersion.fileUrl.startsWith('http')
        ? pdfInfo.latestVersion.fileUrl
        : `${window.location.origin}${pdfInfo.latestVersion.fileUrl}`;
      window.open(url, '_blank');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/case-forms/${caseFormId}/pdf`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate');
      const result = await res.json();
      mutate();
      toast.success(t('pdf.generated') || 'PDF Generated Successfully!');
      // Handle both Cloudinary URLs and local URLs
      const url = result.fileUrl.startsWith('http')
        ? result.fileUrl
        : `${window.location.origin}${result.fileUrl}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t('pdf.error') || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-violet-600" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-violet-900">
                {formCode} PDF Document
              </span>
              {progress > 0 && (
                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                  {progress}% completed
                </span>
              )}
            </div>
            {pdfInfo?.latestVersion && (
              <span className="text-xs text-violet-600">
                Last generated: v{pdfInfo.latestVersion.version} on{' '}
                {new Date(pdfInfo.latestVersion.generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pdfInfo?.hasPdf && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-100"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {pdfInfo?.hasPdf ? 'Regenerate PDF' : 'Generate PDF'}
          </Button>
        </div>
      </div>
      {progress < 100 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-700">
            ℹ️ The PDF will include only the fields you've completed so far. Fill more fields to generate a more complete document.
          </p>
        </div>
      )}
    </div>
  );
}
