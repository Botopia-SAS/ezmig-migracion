'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications(limit = 20) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, mutate } = useSWR<NotificationsResponse>(
    mounted ? `/api/notifications?limit=${limit}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      mutate();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  async function markAsRead(id: number) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      mutate();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  return {
    notifications,
    unreadCount,
    mounted,
    markAllRead,
    markAsRead,
    refresh: mutate,
  };
}
