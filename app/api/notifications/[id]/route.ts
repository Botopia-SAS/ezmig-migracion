import { withUser } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse } from '@/lib/api/response';
import { requireIntParam } from '@/lib/api/validators';
import { markNotificationAsRead } from '@/lib/notifications/service';

export const PATCH = withUser(async (_request, user, params) => {
  try {
    const [notificationId, err] = requireIntParam(params?.id, 'notification ID');
    if (err) return err;

    const updated = await markNotificationAsRead(notificationId, user.id);
    if (!updated) return notFoundResponse('Notification');

    return successResponse({ success: true, notification: updated });
  } catch (error) {
    return handleRouteError(error, 'Failed to update notification');
  }
});
