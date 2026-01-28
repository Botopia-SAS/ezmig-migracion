import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getAdminDashboardStats,
  getTopTenants,
  getTransactionBreakdown,
  getSystemAlerts,
  getGlobalTokenStats,
} from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { users, teams } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all data in parallel
    const [
      stats,
      topTenants,
      transactionBreakdown,
      alerts,
      globalStats,
      userCount,
      teamCount,
    ] = await Promise.all([
      getAdminDashboardStats(),
      getTopTenants(5),
      getTransactionBreakdown(),
      getSystemAlerts(),
      getGlobalTokenStats(),
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(teams),
    ]);

    return NextResponse.json({
      stats,
      topTenants,
      transactionBreakdown,
      alerts,
      globalStats,
      totalUsers: userCount[0]?.count ?? 0,
      totalTeams: teamCount[0]?.count ?? 0,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
