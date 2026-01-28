'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

const IMMIGRATION_STATUSES = ['H1B', 'F1', 'B2', 'L1', 'J1', 'O1', 'TN', 'None'];

export default function NewClientPage() {
  const t = useTranslations('dashboard.clients');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      dateOfBirth: formData.get('dateOfBirth') as string || undefined,
      countryOfBirth: formData.get('countryOfBirth') as string || undefined,
      nationality: formData.get('nationality') as string || undefined,
      alienNumber: formData.get('alienNumber') as string || undefined,
      uscisOnlineAccount: formData.get('uscisOnlineAccount') as string || undefined,
      currentStatus: formData.get('currentStatus') as string || undefined,
      addressLine1: formData.get('addressLine1') as string || undefined,
      addressLine2: formData.get('addressLine2') as string || undefined,
      city: formData.get('city') as string || undefined,
      state: formData.get('state') as string || undefined,
      zipCode: formData.get('zipCode') as string || undefined,
      country: formData.get('country') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create client');
      }

      toast.success(t('toast.created'));
      router.push('/dashboard/clients');
      router.refresh();
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
          <Link href="/dashboard/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{t('newClient')}</h1>
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
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('form.lastName')} *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Doe"
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
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('form.phone')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfBirth">{t('form.countryOfBirth')}</Label>
                <Input
                  id="countryOfBirth"
                  name="countryOfBirth"
                  placeholder="Mexico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">{t('form.nationality')}</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  placeholder="Mexican"
                />
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
                  placeholder="A123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uscisOnlineAccount">{t('form.uscisOnlineAccount')}</Label>
                <Input
                  id="uscisOnlineAccount"
                  name="uscisOnlineAccount"
                  placeholder="username@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStatus">{t('form.currentStatus')}</Label>
                <Select name="currentStatus">
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
                placeholder="123 Main Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">{t('form.addressLine2')}</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t('form.city')}</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('form.state')}</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">{t('form.zipCode')}</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t('form.country')}</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="USA"
                  defaultValue="USA"
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
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/clients">{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
