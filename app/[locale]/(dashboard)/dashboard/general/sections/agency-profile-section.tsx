'use client';

import { useState } from 'react';
import { AgencyRegistrationForm } from '@/components/agencies/agency-registration-form';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AgencyRegistrationData } from '@/lib/db/schema';

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json()).then((data) => data.agency ?? data);

export function AgencyProfileSection() {
  const t = useTranslations('dashboard.general.profile');
  const [isSaving, setIsSaving] = useState(false);
  const { data: agency, isLoading, mutate } = useSWR(
    '/api/agencies/settings',
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleSave = async (data: Partial<AgencyRegistrationData>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/agencies/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
        return;
      }

      toast.success(t('saved'));
      mutate();
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AgencyRegistrationForm
      initialData={agency || {}}
      mode="settings"
      onSave={handleSave}
      isLoading={isSaving}
    />
  );
}
