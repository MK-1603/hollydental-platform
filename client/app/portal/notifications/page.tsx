"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell, CalendarCheck, ClipboardList, MessageSquare, RefreshCw, Activity } from "lucide-react";
import { useLiveData } from "@/lib/useLiveData";
import PushToggle from "@/components/common/PushToggle";

interface NotificationItem {
  id: string;
  type: "appointment" | "prescription" | "message";
  title: string;
  body: string;
  href: string;
  timestamp: string;
  read: boolean;
}

const ICONS: Record<NotificationItem["type"], React.ReactNode> = {
  appointment: <CalendarCheck className="w-4 h-4 text-emerald-600" />,
  prescription: <ClipboardList className="w-4 h-4 text-amber-600" />,
  message: <MessageSquare className="w-4 h-4 text-navy" />,
};

function formatRelative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (Number.isNaN(diff) || diff < 0) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

export default function PortalNotificationsPage() {
  // Rapid 5 seconds sync cadence for true real-time notification updates
  const { data, loading, error, refetch } = useLiveData<NotificationItem[]>(
    "/notifications/me",
    { intervalMs: 5000, initialData: [] }
  );

  const items = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-1 xl:px-4 select-none">
      
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            Notification Center
          </h1>
          <p className="text-gray-500 text-sm mt-2 hidden sm:block">
            Real-time telemetry stream on your visits, scripts, and dental charts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 border border-emerald-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
          
          <button
            onClick={refetch}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Push notifications settings console ── */}
      <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-500" /> Push Telemetry Subscriptions
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Enable instant browser notification pings so you never miss clinic alerts or updates.
            </p>
          </div>
          <div className="flex-1 min-w-0 w-full sm:max-w-[400px]">
            <PushToggle variant="card" />
          </div>
        </div>
      </div>

      {/* ── Unified Inbox Viewport ── */}
      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 shimmer rounded-[20px] bg-white border border-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 rounded-[20px] p-6 text-sm text-red-700 flex items-center gap-3 animate-fade-in shadow-sm">
          <Bell className="w-6 h-6 text-red-500 shrink-0" />
          <span className="font-bold">We couldn't synchronize your notifications center. Verify your credentials.</span>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-[20px] bg-white p-16 text-center mx-auto mt-6 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100 shadow-sm">
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-serif text-xl font-bold text-gray-900">
            You're all caught up!
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto font-medium">
            New updates on clinical summaries, invoices, or appointment bookings will land here dynamically.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-sm rounded-[20px] overflow-hidden divide-y divide-gray-50">
          {items.map((n) => {
            const isUnread = !n.read;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={`block transition-colors ${
                  isUnread ? "bg-blue-50/30" : "bg-white"
                } hover:bg-gray-50/80`}
              >
                <div className="p-6 flex items-start gap-5">
                  {/* Icon Indicator */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      n.type === "appointment"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                        : n.type === "prescription"
                        ? "bg-amber-50 border-amber-100 text-amber-600"
                        : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}
                  >
                    {ICONS[n.type]}
                  </div>

                  {/* Context Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className={`text-sm font-bold text-gray-900 ${isUnread ? "font-extrabold" : ""}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 shrink-0">
                        {formatRelative(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                      {n.body}
                    </p>
                    
                    {/* Badge details */}
                    {isUnread && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 mt-3">
                        New update
                      </span>
                    )}
                  </div>

                  {/* Pulse bullet indicator on the far right */}
                  {isUnread && (
                    <div className="self-center shrink-0 ml-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
