"use client";

import { useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { Heart, Flame, RefreshCw, CheckCircle2, XCircle, Trophy, TrendingUp, Users } from "lucide-react";

interface WellnessEntry {
  id: string;
  userId: string;
  patientId: string | null;
  date: string;
  morningBrush: boolean;
  nightBrush: boolean;
  floss: boolean;
  streak: number;
  longestStreak: number;
  updatedAt: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

function normalize(raw: any): WellnessEntry[] {
  if (Array.isArray(raw)) return raw;
  return [];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function HabitDot({ done }: { done: boolean }) {
  return done
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : <XCircle className="w-4 h-4 text-gray-200" />;
}

function ProgressRing({ value, max, size = 44, stroke = 4, color = "#C9A84C" }: {
  value: number; max: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / Math.max(max, 1), 1) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

export default function AdminWellnessPage() {
  const today = todayKey();
  const [search, setSearch] = useState("");

  const { data: entries = [], loading, refetch } = useLiveData<WellnessEntry[]>(
    "/wellness/admin",
    { intervalMs: 15000, select: normalize, initialData: [] }
  );

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const name = `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (e.email || "").toLowerCase().includes(search.toLowerCase());
  });

  const todayEntries = entries.filter((e) => e.date === today);
  const completedToday = todayEntries.filter((e) => e.morningBrush && e.nightBrush && e.floss).length;
  const activeStreaks = entries.filter((e) => e.streak >= 3).length;
  const topStreak = entries.reduce((max, e) => Math.max(max, e.streak), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" /> Wellness Monitor
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Real-time patient oral care habit tracking. Auto-refreshes every 15s.
          </p>
        </div>
        <button
          onClick={refetch}
          className="border border-gray-200 hover:border-gold hover:text-gold text-navy font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Users className="w-5 h-5 text-navy" />}
          label="Total Patients Tracked"
          value={entries.length}
          bg="bg-navy/5"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          label="Completed All Habits Today"
          value={completedToday}
          bg="bg-emerald-50"
        />
        <SummaryCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="Active Streaks (3+ days)"
          value={activeStreaks}
          bg="bg-orange-50"
        />
        <SummaryCard
          icon={<Trophy className="w-5 h-5 text-gold" />}
          label="Longest Current Streak"
          value={`${topStreak} days`}
          bg="bg-gold/10"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient name or email…"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-navy placeholder:text-gray-400 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Patient grid */}
      {loading && entries.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[160px] shimmer rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl bg-white p-12 text-center space-y-3">
          <Heart className="w-10 h-10 text-gray-200 mx-auto" />
          <h3 className="font-serif text-sm font-semibold text-navy">No wellness data yet</h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
            Patients who use the Wellness Hub will appear here once they log their first habit.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((entry) => {
            const name = [entry.firstName, entry.lastName].filter(Boolean).join(" ") || entry.email || "Unknown Patient";
            const initial = name[0]?.toUpperCase() || "P";
            const isToday = entry.date === today;
            const allDone = entry.morningBrush && entry.nightBrush && entry.floss;
            const score = [entry.morningBrush, entry.nightBrush, entry.floss].filter(Boolean).length;
            const lastSeen = new Date(entry.updatedAt).toLocaleString("en-IE", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            });

            return (
              <div
                key={entry.id}
                className={`border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all space-y-4 ${
                  isToday && allDone ? "border-emerald-200 bg-emerald-50/30" :
                  isToday ? "border-gold/30 bg-gold/5" :
                  "border-gray-100"
                }`}
              >
                {/* Top row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-gold flex items-center justify-center font-bold text-sm shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-navy truncate">{name}</span>
                    <span className="block text-[10px] text-gray-400 truncate">{entry.email || "—"}</span>
                  </div>
                  {isToday && allDone && (
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      ✓ Today
                    </span>
                  )}
                  {!isToday && (
                    <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      No log today
                    </span>
                  )}
                </div>

                {/* Habits + ring */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-navy font-semibold">
                      <HabitDot done={entry.morningBrush} /> Morning Brush
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-navy font-semibold">
                      <HabitDot done={entry.nightBrush} /> Night Brush
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-navy font-semibold">
                      <HabitDot done={entry.floss} /> Floss
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 relative">
                    <ProgressRing value={score} max={3} size={52} stroke={5} color={allDone ? "#34D399" : "#C9A84C"} />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-navy">{score}/3</span>
                  </div>
                </div>

                {/* Streak row */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-navy">{entry.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[10px] text-gray-500 font-semibold">Best: {entry.longestStreak}d</span>
                  </div>
                </div>

                <p className="text-[9px] text-gray-400">Last synced: {lastSeen}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string | number; bg: string;
}) {
  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <span className="block text-lg font-bold text-navy">{value}</span>
        <span className="block text-[10px] text-gray-400 leading-tight">{label}</span>
      </div>
    </div>
  );
}
