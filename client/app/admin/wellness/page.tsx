"use client";

import { useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { Heart, Flame, RefreshCw, CheckCircle2, XCircle, Trophy, TrendingUp, Users, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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

function HabitDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
      {done ? (
        <div className="flex items-center gap-1.5 text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#D1FAE5]">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Done</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[#94A3B8] bg-[#F8FAFC] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
          <XCircle className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Missed</span>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ value, max, size = 56, stroke = 5, color = "#C9A84C" }: {
  value: number; max: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / Math.max(max, 1), 1) * circ;
  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 shrink-0 drop-shadow-sm transition-transform duration-500 group-hover:scale-105">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-extrabold text-[#0A1628] leading-none">{value}</span>
        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider border-t border-[#E2E8F0] pt-0.5 mt-0.5 w-6 text-center">of {max}</span>
      </div>
    </div>
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
    <div className="min-h-full flex flex-col bg-[#F4F7FB] w-full font-inter select-none">
      
      {/* ── LUXURY HEADER ── */}
      <div className="bg-white px-4 md:px-6 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-sm md:text-base font-bold text-[#0A1628] tracking-tight font-serif leading-none truncate">Wellness Monitor</h1>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button onClick={refetch} className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md hover:bg-[#F1F5F9] transition-all flex items-center justify-center text-[#475569] hover:text-[#0A1628]">
              <RefreshCw className={cn("w-3 h-3 md:w-3.5 md:h-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 md:px-6 py-3 flex items-center z-30 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.02)] w-full sticky top-[52px] md:top-[56px]">
        <div className="relative w-full max-w-7xl mx-auto">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full h-[36px] pl-9 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#0A1628] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/30 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        
        {/* ── PATIENT GRID ── */}
        {loading && entries.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[220px] bg-gray-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[#E2E8F0] rounded-3xl bg-white p-16 text-center space-y-4 shadow-sm max-w-2xl mx-auto mt-12">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Heart className="w-10 h-10 text-rose-300" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#0A1628]">No wellness data yet</h3>
            <p className="text-[#64748B] text-[15px] leading-relaxed">
              Patients who use the Hollyhill Dental mobile application or Wellness Hub portal will appear here once they log their daily oral care habits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((entry) => {
              const name = [entry.firstName, entry.lastName].filter(Boolean).join(" ") || entry.email || "Unknown Patient";
              const initial = name[0]?.toUpperCase() || "P";
              const isToday = entry.date === today;
              const allDone = entry.morningBrush && entry.nightBrush && entry.floss;
              const score = [entry.morningBrush, entry.nightBrush, entry.floss].filter(Boolean).length;
              const lastSeen = new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const isHotStreak = entry.streak >= 3;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "bg-white rounded-3xl p-6 border transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 relative overflow-hidden group flex flex-col justify-between",
                    isToday && allDone ? "border-[#10B981]/30 shadow-[0_4px_20px_rgba(16,185,129,0.05)]" :
                    isToday ? "border-[#C9A84C]/30 shadow-sm" :
                    "border-[#E2E8F0] shadow-sm"
                  )}
                >
                  {/* Background gradient if perfect */}
                  {isToday && allDone && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ECFDF5]/50 to-transparent pointer-events-none" />
                  )}

                  <div className="relative z-10 space-y-5">
                    {/* Top Row: Avatar & Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#0A1628] text-[#C9A84C] flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[15px] font-bold text-[#0A1628] truncate group-hover:text-[#C9A84C] transition-colors">{name}</span>
                          <span className="block text-xs text-[#94A3B8] truncate">{entry.email || "No email"}</span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 pt-1">
                        {isHotStreak ? (
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-1 rounded-full shadow-sm text-white animate-fade-up">
                            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">{entry.streak} Day</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 rounded-full">
                            <TrendingUp className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{entry.streak} Day</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Ring & Checkboxes */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#F1F5F9] flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <HabitDot done={entry.morningBrush} label="Morning Brush" />
                        <HabitDot done={entry.nightBrush} label="Night Brush" />
                        <HabitDot done={entry.floss} label="Floss" />
                      </div>
                      <div className="shrink-0 mr-1">
                        <ProgressRing value={score} max={3} color={allDone ? "#10B981" : "#C9A84C"} />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="relative z-10 flex items-center justify-between mt-5 pt-4 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                      <Calendar className="w-3.5 h-3.5" />
                      {isToday ? "Logged Today" : "Not Logged Today"}
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-medium font-mono">
                      Synced {lastSeen}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, theme, animateIcon = false }: {
  icon: any; label: string; value: string | number; theme: "blue" | "emerald" | "orange" | "gold"; animateIcon?: boolean;
}) {
  const themes = {
    blue: { bg: "bg-[#EFF6FF]", border: "border-[#DBEAFE]", text: "text-[#3B82F6]", iconBg: "bg-[#3B82F6]" },
    emerald: { bg: "bg-[#ECFDF5]", border: "border-[#D1FAE5]", text: "text-[#10B981]", iconBg: "bg-[#10B981]" },
    orange: { bg: "bg-[#FFF7ED]", border: "border-[#FFEDD5]", text: "text-[#F97316]", iconBg: "bg-[#F97316]" },
    gold: { bg: "bg-[#FDFBF7]", border: "border-[#F1E8D1]", text: "text-[#C9A84C]", iconBg: "bg-[#C9A84C]" },
  };
  const t = themes[theme];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
      <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40", t.iconBg)} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border transition-colors shadow-sm", t.bg, t.border)}>
          <Icon className={cn("w-6 h-6", t.text, animateIcon && "animate-pulse")} />
        </div>
      </div>
      <h3 className="text-[#64748B] font-bold text-[11px] uppercase tracking-wider mb-1">{label}</h3>
      <p className="text-3xl font-extrabold text-[#0A1628] group-hover:text-[#C9A84C] transition-colors font-serif">{value}</p>
    </div>
  );
}
