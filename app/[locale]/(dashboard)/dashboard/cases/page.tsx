'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface CaseData {
  id: number;
  caseNumber: string;
  caseType: string;
  status: string;
  priority: string;
  filingDeadline: string | null;
  createdAt: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  assignedTo: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface CasesResponse {
  cases: CaseData[];
  total: number;
  limit: number;
  offset: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CasesTableSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-violet-100 p-4 mb-4">
        <Briefcase className="h-8 w-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {t('noCases')}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('noCasesDescription')}
      </p>
      <Button asChild className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
        <Link href="/dashboard/cases/new">
          <Plus className="mr-2 h-4 w-4" />
          {t('addFirst')}
        </Link>
      </Button>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    intake: 'secondary',
    in_progress: 'default',
    submitted: 'outline',
    approved: 'default',
    denied: 'destructive',
    closed: 'secondary',
  };

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

function PriorityBadge({ priority, t }: { priority: string; t: (key: string) => string }) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || colors.normal}`}>
      {t(`priorities.${priority}`)}
    </span>
  );
}

export default function CasesPage() {
  const t = useTranslations('dashboard.cases');
  const [search, setSearch] = useState('');

  const { data, error, isLoading } = useSWR<CasesResponse>(
    `/api/cases?search=${encodeURIComponent(search)}`,
    fetcher
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <section className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
        >
          <Link href="/dashboard/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('newCase')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CasesTableSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertCircle className="mr-2 h-4 w-4" />
              Failed to load cases
            </div>
          ) : !data?.cases?.length ? (
            <EmptyState t={t} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.caseNumber')}</TableHead>
                    <TableHead>{t('table.client')}</TableHead>
                    <TableHead>{t('table.type')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.priority')}</TableHead>
                    <TableHead>{t('table.deadline')}</TableHead>
                    <TableHead>{t('table.assignedTo')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cases.map((caseData) => (
                    <TableRow key={caseData.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/cases/${caseData.id}`}
                          className="font-medium text-violet-600 hover:underline"
                        >
                          {caseData.caseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {caseData.client ? (
                          <Link
                            href={`/dashboard/clients/${caseData.client.id}`}
                            className="hover:underline"
                          >
                            {caseData.client.firstName} {caseData.client.lastName}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {t(`types.${caseData.caseType}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={caseData.status} t={t} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={caseData.priority} t={t} />
                      </TableCell>
                      <TableCell>
                        <span className={caseData.filingDeadline ? '' : 'text-gray-400'}>
                          {formatDate(caseData.filingDeadline)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {caseData.assignedTo ? (
                          <span className="text-sm">
                            {caseData.assignedTo.name || caseData.assignedTo.email}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cases/${caseData.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('actions.view')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cases/${caseData.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t('actions.edit')}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
