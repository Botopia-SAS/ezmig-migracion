'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateTeamLogo } from '@/app/[locale]/(login)/actions';
import { TeamDataWithMembers } from '@/lib/db/schema';
import useSWR, { useSWRConfig } from 'swr';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
};

export function LogoSection() {
  const t = useTranslations('dashboard.general.logo');
  const { mutate } = useSWRConfig();
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [logoState, logoAction, isLogoPending] = useActionState<ActionState, FormData>(
    updateTeamLogo,
    {}
  );

  useEffect(() => {
    if (logoState?.success) {
      mutate('/api/team');
    }
  }, [logoState, mutate]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={logoAction}>
          <div className="flex items-center gap-4">
            {team?.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name || 'Tenant logo'}
                className="h-12 w-12 rounded-md border object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-md border border-dashed grid place-items-center text-xs text-muted-foreground">
                Logo
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo">{t('label')}</Label>
              <Input id="logo" name="logo" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">{t('helper')}</p>
            </div>
          </div>

          {logoState?.error && <p className="text-red-500 text-sm">{logoState.error}</p>}
          {logoState?.success && <p className="text-green-600 text-sm">{logoState.success}</p>}

          <Button
            type="submit"
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
            disabled={isLogoPending}
          >
            {isLogoPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
