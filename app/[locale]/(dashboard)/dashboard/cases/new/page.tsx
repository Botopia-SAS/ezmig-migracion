'use client';

import { useState, useEffect } from 'react';
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

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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

export default function NewCasePage() {
  const t = useTranslations('dashboard.cases');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [caseType, setCaseType] = useState<string>('');
  const [priority, setPriority] = useState<string>('normal');
  const [assignedTo, setAssignedTo] = useState<string>('');

  // Fetch clients
  const { data: clientsData } = useSWR<{ clients: Client[] }>(
    '/api/clients?limit=100',
    fetcher
  );

  // Fetch team members
  const { data: teamData } = useSWR<{ teamMembers: TeamMember[] }>(
    '/api/team',
    fetcher
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      clientId: parseInt(selectedClientId),
      caseType,
      priority,
      filingDeadline: formData.get('filingDeadline') as string || undefined,
      assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
      internalNotes: formData.get('internalNotes') as string || undefined,
    };

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create case');
      }

      const newCase = await response.json();
      toast.success(t('toast.created'));
      router.push(`/dashboard/cases/${newCase.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/cases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          {t('newCase')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.selectClient')}</CardTitle>
            <CardDescription>Select the client for this case</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="clientId">{t('form.selectClient')} *</Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectClientPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {clientsData?.clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.firstName} {client.lastName} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clientsData?.clients?.length && (
                <p className="text-sm text-gray-500">
                  No clients found.{' '}
                  <Link href="/dashboard/clients/new" className="text-violet-600 hover:underline">
                    Create a client first
                  </Link>
                </p>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseType">{t('form.caseType')} *</Label>
                <Select
                  value={caseType}
                  onValueChange={setCaseType}
                  required
                >
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
                <Label htmlFor="priority">{t('form.priority')}</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                >
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filingDeadline">{t('form.filingDeadline')}</Label>
                <Input
                  id="filingDeadline"
                  name="filingDeadline"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">{t('form.assignedTo')}</Label>
                <Select
                  value={assignedTo}
                  onValueChange={setAssignedTo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.assignedToPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {teamData?.teamMembers?.map((member) => (
                      <SelectItem key={member.userId} value={member.userId.toString()}>
                        {member.user.name || member.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={t('form.notesPlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isSubmitting || !selectedClientId || !caseType}
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/cases">{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
