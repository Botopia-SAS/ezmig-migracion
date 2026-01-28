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
  Copy,
  Trash2,
  Link2,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralLink {
  id: number;
  code: string;
  teamId: number;
  caseId: number | null;
  clientId: number | null;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number;
  currentUses: number;
  createdAt: string;
  url: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
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

interface ReferralsResponse {
  links: ReferralLink[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ReferralsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-8" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-violet-100 p-4 mb-4">
        <Link2 className="h-8 w-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noLinks')}</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
        {t('noLinksDescription')}
      </p>
      <Button asChild className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
        <Link href="/dashboard/referrals/new">
          <Plus className="mr-2 h-4 w-4" />
          {t('addFirst')}
        </Link>
      </Button>
    </div>
  );
}

function StatusBadge({ link, t }: { link: ReferralLink; t: (key: string) => string }) {
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const isMaxReached = link.maxUses > 0 && link.currentUses >= link.maxUses;

  if (!link.isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
        <XCircle className="h-3 w-3" />
        {t('statuses.inactive')}
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        <Clock className="h-3 w-3" />
        {t('statuses.expired')}
      </span>
    );
  }

  if (isMaxReached) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
        <AlertCircle className="h-3 w-3" />
        {t('statuses.maxReached')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3" />
      {t('statuses.active')}
    </span>
  );
}

export default function ReferralsPage() {
  const t = useTranslations('dashboard.referrals');
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<ReferralLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<ReferralsResponse>(
    '/api/referrals',
    fetcher
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('toast.copied'));
    } catch {
      toast.error(t('toast.error'));
    }
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/referrals/${linkToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success(t('toast.deleted'));
      mutate();
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    } catch {
      toast.error(t('toast.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLinks = data?.links?.filter((link) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      link.code.toLowerCase().includes(searchLower) ||
      link.client?.firstName?.toLowerCase().includes(searchLower) ||
      link.client?.lastName?.toLowerCase().includes(searchLower) ||
      link.case?.caseNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <section className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
          <Link href="/dashboard/referrals/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('newLink')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ReferralsTableSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading referral links
            </div>
          ) : !filteredLinks?.length ? (
            search ? (
              <div className="text-center py-8 text-gray-500">
                No referral links match your search
              </div>
            ) : (
              <EmptyState t={t} />
            )
          ) : (
            <div className="space-y-4">
              {/* Search */}
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

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.code')}</TableHead>
                      <TableHead>{t('table.client')}</TableHead>
                      <TableHead>{t('table.case')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead>{t('table.uses')}</TableHead>
                      <TableHead>{t('table.expiresAt')}</TableHead>
                      <TableHead>{t('table.createdAt')}</TableHead>
                      <TableHead className="w-[50px]">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-mono text-sm">
                          <Link
                            href={`/dashboard/referrals/${link.id}`}
                            className="hover:text-violet-600 hover:underline"
                          >
                            {link.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {link.client ? (
                            <Link
                              href={`/dashboard/clients/${link.client.id}`}
                              className="hover:underline"
                            >
                              {link.client.firstName} {link.client.lastName}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {link.case ? (
                            <Link
                              href={`/dashboard/cases/${link.case.id}`}
                              className="hover:underline"
                            >
                              {link.case.caseNumber || link.case.caseType}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge link={link} t={t} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {link.currentUses} / {link.maxUses || '∞'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={link.expiresAt ? '' : 'text-gray-400'}>
                            {formatDate(link.expiresAt)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(link.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/referrals/${link.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('actions.view')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(link.url)}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('actions.copy')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setLinkToDelete(link);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Count info */}
              {data?.links && data.links.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredLinks.length} of {data.links.length} referral links
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('deleteConfirm.cancel')}
            </Button>
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
    </section>
  );
}
