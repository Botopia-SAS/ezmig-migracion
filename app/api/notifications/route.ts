import { withUser } from '@/lib/api/middleware';
import { successResponse, handleRouteError, badRequestResponse } from '@/lib/api/response';
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from '@/lib/notifications/service';

export const GET = withUser(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      const count = await getUnreadNotificationCount(user.id);
      return successResponse({ unreadCount: count });
    }

    const notifications = await getNotificationsForUser(user.id, limit);
    const unreadCount = await getUnreadNotificationCount(user.id);

    return successResponse({ notifications, unreadCount });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch notifications');
  }
});

export const POST = withUser(async (request, user) => {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'markAllRead') {
      await markAllNotificationsAsRead(user.id);
      return successResponse({ success: true });
    }

    return badRequestResponse('Invalid action');
  } catch (error) {
    return handleRouteError(error, 'Failed to update notifications');
  }
});
