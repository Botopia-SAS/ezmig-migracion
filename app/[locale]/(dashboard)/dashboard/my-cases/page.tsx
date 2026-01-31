'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  FileText,
  AlertCircle,
  FolderOpen,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface FormData {
  id: number;
  status: string;
  progress: number;
  formType: {
    id: number;
    name: string;
    formNumber: string;
    description: string;
  };
}

interface CaseData {
  id: number;
  caseNumber: string;
  caseType: string;
  status: string;
  priority: string;
  filingDeadline: string | null;
  createdAt: string;
  forms: FormData[];
  assignedUser: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface MyCasesResponse {
  cases: CaseData[];
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function MyCasesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-violet-100 p-4 mb-4">
        <FolderOpen className="h-8 w-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {t('noCases')}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {t('noCasesDescription')}
      </p>
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
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.intake}`}>
      {t(`statuses.${status}`)}
    </span>
  );
}

function FormStatusIcon({ status }: { status: string }) {
  if (status === 'completed' || status === 'submitted') {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  if (status === 'in_progress') {
    return <Clock className="h-5 w-5 text-blue-500" />;
  }
  return <FileText className="h-5 w-5 text-gray-400" />;
}

function CaseCard({ caseData, t }: { caseData: CaseData; t: (key: string) => string }) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const pendingForms = caseData.forms.filter(
    (f) => f.status !== 'completed' && f.status !== 'submitted'
  );
  const completedForms = caseData.forms.filter(
    (f) => f.status === 'completed' || f.status === 'submitted'
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-violet-500" />
              {caseData.caseNumber}
            </CardTitle>
            <CardDescription className="mt-1">
              {t(`types.${caseData.caseType}`)}
            </CardDescription>
          </div>
          <StatusBadge status={caseData.status} t={t} />
        </div>
        {caseData.filingDeadline && (
          <p className="text-sm text-orange-600 flex items-center gap-1 mt-2">
            <Clock className="h-4 w-4" />
            {t('deadline')}: {formatDate(caseData.filingDeadline)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {caseData.forms.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {t('noForms')}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>{t('forms')}</span>
              <span>
                {completedForms.length} / {caseData.forms.length} {t('completed')}
              </span>
            </div>
            {caseData.forms.map((form) => (
              <Link
                key={form.id}
                href={`/dashboard/my-cases/${caseData.id}/forms/${form.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-violet-300 hover:bg-violet-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <FormStatusIcon status={form.status} />
                    <div>
                      <p className="font-medium text-sm">
                        {form.formType.formNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {form.formType.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <Progress value={form.progress || 0} className="h-2" />
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {form.progress || 0}%
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyCasesPage() {
  const t = useTranslations('dashboard.myCases');

  const { data, error, isLoading } = useSWR<MyCasesResponse>(
    '/api/portal/my-cases',
    fetcher
  );

  return (
    <section className="flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-violet-100 rounded-lg">
          <FolderOpen className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('subtitle')}
            {data?.client && (
              <span className="text-violet-600 ml-1">
                — {t('welcome')}, {data.client.firstName}!
              </span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <MyCasesSkeleton />
      ) : error || data?.error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-600">{t('error')}</p>
          </CardContent>
        </Card>
      ) : !data?.cases?.length ? (
        <Card>
          <CardContent>
            <EmptyState t={t} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.cases.map((caseData) => (
            <CaseCard key={caseData.id} caseData={caseData} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}
