import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from '@/i18n/routing';
import { OnboardingFlow } from './onboarding-flow';
import { getUserProfile, getUser } from '@/lib/db/queries';

export default async function OnboardingPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect({ href: '/sign-in', locale });
  }

  // Get full user data
  const user = await getUser();
  if (!user) {
    redirect({ href: '/sign-in', locale });
  }

  // Check if user already has a profile type set
  const userProfile = await getUserProfile(user.id);

  // If user already has a profile type and team, redirect to dashboard
  if (userProfile?.profileType && userProfile?.teamId) {
    redirect({ href: '/dashboard', locale });
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingFlow
        userId={session.user.id.toString()}
        userEmail={user.email}
        locale={locale}
      />
    </Suspense>
  );
}