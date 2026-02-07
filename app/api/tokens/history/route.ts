import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { getTransactionHistory } from '@/lib/tokens/service';

export const GET = withAuth(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const transactions = await getTransactionHistory(teamId, limit, offset);

    return successResponse({ transactions });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch transaction history');
  }
});
