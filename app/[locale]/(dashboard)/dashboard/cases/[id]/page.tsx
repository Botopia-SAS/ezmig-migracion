'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Calendar,
  FileText,
  Plus,
  Briefcase,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FormType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface CaseForm {
  id: number;
  formTypeId: number;
  status: string;
  progressPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
  formType: FormType;
}

interface Evidence {
  id: number;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  fileUrl: string;
  category: string | null;
  subcategory: string | null;
  documentDate: string | null;
  validationStatus: string;
  validationNotes: string | null;
  uploadedAt: string;
  uploadedByUser: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface CaseDetails {
  id: number;
  caseNumber: string;
  caseType: string;
  status: string;
  priority: string;
  filingDeadline: string | null;
  uscisReceiptNumber: string | null;
  internalNotes: string | null;
  intakeDate: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  assignedUser: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  createdBy: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  forms: CaseForm[];
  evidences: Evidence[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-gray-400 mt-1 shrink-0" />}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

type EditableFieldProps = {
  label: string;
  icon?: React.ElementType;
  value: string | null;
  displayValue: React.ReactNode;
  type?: 'text' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  onSave: (newValue: string | null) => Promise<void>;
};

function EditableField({
  label,
  icon: Icon,
  value,
  displayValue,
  type = 'text',
  options = [],
  onSave,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Keep draft in sync when server data updates
  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft || null);
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-gray-400 mt-1 shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">{label}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-gray-900"
            onClick={() => setIsEditing((prev) => !prev)}
            aria-label={`Edit ${label}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        {isEditing ? (
          <div className="mt-2 space-y-2">
            {type === 'select' ? (
              <Select value={draft} onValueChange={setDraft}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === 'textarea' ? (
              <Textarea
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
              />
            ) : (
              <Input
                type={type === 'date' ? 'date' : 'text'}
                value={draft ?? ''}
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(value ?? '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium break-words">{displayValue || '-'}</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const colors: Record<string, string> = {
    intake: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || colors.intake}`}>
      {t(`statuses.${status}`)}
    </span>
  );
}

function PriorityBadge({ priority, t }: { priority: string; t: (key: string) => string }) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[priority] || colors.normal}`}>
      {t(`priorities.${priority}`)}
    </span>
  );
}

function FormStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    submitted: 'bg-violet-100 text-violet-700',
  };

  const labels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    submitted: 'Submitted',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.not_started}`}>
      {labels[status] || status}
    </span>
  );
}

function ValidationStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    valid: 'bg-green-100 text-green-700',
    invalid: 'bg-red-100 text-red-700',
    needs_review: 'bg-orange-100 text-orange-700',
  };

  const icons: Record<string, React.ReactNode> = {
    pending: <AlertCircle className="h-3 w-3" />,
    valid: <CheckCircle className="h-3 w-3" />,
    invalid: <XCircle className="h-3 w-3" />,
    needs_review: <Eye className="h-3 w-3" />,
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    valid: 'Valid',
    invalid: 'Invalid',
    needs_review: 'Needs Review',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.pending}`}>
      {icons[status]}
      {labels[status] || status}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.cases');
  const tForms = useTranslations('dashboard.forms');
  const tEvidences = useTranslations('dashboard.evidences');
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingForm, setIsAddingForm] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState<string>('');
  const [addFormDialogOpen, setAddFormDialogOpen] = useState(false);

  // Evidence state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [validationStatus, setValidationStatus] = useState<string>('');
  const [validationNotes, setValidationNotes] = useState<string>('');

  // USCIS status state
  const [isCheckingUSCIS, setIsCheckingUSCIS] = useState(false);

  const {
    data: caseData,
    error,
    isLoading,
    mutate: mutateCaseData,
  } = useSWR<CaseDetails>(`/api/cases/${id}?details=true`, fetcher);

  const updateCaseField = async (payload: Partial<CaseDetails>) => {
    const response = await fetch(`/api/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update case');
    }

    await mutateCaseData();
    toast.success('Case updated');
  };

  // Fetch available form types
  const { data: formTypesData } = useSWR<{ formTypes: FormType[] }>('/api/form-types', fetcher);

  // Fetch USCIS status
  const {
    data: uscisStatusData,
    mutate: mutateUSCISStatus,
  } = useSWR(
    caseData?.uscisReceiptNumber ? `/api/uscis/check-status?caseId=${id}` : null,
    fetcher
  );

  const handleCheckUSCISStatus = async () => {
    if (!caseData?.uscisReceiptNumber) {
      toast.error('No USCIS receipt number associated with this case');
      return;
    }
    setIsCheckingUSCIS(true);
    try {
      const response = await fetch('/api/uscis/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: parseInt(id) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check USCIS status');
      }

      toast.success('USCIS status updated');
      mutateUSCISStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check USCIS status');
    } finally {
      setIsCheckingUSCIS(false);
    }
  };

  // Get form types that haven't been added yet
  const availableFormTypes = formTypesData?.formTypes?.filter(
    (ft) => !caseData?.forms?.some((f) => f.formTypeId === ft.id)
  ) || [];

  const handleAddForm = async () => {
    if (!selectedFormType) return;
    setIsAddingForm(true);
    try {
      const response = await fetch(`/api/case-forms?caseId=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formTypeId: parseInt(selectedFormType) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add form');
      }

      toast.success(tForms('toast.added'));
      setAddFormDialogOpen(false);
      setSelectedFormType('');
      mutateCaseData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tForms('toast.error'));
    } finally {
      setIsAddingForm(false);
    }
  };

  const handleDeleteForm = async (formId: number) => {
    try {
      const response = await fetch(`/api/case-forms/${formId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove form');
      }

      toast.success(tForms('toast.removed'));
      mutateCaseData();
    } catch (error) {
      toast.error(tForms('toast.error'));
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete case');
      }

      toast.success(t('toast.deleted'));
      router.push('/dashboard/cases');
    } catch (error) {
      toast.error(t('toast.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Evidence handlers
  const handleValidateEvidence = async () => {
    if (!selectedEvidence || !validationStatus) return;
    try {
      const response = await fetch(`/api/evidences/${selectedEvidence.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: validationStatus, notes: validationNotes }),
      });

      if (!response.ok) throw new Error('Failed to validate evidence');

      toast.success(tEvidences('toast.validated'));
      setValidateDialogOpen(false);
      setSelectedEvidence(null);
      setValidationStatus('');
      setValidationNotes('');
      mutateCaseData();
    } catch (error) {
      toast.error(tEvidences('toast.error'));
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    try {
      const response = await fetch(`/api/evidences/${evidenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete evidence');

      toast.success(tEvidences('toast.deleted'));
      mutateCaseData();
    } catch (error) {
      toast.error(tEvidences('toast.error'));
    }
  };

  const openValidateDialog = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setValidationStatus(evidence.validationStatus);
    setValidationNotes(evidence.validationNotes || '');
    setValidateDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <Button variant="ghost" asChild className="mb-4 text-gray-900">
          <Link href="/dashboard/cases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <DetailSkeleton />
      </section>
    );
  }

  if (error || !caseData) {
    return (
      <section className="flex-1">
        <Button variant="ghost" asChild className="mb-4 text-gray-900">
          <Link href="/dashboard/cases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-red-500">Case not found</p>
        </div>
      </section>
    );
  }

  const caseTypeOptions = [
    { value: 'family_based', label: t('types.family_based') },
    { value: 'employment', label: t('types.employment') },
    { value: 'asylum', label: t('types.asylum') },
    { value: 'naturalization', label: t('types.naturalization') },
    { value: 'adjustment', label: t('types.adjustment') },
    { value: 'removal_defense', label: t('types.removal_defense') },
    { value: 'visa', label: t('types.visa') },
    { value: 'other', label: t('types.other') },
  ];

  const filingDeadlineValue = caseData.filingDeadline
    ? new Date(caseData.filingDeadline).toISOString().split('T')[0]
    : '';

  return (
    <section className="flex-1">
      <Button variant="ghost" asChild className="mb-4 text-gray-900">
        <Link href="/dashboard/cases">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{caseData.caseNumber}</h1>
            <StatusBadge status={caseData.status} t={t} />
            <PriorityBadge priority={caseData.priority} t={t} />
          </div>
          <p className="text-gray-500">
            {t(`types.${caseData.caseType}`)} •{' '}
            {caseData.client
              ? `${caseData.client.firstName} ${caseData.client.lastName}`
              : 'No client'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/cases/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions.delete')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('deleteConfirm.title')}</DialogTitle>
                <DialogDescription>
                  {t('deleteConfirm.description')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('deleteConfirm.cancel')}</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : t('deleteConfirm.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('detail.overview')}</TabsTrigger>
          <TabsTrigger value="forms">{t('detail.forms')}</TabsTrigger>
          <TabsTrigger value="evidences">{t('detail.evidences')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('detail.timeline')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('detail.caseInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditableField
                      icon={Briefcase}
                      label={t('form.caseType')}
                      value={caseData.caseType}
                      displayValue={t(`types.${caseData.caseType}`)}
                      type="select"
                      options={caseTypeOptions}
                      onSave={(newValue) => updateCaseField({ caseType: newValue || undefined })}
                    />
                    <EditableField
                      icon={Calendar}
                      label={t('form.filingDeadline')}
                      value={filingDeadlineValue}
                      displayValue={
                        caseData.filingDeadline ? (
                          <span className="flex items-center gap-1">
                            {formatDate(caseData.filingDeadline)}
                            {new Date(caseData.filingDeadline) < new Date() && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </span>
                        ) : (
                          '-'
                        )
                      }
                      type="date"
                      onSave={(newValue) => updateCaseField({ filingDeadline: newValue || null })}
                    />
                    <EditableField
                      icon={FileText}
                      label={t('form.uscisReceiptNumber')}
                      value={caseData.uscisReceiptNumber || ''}
                      displayValue={caseData.uscisReceiptNumber || '-'}
                      onSave={(newValue) => updateCaseField({ uscisReceiptNumber: newValue || null })}
                    />
                    <InfoItem
                      icon={Clock}
                      label="Intake Date"
                      value={formatDate(caseData.intakeDate)}
                    />
                    <InfoItem
                      icon={User}
                      label={t('form.assignedTo')}
                      value={
                        caseData.assignedUser
                          ? caseData.assignedUser.name || caseData.assignedUser.email
                          : '-'
                      }
                    />
                    <InfoItem
                      icon={User}
                      label="Created By"
                      value={
                        caseData.createdBy
                          ? caseData.createdBy.name || caseData.createdBy.email
                          : '-'
                      }
                    />
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <EditableField
                      label={t('form.internalNotes')}
                      value={caseData.internalNotes || ''}
                      displayValue={caseData.internalNotes ? (
                        <span className="whitespace-pre-wrap text-sm">{caseData.internalNotes}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                      type="textarea"
                      onSave={(newValue) => updateCaseField({ internalNotes: newValue || null })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* USCIS Case Status Tracker */}
              {caseData.uscisReceiptNumber && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-violet-600" />
                        USCIS Case Status
                      </CardTitle>
                      <CardDescription>
                        Track your case status with USCIS
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckUSCISStatus}
                      disabled={isCheckingUSCIS}
                    >
                      {isCheckingUSCIS ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Check Status
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">Receipt Number</p>
                          <p className="font-mono font-medium text-lg">
                            {caseData.uscisReceiptNumber}
                          </p>
                        </div>
                      </div>

                      {uscisStatusData?.data && uscisStatusData.data.length > 0 ? (
                        <div className="space-y-3">
                          {uscisStatusData.data.map((status: {
                            id: number;
                            currentStatus: string;
                            statusDescription: string;
                            lastCheckedAt: string;
                          }) => (
                            <div
                              key={status.id}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  status.currentStatus === 'Case Was Approved' || status.currentStatus === 'CASE_APPROVED'
                                    ? 'bg-green-100 text-green-800'
                                    : status.currentStatus === 'Case Was Denied' || status.currentStatus === 'CASE_DENIED'
                                    ? 'bg-red-100 text-red-800'
                                    : status.currentStatus === 'PENDING_API_SETUP'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {status.currentStatus}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Last checked: {status.lastCheckedAt ? new Date(status.lastCheckedAt).toLocaleString() : 'Never'}
                                </span>
                              </div>
                              {status.statusDescription && (
                                <p className="text-sm text-gray-600">
                                  {status.statusDescription}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No status checks yet</p>
                          <p className="text-sm">Click &quot;Check Status&quot; to query USCIS</p>
                        </div>
                      )}

                      {!uscisStatusData?.apiConfigured && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            USCIS API not configured. Contact administrator.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Client Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('detail.clientInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseData.client ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">
                          {caseData.client.firstName} {caseData.client.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {caseData.client.email}
                        </p>
                        {caseData.client.phone && (
                          <p className="text-sm text-gray-500">
                            {caseData.client.phone}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/clients/${caseData.client.id}`}>
                          View Client Profile
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No client assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Forms</span>
                      <span className="font-medium">
                        {caseData.forms?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Evidence Files</span>
                      <span className="font-medium">
                        {caseData.evidences?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('detail.forms')}</CardTitle>
                <CardDescription>Forms associated with this case</CardDescription>
              </div>
              <Dialog open={addFormDialogOpen} onOpenChange={setAddFormDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={availableFormTypes.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    {tForms('addForm')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{tForms('selectForm')}</DialogTitle>
                    <DialogDescription>
                      {tForms('selectFormPlaceholder')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                      <SelectTrigger>
                        <SelectValue placeholder={tForms('selectFormPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormTypes.map((formType) => (
                          <SelectItem key={formType.id} value={formType.id.toString()}>
                            {formType.code} - {formType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{tForms('deleteConfirm.cancel')}</Button>
                    </DialogClose>
                    <Button
                      onClick={handleAddForm}
                      disabled={!selectedFormType || isAddingForm}
                      className="bg-gradient-to-r from-violet-500 to-indigo-500"
                    >
                      {isAddingForm ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        tForms('addForm')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {caseData.forms?.length ? (
                <div className="space-y-4">
                  {caseData.forms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-violet-200 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{form.formType?.code || `Form #${form.formTypeId}`}</p>
                          <FormStatusBadge status={form.status} />
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {form.formType?.name || 'Unknown Form'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={form.progressPercentage} className="h-2 w-32" />
                          <span className="text-xs text-gray-500">{form.progressPercentage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/cases/${id}/forms/${form.id}`}>
                            {form.status === 'not_started' ? tForms('actions.fill') :
                             form.status === 'submitted' ? tForms('actions.view') :
                             tForms('actions.continue')}
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                        {form.status !== 'submitted' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{tForms('deleteConfirm.title')}</DialogTitle>
                                <DialogDescription>
                                  {tForms('deleteConfirm.description')}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">{tForms('deleteConfirm.cancel')}</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteForm(form.id)}
                                >
                                  {tForms('deleteConfirm.confirm')}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('detail.noForms')}</p>
                  <p className="text-sm text-gray-400">
                    {t('detail.noFormsDescription')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidences" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{tEvidences('title')}</CardTitle>
                <CardDescription>{tEvidences('subtitle')}</CardDescription>
              </div>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    {tEvidences('upload')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{tEvidences('uploadDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {tEvidences('uploadDialog.allowedTypes')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-violet-300 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{tEvidences('uploadDialog.dragDrop')}</p>
                      <p className="text-xs text-gray-400 mt-1">{tEvidences('uploadDialog.maxSize')}</p>
                    </div>
                    <div>
                      <Label htmlFor="category">{tEvidences('category')}</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={tEvidences('uploadDialog.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="identity">{tEvidences('categories.identity')}</SelectItem>
                          <SelectItem value="financial">{tEvidences('categories.financial')}</SelectItem>
                          <SelectItem value="relationship">{tEvidences('categories.relationship')}</SelectItem>
                          <SelectItem value="employment">{tEvidences('categories.employment')}</SelectItem>
                          <SelectItem value="education">{tEvidences('categories.education')}</SelectItem>
                          <SelectItem value="medical">{tEvidences('categories.medical')}</SelectItem>
                          <SelectItem value="immigration">{tEvidences('categories.immigration')}</SelectItem>
                          <SelectItem value="other">{tEvidences('categories.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{tEvidences('uploadDialog.cancel')}</Button>
                    </DialogClose>
                    <Button disabled={isUploading} className="bg-gradient-to-r from-violet-500 to-indigo-500">
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tEvidences('uploadDialog.uploading')}
                        </>
                      ) : (
                        tEvidences('uploadDialog.confirm')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {caseData.evidences?.length ? (
                <div className="space-y-3">
                  {caseData.evidences.map((evidence) => (
                    <div
                      key={evidence.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-violet-200 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{evidence.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{evidence.category ? tEvidences(`categories.${evidence.category}`) : tEvidences('categories.other')}</span>
                            {evidence.fileSize && (
                              <>
                                <span>•</span>
                                <span>{(evidence.fileSize / 1024).toFixed(1)} KB</span>
                              </>
                            )}
                            {evidence.uploadedAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(evidence.uploadedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <ValidationStatusBadge status={evidence.validationStatus} />
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(evidence.fileUrl, '_blank')}
                            title={tEvidences('actions.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openValidateDialog(evidence)}
                            title={tEvidences('actions.validate')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={tEvidences('actions.delete')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{tEvidences('deleteConfirm.title')}</DialogTitle>
                                <DialogDescription>
                                  {tEvidences('deleteConfirm.description')}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">{tEvidences('deleteConfirm.cancel')}</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteEvidence(evidence.id)}
                                >
                                  {tEvidences('deleteConfirm.confirm')}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">{tEvidences('noEvidences')}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {tEvidences('noEvidencesDescription')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Dialog */}
          <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tEvidences('validateDialog.title')}</DialogTitle>
                <DialogDescription>
                  {selectedEvidence?.fileName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>{tEvidences('validateDialog.status')}</Label>
                  <Select value={validationStatus} onValueChange={setValidationStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">{tEvidences('actions.markValid')}</SelectItem>
                      <SelectItem value="invalid">{tEvidences('actions.markInvalid')}</SelectItem>
                      <SelectItem value="needs_review">{tEvidences('actions.needsReview')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">{tEvidences('validateDialog.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    placeholder={tEvidences('validateDialog.notesPlaceholder')}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{tEvidences('validateDialog.cancel')}</Button>
                </DialogClose>
                <Button
                  onClick={handleValidateEvidence}
                  disabled={!validationStatus}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500"
                >
                  {tEvidences('validateDialog.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.timeline')}</CardTitle>
              <CardDescription>Activity history for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Timeline coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
