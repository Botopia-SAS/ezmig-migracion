'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FreelancerForm } from '@/components/freelancers/freelancer-form';
import { useTranslations } from 'next-intl';
import useSWR, { useSWRConfig } from 'swr';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FreelancerProfile } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FreelancerProfileSection() {
  const t = useTranslations('dashboard.general.profile');
  const { mutate: globalMutate } = useSWRConfig();
  const { data: profile, isLoading, mutate } = useSWR<FreelancerProfile>(
    '/api/profile/freelancer',
    fetcher,
    { revalidateOnFocus: false }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: Record<string, unknown>) => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/freelancers/${profile.id}`, {
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
          <CardTitle>{t('freelancerTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('freelancerTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <FreelancerForm
          initialData={profile || {}}
          mode="edit"
          onSave={handleSave}
          isLoading={isSaving}
        />
      </CardContent>
    </Card>
  );
}
