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
import { PhoneInput } from '@/components/ui/phone-input';
import { COUNTRIES } from '@/lib/constants/countries';

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
}

const IMMIGRATION_STATUSES = ['H1B', 'F1', 'B2', 'L1', 'J1', 'O1', 'TN', 'None'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
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

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('dashboard.clients');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [countryOfBirth, setCountryOfBirth] = useState<string>('');
  const [nationality, setNationality] = useState<string>('');

  const { data: client, error, isLoading } = useSWR<Client>(
    `/api/clients/${id}`,
    fetcher
  );

  useEffect(() => {
    if (client) {
      if (client.currentStatus) {
        setCurrentStatus(client.currentStatus);
      }
      if (client.countryOfBirth) {
        setCountryOfBirth(client.countryOfBirth);
      }
      if (client.nationality) {
        setNationality(client.nationality);
      }
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      dateOfBirth: formData.get('dateOfBirth') as string || null,
      countryOfBirth: countryOfBirth || null,
      nationality: nationality || null,
      alienNumber: formData.get('alienNumber') as string || null,
      uscisOnlineAccount: formData.get('uscisOnlineAccount') as string || null,
      currentStatus: currentStatus || null,
      addressLine1: formData.get('addressLine1') as string || null,
      addressLine2: formData.get('addressLine2') as string || null,
      city: formData.get('city') as string || null,
      state: formData.get('state') as string || null,
      zipCode: formData.get('zipCode') as string || null,
      country: formData.get('country') as string || null,
      notes: formData.get('notes') as string || null,
    };

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      toast.success(t('toast.updated'));
      router.push(`/dashboard/clients/${id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/dashboard/clients/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('editClient')}</h1>
        </div>
        <FormSkeleton />
      </section>
    );
  }

  if (error || !client) {
    return (
      <section className="flex-1">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('editClient')}</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">Client not found</p>
        </div>
      </section>
    );
  }

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <section className="flex-1">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/dashboard/clients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('editClient')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.personalInfo')}</CardTitle>
            <CardDescription>Basic information about the client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('form.firstName')} *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  defaultValue={client.firstName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('form.lastName')} *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  defaultValue={client.lastName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')} *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={client.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('form.phone')}</Label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  value={client.phone || ''}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('form.dateOfBirth')}</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={formatDateForInput(client.dateOfBirth)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfBirth">{t('form.countryOfBirth')}</Label>
                <Select
                  value={countryOfBirth}
                  onValueChange={setCountryOfBirth}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.filter(c => c.code !== 'DIVIDER').map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">{t('form.nationality')}</Label>
                <Select
                  value={nationality}
                  onValueChange={setNationality}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.filter(c => c.code !== 'DIVIDER').map((country) => (
                      <SelectItem key={country.code} value={country.nationality}>
                        {country.nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Immigration Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.immigrationInfo')}</CardTitle>
            <CardDescription>Immigration status and USCIS information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alienNumber">{t('form.alienNumber')}</Label>
                <Input
                  id="alienNumber"
                  name="alienNumber"
                  defaultValue={client.alienNumber || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uscisOnlineAccount">{t('form.uscisOnlineAccount')}</Label>
                <Input
                  id="uscisOnlineAccount"
                  name="uscisOnlineAccount"
                  defaultValue={client.uscisOnlineAccount || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStatus">{t('form.currentStatus')}</Label>
                <Select
                  value={currentStatus}
                  onValueChange={setCurrentStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMMIGRATION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'None' ? t('statuses.None') : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.address')}</CardTitle>
            <CardDescription>Current residential address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">{t('form.addressLine1')}</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={client.addressLine1 || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">{t('form.addressLine2')}</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                defaultValue={client.addressLine2 || ''}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('form.city')}</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={client.city || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('form.state')}</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={client.state || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">{t('form.zipCode')}</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  defaultValue={client.zipCode || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t('form.country')}</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={client.country || 'USA'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={client.notes || ''}
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
          <Button type="button" variant="outline" className="bg-transparent border-gray-900 text-gray-900 hover:bg-gray-900/5" asChild>
            <Link href={`/dashboard/clients/${id}`}>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
