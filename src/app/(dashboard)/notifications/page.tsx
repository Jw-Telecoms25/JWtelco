"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/services/notifications";
import { formatDate } from "@/lib/utils/format";
import type { Notification } from "@/lib/services/types";
import { useUIStore } from "@/lib/stores/ui-store";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      addToast({ type: "error", title: "Failed to mark as read" });
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      addToast({ type: "success", title: "All notifications marked as read" });
    } catch {
      addToast({ type: "error", title: "Failed to mark all as read" });
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-dim"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-muted mx-auto mb-2" />
          <p className="text-muted">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                n.read
                  ? "bg-surface border-border"
                  : "bg-accent/5 border-accent/20 hover:bg-accent/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                    <p className="font-medium text-sm">{n.subject}</p>
                  </div>
                  <p className="text-sm text-muted mt-1">{n.message}</p>
                </div>
                <span className="text-xs text-muted whitespace-nowrap">
                  {formatDate(n.created_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
