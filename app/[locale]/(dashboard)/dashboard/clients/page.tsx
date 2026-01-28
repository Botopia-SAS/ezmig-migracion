'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { Plus, Search, Users, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentStatus: string | null;
  createdAt: string;
  _count?: {
    cases: number;
  };
}

interface ClientsResponse {
  clients: Client[];
  total: number;
  limit: number;
  offset: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ClientsTableSkeleton() {
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
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
        <Users className="h-8 w-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noClients')}</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
        {t('noClientsDescription')}
      </p>
      <Button asChild className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
        <Link href="/dashboard/clients/new">
          <Plus className="mr-2 h-4 w-4" />
          {t('addFirst')}
        </Link>
      </Button>
    </div>
  );
}

export default function ClientsPage() {
  const t = useTranslations('dashboard.clients');
  const [search, setSearch] = useState('');

  const { data, error, isLoading } = useSWR<ClientsResponse>(
    `/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    fetcher
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
          <Link href="/dashboard/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('newClient')}
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
            <ClientsTableSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading clients
            </div>
          ) : !data?.clients?.length ? (
            <EmptyState t={t} />
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
                      <TableHead>{t('table.name')}</TableHead>
                      <TableHead>{t('table.email')}</TableHead>
                      <TableHead>{t('table.phone')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead>{t('table.createdAt')}</TableHead>
                      <TableHead className="w-[50px]">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="hover:text-violet-600 hover:underline"
                          >
                            {client.firstName} {client.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>
                          {client.currentStatus ? (
                            <Badge variant="outline">{client.currentStatus}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(client.createdAt)}</TableCell>
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
                                <Link href={`/dashboard/clients/${client.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('actions.view')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/clients/${client.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('actions.edit')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-600">
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

              {/* Pagination info */}
              {data.total > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {data.clients.length} of {data.total} clients
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
