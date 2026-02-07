import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { getWalletByTeamId } from '@/lib/tokens/service';

export const GET = withAuth(async (_request, { teamId }) => {
  try {
    const wallet = await getWalletByTeamId(teamId);

    return successResponse({
      balance: wallet?.balance ?? 0,
      teamId,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch token balance');
  }
});
