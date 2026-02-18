export const dynamic = 'force-dynamic';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

async function getTenantsWithDetails() {
  const allTeams = await db.select().from(teams);

  const tenantsWithDetails = await Promise.all(
    allTeams.map(async (team) => {
      const [memberCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));

      const [ownerMembership] = await db
        .select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id))
        .limit(1);

      let ownerEmail = null;
      if (ownerMembership) {
        const [owner] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, ownerMembership.userId))
          .limit(1);
        ownerEmail = owner?.email;
      }

      return {
        id: team.id,
        name: team.name,
        type: team.type,
        memberCount: memberCount?.count ?? 0,
        ownerEmail,
        subscriptionStatus: team.subscriptionStatus,
        planName: team.planName,
        createdAt: team.createdAt,
      };
    })
  );

  return tenantsWithDetails;
}

export default async function TenantsPage() {
  const t = await getTranslations('admin.tenants');
  const tenants = await getTenantsWithDetails();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="text-sm text-gray-500">
          {t('total', { count: tenants.length })}
        </div>
      </div>

      <div className="space-y-4">
        {tenants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{t('empty')}</p>
            </CardContent>
          </Card>
        ) : (
          tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">{tenant.ownerEmail}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          {t('members', { count: tenant.memberCount })}
                        </span>
                        {tenant.planName && (
                          <Badge variant="secondary">{tenant.planName}</Badge>
                        )}
                        {tenant.subscriptionStatus && (
                          <Badge variant={tenant.subscriptionStatus === 'active' ? 'success' : 'secondary'}>
                            {tenant.subscriptionStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {tenant.type?.replace('_', ' ') || t('unknown')}
                    </Badge>
                    <Link href={`/admin/tenants/${tenant.id}`}>
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
