"use client";

import { useEffect, useState } from "react";
import { Bell, Send, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { useUIStore } from "@/lib/stores/ui-store";
import type { Notification } from "@/lib/services/types";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [userId, setUserId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      addToast({ type: "error", title: "Failed to load notifications" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !message) {
      addToast({ type: "error", title: "Subject and message are required" });
      return;
    }
    if (target === "user" && !userId) {
      addToast({ type: "error", title: "User ID is required for user target" });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, target, userId: target === "user" ? userId : undefined }),
      });
      if (!res.ok) throw new Error();
      addToast({ type: "success", title: "Notification sent" });
      setSubject("");
      setMessage("");
      setUserId("");
      fetchNotifications();
    } catch {
      addToast({ type: "error", title: "Failed to send notification" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {/* Compose */}
      <form onSubmit={handleSend} className="bg-surface rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Send className="w-4 h-4" />
          Compose Notification
        </h2>

        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full px-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
          aria-label="Subject"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={3}
          className="w-full px-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
          aria-label="Message"
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-sm"
            aria-label="Target audience"
          >
            <option value="all">All Users</option>
            <option value="user">Specific User</option>
            <option value="agents">Agents Only</option>
            <option value="admins">Admins Only</option>
          </select>

          {target === "user" && (
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="flex-1 px-4 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              aria-label="User ID"
            />
          )}

          <button
            type="submit"
            disabled={isSending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dim disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      </form>

      {/* Sent notifications */}
      <div>
        <h2 className="font-semibold mb-3">Sent Notifications</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="text-muted text-sm">No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-surface rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{n.subject}</p>
                    <p className="text-sm text-muted mt-1">{n.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-surface-elevated capitalize">
                      {n.target}
                    </span>
                    <p className="text-xs text-muted mt-1">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
