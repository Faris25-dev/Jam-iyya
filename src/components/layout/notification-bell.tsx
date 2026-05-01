'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  user_id: string;
  related_jam3iyya_id?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  locale?: 'ar' | 'en';
}

/**
 * Real-time Notification Bell Component
 * 
 * Features:
 * - Supabase Realtime subscriptions for instant notifications
 * - Unread badge count with bandwidth optimization
 * - Toast notifications for new events
 * - Dropdown list of recent notifications
 * - Mark as read / Delete actions
 * - RTL support for Arabic
 */
export function NotificationBell({ locale = 'en' }: NotificationBellProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isRtl = locale === 'ar';

  // State
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Localization
  const labels = useMemo(() => ({
    noNotifications: locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications',
    markAsRead: locale === 'ar' ? 'وضع علامة كمقروء' : 'Mark as read',
    delete: locale === 'ar' ? 'حذف' : 'Delete',
    newNotification: locale === 'ar' ? 'إشعار جديد' : 'New notification',
    notifications: locale === 'ar' ? 'الإشعارات' : 'Notifications',
  }), [locale]);

  // ========== FETCH UNREAD COUNT (OPTIMIZED) ==========
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?count_only=true', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // ========== FETCH NOTIFICATIONS ==========
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=10', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.is_read).length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========== MARK AS READ ==========
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // ========== DELETE NOTIFICATION ==========
  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // ========== SETUP REALTIME SUBSCRIPTION ==========
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Subscribe to new notifications and updates
    const channel = supabase
      .channel(`notifications:user_notifications`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const newNotification = payload.new as Notification;

          // Add to notifications list (at the top)
          setNotifications(prev => [newNotification, ...prev].slice(0, 10));

          // Increment unread count
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            toast.success(labels.newNotification, {
              description: newNotification.message,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const updatedNotification = payload.new as Notification;

          // Update in list
          setNotifications(prev =>
            prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
          );

          // Update unread count if status changed
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const deletedId = payload.old.id;

          setNotifications(prev => {
            const wasUnread = prev.find(n => n.id === deletedId)?.is_read === false;
            if (wasUnread) {
              setUnreadCount(count => Math.max(0, count - 1));
            }
            return prev.filter(n => n.id !== deletedId);
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchNotifications, labels.newNotification, supabase]);

  // ========== CLOSE DROPDOWN ON OUTSIDE CLICK ==========
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={labels.notifications}
        aria-label={labels.notifications}
      >
        <Bell size={24} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-80 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 z-50`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">{labels.notifications}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {labels.noNotifications}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    className={`p-4 transition-colors cursor-pointer ${
                      !notification.is_read
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread Indicator */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-600 rounded-full" />
                      )}

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString(locale)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                        title={labels.delete}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {locale === 'ar' ? 'عرض جميع الإشعارات' : 'View all notifications'}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
