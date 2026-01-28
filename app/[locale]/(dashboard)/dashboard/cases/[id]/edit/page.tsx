'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useHeaderActions } from '@/components/dashboard/header-actions-context';

interface CaseData {
  id: number;
  caseNumber: string;
  caseType: string;
  status: string;
  priority: string;
  filingDeadline: string | null;
  uscisReceiptNumber: string | null;
  internalNotes: string | null;
  assignedTo: number | null;
  assignedUser: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  client: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface TeamMember {
  id: number;
  userId: number;
  role: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CASE_TYPES = [
  { key: 'family_based', code: 'I-130' },
  { key: 'employment', code: 'I-140' },
  { key: 'asylum', code: 'I-589' },
  { key: 'naturalization', code: 'N-400' },
  { key: 'adjustment', code: 'I-485' },
  { key: 'removal_defense', code: 'EOIR-42' },
  { key: 'visa', code: 'I-129' },
  { key: 'other', code: null },
] as const;

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

const STATUSES = [
  'intake',
  'in_progress',
  'submitted',
  'approved',
  'denied',
  'closed',
] as const;

function FormSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.cases');
  const router = useRouter();
  const { setActions } = useHeaderActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caseType, setCaseType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');

  const {
    data: caseData,
    error,
    isLoading,
  } = useSWR<CaseData>(`/api/cases/${id}?details=true`, fetcher);

  const { data: teamData } = useSWR<{ teamMembers: TeamMember[] }>(
    '/api/team',
    fetcher
  );

  // Initialize form state when case data loads
  useEffect(() => {
    if (caseData) {
      setCaseType(caseData.caseType || '');
      setStatus(caseData.status || '');
      setPriority(caseData.priority || '');
      setAssignedTo(caseData.assignedTo?.toString() || '');
    }
  }, [caseData]);

  const isFormValid = (caseType || caseData?.caseType) && (status || caseData?.status);

  // Set header actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="bg-transparent border-gray-900 text-gray-900 hover:bg-gray-900/5"
          asChild
        >
          <Link href={`/dashboard/cases/${id}`}>{t('cancel')}</Link>
        </Button>
        <Button
          type="submit"
          form="edit-case-form"
          size="lg"
          disabled={isSubmitting || !isFormValid}
          className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            t('save')
          )}
        </Button>
      </div>
    );

    return () => setActions(null);
  }, [setActions, t, isSubmitting, isFormValid, id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const finalAssignedTo = assignedTo || caseData?.assignedTo?.toString() || '';
    const data = {
      caseType: caseType || caseData?.caseType,
      status: status || caseData?.status,
      priority: priority || caseData?.priority,
      filingDeadline: (formData.get('filingDeadline') as string) || null,
      uscisReceiptNumber:
        (formData.get('uscisReceiptNumber') as string) || null,
      assignedTo: finalAssignedTo && finalAssignedTo !== 'none' ? Number.parseInt(finalAssignedTo) : null,
      internalNotes: (formData.get('internalNotes') as string) || null,
    };

    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update case');
      }

      toast.success(t('toast.updated'));
      router.push(`/dashboard/cases/${id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 text-gray-900">
            <Link href={`/dashboard/cases/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Link>
          </Button>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('editCase')}
          </h1>
        </div>
        <FormSkeleton />
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

  return (
    <section className="flex-1">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 text-gray-900">
          <Link href={`/dashboard/cases/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {t('editCase')}
        </h1>
        <p className="text-sm text-gray-500">
          {caseData.caseNumber} •{' '}
          {caseData.client
            ? `${caseData.client.firstName} ${caseData.client.lastName}`
            : 'No client'}
        </p>
      </div>

      <form id="edit-case-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Case Status & Case Details - side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Case Status */}
          <Card>
            <CardHeader>
              <CardTitle>{t('table.status')}</CardTitle>
              <CardDescription>Update case status and priority</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('table.status')} *</Label>
                <Select value={status || caseData.status} onValueChange={setStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`statuses.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">{t('form.priority')}</Label>
                <Select value={priority || caseData.priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`priorities.${p}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">{t('form.assignedTo')}</Label>
                <Select
                  value={assignedTo || caseData.assignedTo?.toString() || 'none'}
                  onValueChange={(val) => setAssignedTo(val === 'none' ? '' : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.assignedToPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teamData?.teamMembers?.map((member) => (
                      <SelectItem
                        key={member.userId}
                        value={member.userId.toString()}
                      >
                        {member.user.name || member.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.caseInfo')}</CardTitle>
              <CardDescription>Basic information about the case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caseType">{t('form.caseType')} *</Label>
                <Select value={caseType || caseData.caseType} onValueChange={setCaseType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((type) => {
                      const typeName = t(`types.${type.key}`);
                      return (
                        <SelectItem key={type.key} value={type.key}>
                          {type.code ? `${typeName} (${type.code})` : typeName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filingDeadline">{t('form.filingDeadline')}</Label>
                <Input
                  id="filingDeadline"
                  name="filingDeadline"
                  type="date"
                  defaultValue={formatDateForInput(caseData.filingDeadline)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uscisReceiptNumber">
                  {t('form.uscisReceiptNumber')}
                </Label>
                <Input
                  id="uscisReceiptNumber"
                  name="uscisReceiptNumber"
                  defaultValue={caseData.uscisReceiptNumber || ''}
                  placeholder="EAC2390012345"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {t('form.uscisReceiptNumberHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes - full width */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.internalNotes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="internalNotes"
              name="internalNotes"
              rows={4}
              defaultValue={caseData.internalNotes || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={t('form.notesPlaceholder')}
            />
          </CardContent>
        </Card>
      </form>
    </section>
  );
}
