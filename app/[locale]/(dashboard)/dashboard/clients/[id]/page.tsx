'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  CreditCard,
  FileText,
  Briefcase,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  countryOfBirth: string | null;
  nationality: string | null;
  alienNumber: string | null;
  uscisOnlineAccount: string | null;
  currentStatus: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  notes: string | null;
  createdAt: string;
  cases?: Array<{
    id: number;
    caseNumber: string;
    caseType: string;
    status: string;
  }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('dashboard.clients');
  const router = useRouter();

  const { data: client, error, isLoading } = useSWR<Client>(
    `/api/clients/${id}?includeCases=true`,
    fetcher
  );

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      toast.success(t('toast.deleted'));
      router.push('/dashboard/clients');
      router.refresh();
    } catch {
      toast.error(t('toast.error'));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getAddress = () => {
    if (!client) return null;
    const parts = [
      client.addressLine1,
      client.addressLine2,
      [client.city, client.state, client.zipCode].filter(Boolean).join(', '),
      client.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <ClientDetailSkeleton />
      </section>
    );
  }

  if (error || !client) {
    return (
      <section className="flex-1">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-red-500">Client not found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Client since {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/clients/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-600 hover:bg-red-50">
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
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t('deleteConfirm.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={Mail} label={t('form.email')} value={client.email} />
                <InfoItem icon={Phone} label={t('form.phone')} value={client.phone} />
                <InfoItem icon={Calendar} label={t('form.dateOfBirth')} value={formatDate(client.dateOfBirth)} />
                <InfoItem icon={Globe} label={t('form.countryOfBirth')} value={client.countryOfBirth} />
                <InfoItem icon={Globe} label={t('form.nationality')} value={client.nationality} />
              </div>

              {getAddress() && (
                <>
                  <Separator />
                  <InfoItem icon={MapPin} label={t('form.address')} value={getAddress()} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Immigration Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.immigrationInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('form.currentStatus')}</p>
                  <div className="mt-1">
                    {client.currentStatus ? (
                      <Badge variant="outline" className="text-sm">
                        {client.currentStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
                <InfoItem icon={CreditCard} label={t('form.alienNumber')} value={client.alienNumber} />
                <InfoItem icon={FileText} label={t('form.uscisOnlineAccount')} value={client.uscisOnlineAccount} />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('form.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('detail.cases')}</CardTitle>
                <CardDescription>
                  {client.cases?.length || 0} active cases
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/cases/new?clientId=${client.id}`}>
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {!client.cases?.length ? (
                <div className="text-center py-6">
                  <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">{t('detail.noCases')}</p>
                  <Button size="sm" asChild className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
                    <Link href={`/dashboard/cases/new?clientId=${client.id}`}>
                      {t('detail.createCase')}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.cases.map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      href={`/dashboard/cases/${caseItem.id}`}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{caseItem.caseNumber}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.caseType}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {caseItem.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
