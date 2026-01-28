export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, Building, ExternalLink, Calendar } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { users, teamMembers, teams } from '@/lib/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

interface UserWithTeam {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  teamId: number | null;
  teamName: string | null;
  teamRole: string | null;
}

async function getAllUsers(): Promise<UserWithTeam[]> {
  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

  const usersWithTeams = await Promise.all(
    allUsers.map(async (user) => {
      // Get team membership
      const [membership] = await db
        .select({
          teamId: teamMembers.teamId,
          role: teamMembers.role,
        })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.id))
        .limit(1);

      let teamName = null;
      if (membership) {
        const [team] = await db
          .select({ name: teams.name })
          .from(teams)
          .where(eq(teams.id, membership.teamId))
          .limit(1);
        teamName = team?.name || null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        teamId: membership?.teamId || null,
        teamName,
        teamRole: membership?.role || null,
      };
    })
  );

  return usersWithTeams;
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'attorney':
      return 'default';
    case 'staff':
      return 'secondary';
    case 'end_user':
      return 'outline';
    default:
      return 'secondary';
  }
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default async function UsersPage() {
  const t = await getTranslations('admin.users');
  const locale = await getLocale();
  const allUsers = await getAllUsers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="text-sm text-gray-500">{t('total', { count: allUsers.length })}</div>
      </div>

      <div className="space-y-4">
        {allUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <UserCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{t('empty')}</p>
            </CardContent>
          </Card>
        ) : (
          allUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-100 rounded-full">
                      <UserCircle className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.name || 'Sin nombre'}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {user.teamName ? (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Building className="h-4 w-4" />
                            {user.teamName}
                            {user.teamRole && (
                              <span className="text-gray-400">({user.teamRole})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">{t('noTeam')}</span>
                        )}
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {t('details')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
