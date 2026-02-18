'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelectInput } from '@/components/ui/multi-select-input';
import { Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import type { TeamMemberProfile } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ROLE_OPTIONS = [
  'attorney',
  'paralegal',
  'legal_assistant',
  'admin_assistant',
  'receptionist',
  'other',
] as const;

const SPECIALTY_OPTIONS = [
  { value: 'family_immigration', label: 'Family Immigration' },
  { value: 'employment_immigration', label: 'Employment Immigration' },
  { value: 'deportation_defense', label: 'Deportation Defense' },
  { value: 'asylum', label: 'Asylum' },
  { value: 'citizenship', label: 'Citizenship & Naturalization' },
  { value: 'visa_applications', label: 'Visa Applications' },
  { value: 'daca', label: 'DACA' },
  { value: 'tps', label: 'TPS' },
  { value: 'vawa', label: 'VAWA' },
  { value: 'u_visa', label: 'U-Visa' },
];

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'french', label: 'French' },
  { value: 'mandarin', label: 'Mandarin' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'tagalog', label: 'Tagalog' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export function TeamMemberProfileSection() {
  const t = useTranslations('dashboard.general.profile');
  const { mutate: globalMutate } = useSWRConfig();
  const { data: profile, isLoading, mutate } = useSWR<TeamMemberProfile>(
    '/api/profile/team-member',
    fetcher,
    { revalidateOnFocus: false }
  );
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Merge profile data with local form changes
  const merged = { ...profile, ...formData };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/team-members/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
        return;
      }

      toast.success(t('saved'));
      setFormData({});
      mutate();
      globalMutate('/api/profile/status');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('teamMemberTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentRole = (merged.role as string) || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('teamMemberTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tm-fullName" className="mb-2">{t('fullName')}</Label>
            <Input
              id="tm-fullName"
              value={(merged.fullName as string) || ''}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder={t('fullNamePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="tm-email" className="mb-2">{t('email')}</Label>
            <Input
              id="tm-email"
              type="email"
              value={(merged.email as string) || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="tm-phone" className="mb-2">{t('phone')}</Label>
            <Input
              id="tm-phone"
              value={(merged.phone as string) || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder={t('phonePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="tm-role" className="mb-2">{t('role')}</Label>
            <Select
              value={currentRole}
              onValueChange={(val) => updateField('role', val)}
            >
              <SelectTrigger id="tm-role">
                <SelectValue placeholder={t('rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Specialties */}
        <div>
          <Label className="mb-2">{t('specialties')}</Label>
          <MultiSelectInput
            options={SPECIALTY_OPTIONS}
            value={(merged.specialties as string[]) || []}
            onChange={(val) => updateField('specialties', val)}
            placeholder={t('specialtiesPlaceholder')}
            maxSelected={5}
          />
        </div>

        {/* Attorney-specific fields */}
        {currentRole === 'attorney' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tm-barNumber" className="mb-2">{t('barNumber')}</Label>
              <Input
                id="tm-barNumber"
                value={(merged.barNumber as string) || ''}
                onChange={(e) => updateField('barNumber', e.target.value)}
                placeholder={t('barNumberPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="tm-barState" className="mb-2">{t('barState')}</Label>
              <Select
                value={(merged.barState as string) || ''}
                onValueChange={(val) => updateField('barState', val)}
              >
                <SelectTrigger id="tm-barState">
                  <SelectValue placeholder={t('barStatePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((st) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Professional Profile */}
        <div>
          <Label htmlFor="tm-bio" className="mb-2">{t('bio')}</Label>
          <Textarea
            id="tm-bio"
            value={(merged.bio as string) || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder={t('bioPlaceholder')}
            rows={3}
          />
        </div>

        <div>
          <Label className="mb-2">{t('languages')}</Label>
          <MultiSelectInput
            options={LANGUAGE_OPTIONS}
            value={(merged.languages as string[]) || []}
            onChange={(val) => updateField('languages', val)}
            placeholder={t('languagesPlaceholder')}
          />
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
