import { withAdmin } from '@/lib/api/middleware';
import { successResponse, badRequestResponse, handleRouteError } from '@/lib/api/response';
import { parseIntParam } from '@/lib/api/validators';
import { addBonusTokens } from '@/lib/tokens/service';

export const POST = withAdmin(async (req, user, params) => {
  try {
    const teamId = parseIntParam(params?.id);
    if (teamId === null) {
      return badRequestResponse('Invalid team ID');
    }

    const body = await req.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return badRequestResponse('Invalid amount');
    }

    const transaction = await addBonusTokens({
      teamId,
      amount,
      description: reason || 'Admin bonus',
      adminUserId: user.id,
    });

    return successResponse({ success: true, transaction });
  } catch (error) {
    return handleRouteError(error, 'Error adding bonus tokens');
  }
});
