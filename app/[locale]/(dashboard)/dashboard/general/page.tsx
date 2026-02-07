'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Trash2 } from 'lucide-react';
import { updateAccount, updateTeamLogo, updatePassword, deleteAccount } from '@/app/[locale]/(login)/actions';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import useSWR, { useSWRConfig } from 'swr';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = ''
}: AccountFormProps) {
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
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function GeneralPage() {
  const t = useTranslations('dashboard.general');
  const tAccount = useTranslations('dashboard.general.account');
  const tSecurity = useTranslations('dashboard.security');
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );
  const [logoState, logoAction, isLogoPending] = useActionState<ActionState, FormData>(
    updateTeamLogo,
    {}
  );
  const [passwordState, passwordAction, isPasswordPending] = useActionState<PasswordState, FormData>(
    updatePassword,
    {}
  );
  const [deleteState, deleteAction, isDeletePending] = useActionState<DeleteState, FormData>(
    deleteAccount,
    {}
  );
  const { mutate } = useSWRConfig();
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const isOwner = team?.teamMembers.some((member) => member.user.id === user?.id && member.role === 'owner');

  useEffect(() => {
    if (logoState?.success) {
      mutate('/api/team');
    }
  }, [logoState, mutate]);

  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {t('title')}
      </h1>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{tAccount('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={formAction}>
              <Suspense fallback={<AccountForm state={state} />}>
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
                    {tAccount('saving')}
                  </>
                ) : (
                  tAccount('save')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t('logo.title')}</CardTitle>
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
                    <Label htmlFor="logo">{t('logo.label')}</Label>
                    <Input id="logo" name="logo" type="file" accept="image/*" />
                    <p className="text-xs text-muted-foreground">{t('logo.helper')}</p>
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
                      {t('logo.saving')}
                    </>
                  ) : (
                    t('logo.save')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 mt-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{tSecurity('password.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={passwordAction}>
              <div>
                <Label htmlFor="current-password" className="mb-2">
                  {tSecurity('password.current')}
                </Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.currentPassword}
                />
              </div>
              <div>
                <Label htmlFor="new-password" className="mb-2">
                  {tSecurity('password.new')}
                </Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.newPassword}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="mb-2">
                  {tSecurity('password.confirm')}
                </Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.confirmPassword}
                />
              </div>
              {passwordState.error && (
                <p className="text-red-500 text-sm">{passwordState.error}</p>
              )}
              {passwordState.success && (
                <p className="text-green-500 text-sm">{passwordState.success}</p>
              )}
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                disabled={isPasswordPending}
              >
                {isPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tSecurity('password.updating')}
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {tSecurity('password.update')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>{tSecurity('deleteAccount.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              {tSecurity('deleteAccount.description')}
            </p>
            <form action={deleteAction} className="space-y-4">
              <div>
                <Label htmlFor="delete-password" className="mb-2">
                  {tSecurity('password.confirm')}
                </Label>
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={deleteState.password}
                />
              </div>
              {deleteState.error && (
                <p className="text-red-500 text-sm">{deleteState.error}</p>
              )}
              <Button
                type="submit"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeletePending}
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tSecurity('deleteAccount.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {tSecurity('deleteAccount.button')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
