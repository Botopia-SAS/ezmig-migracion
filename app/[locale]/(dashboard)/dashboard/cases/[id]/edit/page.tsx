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

interface CaseData {
  id: number;
  caseNumber: string;
  caseType: string;
  status: string;
  priority: string;
  filingDeadline: string | null;
  uscisReceiptNumber: string | null;
  internalNotes: string | null;
  assignedTo: {
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
  'family_based',
  'employment',
  'asylum',
  'naturalization',
  'adjustment',
  'removal_defense',
  'visa',
  'other',
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
    <div className="space-y-6 max-w-2xl">
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caseType, setCaseType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');

  const {
    data: caseData,
    error,
    isLoading,
  } = useSWR<CaseData>(`/api/cases/${id}`, fetcher);

  const { data: teamData } = useSWR<{ teamMembers: TeamMember[] }>(
    '/api/team',
    fetcher
  );

  useEffect(() => {
    if (caseData) {
      setCaseType(caseData.caseType);
      setStatus(caseData.status);
      setPriority(caseData.priority);
      setAssignedTo(caseData.assignedTo?.id?.toString() || '');
    }
  }, [caseData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      caseType,
      status,
      priority,
      filingDeadline: (formData.get('filingDeadline') as string) || null,
      uscisReceiptNumber:
        (formData.get('uscisReceiptNumber') as string) || null,
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
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
      <section className="flex-1 p-4 lg:p-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/cases/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
          {t('editCase')}
        </h1>
        <FormSkeleton />
      </section>
    );
  }

  if (error || !caseData) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Button variant="ghost" asChild className="mb-4">
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
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
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

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Case Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.caseInfo')}</CardTitle>
            <CardDescription>Update case information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseType">{t('form.caseType')} *</Label>
                <Select value={caseType} onValueChange={setCaseType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('table.status')} *</Label>
                <Select value={status} onValueChange={setStatus} required>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">{t('form.priority')}</Label>
                <Select value={priority} onValueChange={setPriority}>
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
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.assignedToPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filingDeadline">
                  {t('form.filingDeadline')}
                </Label>
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
                  placeholder="e.g., NBC-123456789"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
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

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
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
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/cases/${id}`}>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
