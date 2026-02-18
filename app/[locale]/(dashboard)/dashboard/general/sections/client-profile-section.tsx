'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/constants/countries';
import type { Client } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const IMMIGRATION_STATUSES = ['H1B', 'F1', 'B2', 'L1', 'J1', 'O1', 'TN', 'None'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export function ClientProfileSection() {
  const t = useTranslations('dashboard.general.profile');
  const { data: client, isLoading, mutate } = useSWR<Client>(
    '/api/profile/client',
    fetcher,
    { revalidateOnFocus: false }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const merged = { ...client, ...formData };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!client?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/client', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('saveError'));
        return;
      }
      toast.success(t('saved'));
      setFormData({});
      mutate();
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('clientTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('clientTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('noClientProfile')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clientTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('personalInfo')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cp-firstName" className="mb-2">{t('firstName')}</Label>
              <Input
                id="cp-firstName"
                value={(merged.firstName as string) || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder={t('firstNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-lastName" className="mb-2">{t('lastName')}</Label>
              <Input
                id="cp-lastName"
                value={(merged.lastName as string) || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder={t('lastNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-email" className="mb-2">{t('emailReadOnly')}</Label>
              <Input
                id="cp-email"
                value={client.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-[11px] text-gray-400 mt-1">{t('emailHelp')}</p>
            </div>
            <div>
              <Label htmlFor="cp-phone" className="mb-2">{t('phone')}</Label>
              <Input
                id="cp-phone"
                value={(merged.phone as string) || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder={t('phonePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-dob" className="mb-2">{t('dateOfBirth')}</Label>
              <Input
                id="cp-dob"
                type="date"
                value={(merged.dateOfBirth as string) || ''}
                onChange={(e) => updateField('dateOfBirth', e.target.value || null)}
              />
            </div>
            <div>
              <Label htmlFor="cp-cob" className="mb-2">{t('countryOfBirth')}</Label>
              <Select
                value={(merged.countryOfBirth as string) || ''}
                onValueChange={(val) => updateField('countryOfBirth', val)}
              >
                <SelectTrigger id="cp-cob">
                  <SelectValue placeholder={t('countryOfBirthPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter((c) => c.name).map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cp-nationality" className="mb-2">{t('nationality')}</Label>
              <Select
                value={(merged.nationality as string) || ''}
                onValueChange={(val) => updateField('nationality', val)}
              >
                <SelectTrigger id="cp-nationality">
                  <SelectValue placeholder={t('nationalityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter((c) => c.nationality).map((c) => (
                    <SelectItem key={c.code} value={c.nationality}>{c.nationality}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Immigration Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('immigrationInfo')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cp-alien" className="mb-2">{t('alienNumber')}</Label>
              <Input
                id="cp-alien"
                value={(merged.alienNumber as string) || ''}
                onChange={(e) => updateField('alienNumber', e.target.value)}
                placeholder={t('alienNumberPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-uscis" className="mb-2">{t('uscisAccount')}</Label>
              <Input
                id="cp-uscis"
                value={(merged.uscisOnlineAccount as string) || ''}
                onChange={(e) => updateField('uscisOnlineAccount', e.target.value)}
                placeholder={t('uscisAccountPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-status" className="mb-2">{t('currentStatus')}</Label>
              <Select
                value={(merged.currentStatus as string) || ''}
                onValueChange={(val) => updateField('currentStatus', val)}
              >
                <SelectTrigger id="cp-status">
                  <SelectValue placeholder={t('currentStatusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {IMMIGRATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('addressInfo')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="cp-addr1" className="mb-2">{t('addressLine1')}</Label>
              <Input
                id="cp-addr1"
                value={(merged.addressLine1 as string) || ''}
                onChange={(e) => updateField('addressLine1', e.target.value)}
                placeholder={t('addressLine1Placeholder')}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="cp-addr2" className="mb-2">{t('addressLine2')}</Label>
              <Input
                id="cp-addr2"
                value={(merged.addressLine2 as string) || ''}
                onChange={(e) => updateField('addressLine2', e.target.value)}
                placeholder={t('addressLine2Placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-city" className="mb-2">{t('city')}</Label>
              <Input
                id="cp-city"
                value={(merged.city as string) || ''}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder={t('cityPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-state" className="mb-2">{t('stateProv')}</Label>
              <Select
                value={(merged.state as string) || ''}
                onValueChange={(val) => updateField('state', val)}
              >
                <SelectTrigger id="cp-state">
                  <SelectValue placeholder={t('stateProvPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((st) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cp-zip" className="mb-2">{t('zipCode')}</Label>
              <Input
                id="cp-zip"
                value={(merged.zipCode as string) || ''}
                onChange={(e) => updateField('zipCode', e.target.value)}
                placeholder={t('zipCodePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="cp-country" className="mb-2">{t('addressCountry')}</Label>
              <Select
                value={(merged.country as string) || ''}
                onValueChange={(val) => updateField('country', val)}
              >
                <SelectTrigger id="cp-country">
                  <SelectValue placeholder={t('addressCountryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter((c) => c.name).map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || Object.keys(formData).length === 0}
          className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('save')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
