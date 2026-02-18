'use client';

import { useActionState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/[locale]/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

function AccountFormFields({
  state,
  nameValue = '',
  emailValue = '',
}: {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
}) {
  const t = useTranslations('dashboard.general.account');
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          {t('name')}
        </Label>
        <Input
          id="name"
          name="name"
          placeholder={t('namePlaceholder')}
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          {t('email')}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          defaultValue={emailValue}
          required
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountFormFields
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export function AccountSection() {
  const t = useTranslations('dashboard.general.account');
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          <Suspense fallback={<AccountFormFields state={state} />}>
            <AccountFormWithData state={state} />
          </Suspense>
          {state.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          {state.success && (
            <p className="text-green-500 text-sm">{state.success}</p>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
            disabled={isPending}
          >
            {isPending ? (
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
