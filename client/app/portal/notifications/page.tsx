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
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-1 select-none">
      
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between border-b border-gray-250 pb-4 gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-gold" />
            </div>
            Notification Center
          </h1>
          <p className="text-gray-400 text-xs mt-1 ml-10.5 hidden sm:block">
            Real-time telemetry stream on your visits, scripts, and dental charts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
          
          <button
            onClick={refetch}
            className="bg-white hover:bg-gray-50 text-navy border border-gray-200 hover:border-navy font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Push notifications settings console ── */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-navy flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" /> Push Telemetry Subscriptions
            </h3>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              Enable instant browser notification pings so you never miss clinic alerts or updates.
            </p>
          </div>
          <div className="shrink-0">
            <PushToggle variant="card" />
          </div>
        </div>
      </div>

      {/* ── Unified Inbox Viewport ── */}
      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 shimmer rounded-xl bg-white border border-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-150 bg-red-50/40 rounded-2xl p-6 text-xs text-red-700 flex items-center gap-3 animate-fade-in shadow-2xs">
          <Bell className="w-5 h-5 text-red-500 shrink-0" />
          <span className="font-bold">We couldn't synchronize your notifications center. Verify your credentials.</span>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-gray-250/60 rounded-2xl bg-white p-16 text-center max-w-md mx-auto mt-6 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold mx-auto flex items-center justify-center border border-gold/15 shadow-inner">
            <Bell className="w-6 h-6 text-gold" />
          </div>
          <h3 className="font-serif text-base font-extrabold text-navy">
            You're all caught up!
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mx-auto font-medium">
            New updates on clinical summaries, invoices, or appointment bookings will land here dynamically.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 shadow-2xs rounded-2xl overflow-hidden divide-y divide-gray-150/70">
          {items.map((n) => {
            const isUnread = !n.read;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={`block transition-colors ${
                  isUnread ? "bg-gold/[0.02]" : "bg-white"
                } hover:bg-gray-50/50`}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Icon Indicator */}
                  <div
                    className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border ${
                      n.type === "appointment"
                        ? "bg-emerald-50/70 border-emerald-100/50"
                        : n.type === "prescription"
                        ? "bg-amber-50/70 border-amber-100/50"
                        : "bg-navy/5 border-navy/10"
                    }`}
                  >
                    {ICONS[n.type]}
                  </div>

                  {/* Context Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className={`text-xs font-bold text-navy ${isUnread ? "font-extrabold" : ""}`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 shrink-0">
                        {formatRelative(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">
                      {n.body}
                    </p>
                    
                    {/* Badge details */}
                    {isUnread && (
                      <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-extrabold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/15 mt-2">
                        New update
                      </span>
                    )}
                  </div>

                  {/* Pulse bullet indicator on the far right */}
                  {isUnread && (
                    <div className="self-center shrink-0 ml-2">
                      <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
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
