'use client';

import { use } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Copy,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Briefcase,
  Calendar,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface FormTypeInfo {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

interface ReferralLink {
  id: number;
  code: string;
  teamId: number;
  caseId: number | null;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number;
  currentUses: number;
  createdAt: string;
  url: string;
  formTypes: FormTypeInfo[];
  case: {
    id: number;
    caseNumber: string | null;
    caseType: string;
  } | null;
  createdByUser: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  usageCount: number;
}

interface UsageRecord {
  id: number;
  referralLinkId: number;
  userId: number | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    email: string;
  } | null;
}

interface ReferralDetailResponse {
  link: ReferralLink;
  usage: UsageRecord[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ link, t }: { link: ReferralLink; t: (key: string) => string }) {
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const isMaxReached = link.maxUses > 0 && link.currentUses >= link.maxUses;

  if (!link.isActive) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <XCircle className="h-3 w-3 mr-1" />
        {t('statuses.inactive')}
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-700">
        <Clock className="h-3 w-3 mr-1" />
        {t('statuses.expired')}
      </Badge>
    );
  }

  if (isMaxReached) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700">
        <AlertCircle className="h-3 w-3 mr-1" />
        {t('statuses.maxReached')}
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      {t('statuses.active')}
    </Badge>
  );
}

export default function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('dashboard.referrals');

  const { data, error, isLoading } = useSWR<ReferralDetailResponse>(
    `/api/referrals/${id}`,
    fetcher
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link.url);
      toast.success(t('toast.copied'));
    } catch {
      toast.error(t('toast.error'));
    }
  };

  const getActionLabel = (action: string) => {
    const actions: Record<string, string> = {
      visited: t('detail.usageActions.visited'),
      registered: t('detail.usageActions.registered'),
      form_started: t('detail.usageActions.form_started'),
      form_completed: t('detail.usageActions.form_completed'),
    };
    return actions[action] || action;
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'visited':
        return 'bg-blue-100 text-blue-700';
      case 'registered':
        return 'bg-green-100 text-green-700';
      case 'form_started':
        return 'bg-yellow-100 text-yellow-700';
      case 'form_completed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-6 w-32" />
          </div>
          <DetailSkeleton />
        </div>
      </section>
    );
  }

  if (error || !data?.link) {
    return (
      <section className="flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load referral link details</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/referrals">Back to Referral Links</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const { link, usage } = data;

  return (
    <section className="flex-1">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard/referrals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referral Links
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
                {t('detail.title')}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">{link.code}</p>
            </div>
            <StatusBadge link={link} t={t} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Link URL Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.linkUrl')}</CardTitle>
              <CardDescription>Share this link with your client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={link.url}
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Link Details */}
          <Card>
            <CardHeader>
              <CardTitle>Link Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Form Types */}
              {link.formTypes?.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-500 mb-2">{t('detail.formTypes')}</p>
                  <div className="flex flex-wrap gap-2">
                    {link.formTypes.map((ft) => (
                      <Badge key={ft.id} variant="secondary" className="bg-violet-100 text-violet-700 font-mono">
                        {ft.code} — {ft.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Case */}
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Case</p>
                    {link.case ? (
                      <Link
                        href={`/dashboard/cases/${link.case.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {link.case.caseNumber || link.case.caseType}
                      </Link>
                    ) : (
                      <p className="text-gray-400">{t('detail.autoCreateCase')}</p>
                    )}
                  </div>
                </div>

                {/* Uses */}
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Hash className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Usage</p>
                    <p className="text-gray-900">
                      {link.currentUses} / {link.maxUses || '∞'} uses
                    </p>
                  </div>
                </div>

                {/* Expiration */}
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expires</p>
                    <p className="text-gray-900">
                      {link.expiresAt ? formatDate(link.expiresAt) : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Created By */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500">
                  Created by{' '}
                  <span className="text-gray-900">
                    {link.createdByUser?.name || link.createdByUser?.email || 'Unknown'}
                  </span>{' '}
                  on {formatDate(link.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.usageHistory')}</CardTitle>
              <CardDescription>
                Track how this referral link has been used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usage.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('detail.noUsage')}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('detail.usageTable.action')}</TableHead>
                        <TableHead>{t('detail.usageTable.user')}</TableHead>
                        <TableHead>{t('detail.usageTable.date')}</TableHead>
                        <TableHead>{t('detail.usageTable.ipAddress')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usage.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Badge className={getActionBadgeColor(record.action)}>
                              {getActionLabel(record.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.user?.email || (
                              <span className="text-gray-400">Anonymous</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(record.createdAt)}</TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">
                              {record.ipAddress || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
