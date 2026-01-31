import { NextResponse } from 'next/server';
import { getUserWithTeam } from '@/lib/auth/rbac';
import { getCaseStats, getUpcomingDeadlines } from '@/lib/cases/service';
import { getClientStats } from '@/lib/clients/service';
import { getWalletBalance } from '@/lib/tokens/service';

/**
 * GET /api/overview
 * Get overview statistics for the dashboard
 * Accessible by owner and staff roles only
 */
export async function GET() {
  try {
    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userWithTeam.team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Only owner and staff can access overview
    if (userWithTeam.tenantRole === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teamId = userWithTeam.team.id;

    // Fetch all stats in parallel
    const [caseStats, clientStats, upcomingDeadlines] = await Promise.all([
      getCaseStats(teamId),
      getClientStats(teamId),
      getUpcomingDeadlines(teamId, 30), // Next 30 days
    ]);

    // Token balance - only for owner role
    let tokenBalance: number | null = null;
    if (userWithTeam.tenantRole === 'owner') {
      try {
        tokenBalance = await getWalletBalance(teamId);
      } catch {
        tokenBalance = null;
      }
    }

    // Calculate days remaining for deadlines
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlinesWithDays = upcomingDeadlines.map((deadline) => {
      const deadlineDate = new Date(deadline.filingDeadline!);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: deadline.id,
        caseNumber: deadline.caseNumber,
        clientName: deadline.clientName,
        caseType: deadline.caseType,
        filingDeadline: deadline.filingDeadline,
        daysRemaining,
      };
    });

    // Calculate active cases (in_progress status)
    const activeCases = caseStats.byStatus.find(
      (s) => s.status === 'in_progress'
    )?.count || 0;

    return NextResponse.json({
      caseStats: {
        total: caseStats.total,
        active: activeCases,
        byStatus: caseStats.byStatus,
        byType: caseStats.byType,
      },
      clientStats: {
        total: clientStats.total,
        withCases: clientStats.withCases,
      },
      upcomingDeadlines: deadlinesWithDays,
      tokenBalance,
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview stats' },
      { status: 500 }
    );
  }
}
