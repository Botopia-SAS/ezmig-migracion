'use client';

import { useTranslations } from 'next-intl';
import { useRole } from '@/lib/auth/role-context';
import { Loader2 } from 'lucide-react';
import { AccountSection } from './sections/account-section';
import { LogoSection } from './sections/logo-section';
import { SecuritySection } from './sections/security-section';
import { AgencyProfileSection } from './sections/agency-profile-section';
import { TeamMemberProfileSection } from './sections/team-member-profile-section';
import { FreelancerProfileSection } from './sections/freelancer-profile-section';
import { ClientProfileSection } from './sections/client-profile-section';

export default function GeneralPageContent() {
  const t = useTranslations('dashboard.general');
  const { user, isOwner, isClient, isLoading } = useRole();

  if (isLoading) {
    return (
      <section className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  const profileType = user?.profileType;

  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {t('title')}
      </h1>

      {/* Account + Logo row */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 mb-6">
        <AccountSection />
        {isOwner && <LogoSection />}
      </div>

      {/* Profile section based on user type */}
      {/* Owners always see agency profile (covers legacy users with null profileType) */}
      {(profileType === 'agency' || isOwner) && (
        <div className="mb-6">
          <AgencyProfileSection />
        </div>
      )}

      {profileType === 'team_member' && (
        <div className="mb-6">
          <TeamMemberProfileSection />
        </div>
      )}

      {profileType === 'freelancer' && (
        <div className="mb-6">
          <FreelancerProfileSection />
        </div>
      )}

      {isClient && (
        <div className="mb-6">
          <ClientProfileSection />
        </div>
      )}

      {/* Security section */}
      <SecuritySection />
    </section>
  );
}
