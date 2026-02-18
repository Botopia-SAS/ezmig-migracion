'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import useSWR from 'swr';
import type { ProfileCompletionResult } from '@/lib/profile/completion';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ProfileCompletionBanner() {
  const t = useTranslations('dashboard.profileBanner');
  const [dismissed, setDismissed] = useState(false);

  const { data, isLoading } = useSWR<ProfileCompletionResult>(
    '/api/profile/status',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  if (isLoading || !data || data.isComplete || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 truncate">
            {t('message')}
          </p>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 shrink-0">
            {t('completion', { percentage: data.percentage })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/general">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t('goComplete')}
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
