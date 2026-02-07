'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { useActionState } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember } from '@/app/[locale]/(login)/actions';
import useSWR from 'swr';
import { Suspense, useState } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Copy, Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function PlanBadge() {
  const t = useTranslations('dashboard.team.subscription');
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  const isActive = teamData?.subscriptionStatus === 'active' || teamData?.subscriptionStatus === 'trialing';

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className={`text-xs font-medium px-2.5 py-0.5 ${isActive ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'}`}>
        {teamData?.planName || 'Free'}
      </Badge>
      <form action={customerPortalAction}>
        <Button type="submit" variant="ghost" size="sm" className="text-xs text-violet-600 hover:text-violet-700 h-auto px-2 py-1">
          {t('managePlan')}
        </Button>
      </form>
    </div>
  );
}

function TeamMembersSkeleton() {
  const t = useTranslations('dashboard.team.members');
  return (
    <Card className="h-[140px]">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembers() {
  const t = useTranslations('dashboard.team.members');
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  // Check if current user is owner
  const currentUserMember = teamData?.teamMembers?.find(
    (member) => member.user.id === user?.id
  );
  const isOwner = currentUserMember?.role === 'owner';

  // Can remove a member if: current user is owner, member is not owner, and member is not self
  const canRemoveMember = (member: NonNullable<typeof teamData>['teamMembers'][0]) => {
    return isOwner && member.role !== 'owner' && member.user.id !== user?.id;
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No team members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamData.teamMembers.map((member) => (
            <li key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {getUserDisplayName(member.user)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.role === 'owner' ? t('owner') : member.role === 'staff' ? t('staff') : t('member')}
                  </p>
                </div>
              </div>
              {canRemoveMember(member) && (
                <form action={removeAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isRemovePending}
                  >
                    {isRemovePending ? '...' : t('remove')}
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {removeState?.error && (
          <p className="text-red-500 mt-4">{removeState.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteTeamMemberSkeleton() {
  const t = useTranslations('dashboard.team.invite');
  return (
    <Card className="h-[260px]">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteTeamMember() {
  const t = useTranslations('dashboard.team.invite');
  const tMembers = useTranslations('dashboard.team.members');
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  // Check if current user is owner in the team (not user.role, but teamMember.role)
  const currentUserMember = teamData?.teamMembers?.find(
    (member) => member.user.id === user?.id
  );
  const isOwner = currentUserMember?.role === 'owner';

  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              {t('email')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              required
              disabled={!isOwner}
            />
          </div>
          <div>
            <Label>{t('role')}</Label>
            <RadioGroup
              defaultValue="staff"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="staff" id="staff" />
                <Label htmlFor="staff">{tMembers('staff')}</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">{tMembers('owner')}</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-500">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('button')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type Invitation = {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

function PendingInvitationsSkeleton() {
  const t = useTranslations('dashboard.team.pendingInvitations');
  return (
    <Card className="h-[140px]">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PendingInvitations() {
  const t = useTranslations('dashboard.team.pendingInvitations');
  const { data } = useSWR<{ invitations: Invitation[] }>(
    '/api/invitations',
    fetcher
  );
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyInviteLink = async (invitationId: number) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/sign-up?inviteId=${invitationId}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invitationId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!data?.invitations?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('noInvitations')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {data.invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{invitation.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {invitation.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyInviteLink(invitation.id)}
                className="gap-2"
              >
                {copiedId === invitation.id ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const t = useTranslations('dashboard.team');
  return (
    <section className="flex-1">
      {/* Title row with inline plan badge */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">{t('title')}</h1>
        <PlanBadge />
      </div>

      {/* Team Members left (full height) | Invite + Pending right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Suspense fallback={<TeamMembersSkeleton />}>
            <TeamMembers />
          </Suspense>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<InviteTeamMemberSkeleton />}>
            <InviteTeamMember />
          </Suspense>
          <Suspense fallback={<PendingInvitationsSkeleton />}>
            <PendingInvitations />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
