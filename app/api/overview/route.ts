import { withStaffOrOwner } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { getCaseStats, getUpcomingDeadlines } from '@/lib/cases/service';
import { getClientStats } from '@/lib/clients/service';
import { getWalletBalance } from '@/lib/tokens/service';

export const GET = withStaffOrOwner(async (_req, ctx) => {
  try {
    // Fetch all stats in parallel
    const [caseStats, clientStats, upcomingDeadlines] = await Promise.all([
      getCaseStats(ctx.teamId),
      getClientStats(ctx.teamId),
      getUpcomingDeadlines(ctx.teamId, 30), // Next 30 days
    ]);

    // Token balance - only for owner role
    let tokenBalance: number | null = null;
    if (ctx.tenantRole === 'owner') {
      try {
        tokenBalance = await getWalletBalance(ctx.teamId);
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

    return successResponse({
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
    return handleRouteError(error, 'Error fetching overview stats');
  }
});
