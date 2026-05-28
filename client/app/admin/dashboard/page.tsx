"use client";

import { useMemo, useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  Clock,
  ShieldCheck,
  Zap,
  ChevronRight,
  CalendarCheck,
  CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import Link from "next/link";

interface ActivityEvent {
  id: string;
  type: "appointment" | "invoice" | "patient" | string;
  text: string;
  at: string;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function iconFor(type: string) {
  if (type === "invoice") return FileText;
  if (type === "patient") return UserPlus;
  return Calendar;
}

export default function AdminDashboardPage() {
  // Live overview — syncs rapidly every 8 seconds for true real-time feeling.
  const {
    data: stats,
    loading,
    error,
  } = useLiveData<any>("/analytics/overview", {
    intervalMs: 8000,
  });

  // Live activity feed — fast cadence (every 5 seconds) so actions show instantly.
  const { data: activityResp } = useLiveData<{ events: ActivityEvent[] }>(
    "/analytics/activity?limit=8",
    {
      intervalMs: 5000,
      initialData: { events: [] },
    }
  );

  const events = activityResp?.events ?? [];

  const totalAppointmentsToday = Number(stats?.totalAppointmentsToday ?? 0);
  const activePatientsCount = Number(stats?.activePatientsCount ?? 0);
  const monthlyRevenue = Number(stats?.monthlyRevenue ?? 0);
  const pendingInvoices = Number(stats?.pendingInvoices ?? 0);
  
  // Dynamic histories from Server API
  const revenueHistory = Array.isArray(stats?.revenueHistory) ? stats.revenueHistory : [];
  const appointmentHistory = Array.isArray(stats?.appointmentHistory) ? stats.appointmentHistory : [];
  const patientHistory = Array.isArray(stats?.patientHistory) ? stats.patientHistory : [];

  // State for active analytics chart tab
  const [activeTab, setActiveTab] = useState<"revenue" | "appointments" | "patients">("revenue");

  // State for interactive checklist
  const [tasks, setTasks] = useState([
    { id: 1, text: "Verify dental chart backups on Neon server", priority: "High", due: "11:00 AM", completed: true },
    { id: 2, text: "Review and approve pending invoices for walk-ins", priority: "High", due: "1:30 PM", completed: false },
    { id: 3, text: "Approve pending appointment slot requests", priority: "Medium", due: "3:00 PM", completed: false },
    { id: 4, text: "Verify medical stock supplies & order fillers", priority: "Low", due: "End of Day", completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="space-y-6 pb-12 px-1 max-w-7xl mx-auto select-none">
      
      {/* ── Welcome Premium Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-blue-950 p-6 md:p-8 text-white shadow-xl border border-white/5">
        {/* Abstract background glassmorphism shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Clinic Live Operations
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white mt-1">
              Welcome back, Dr. Roghay Alizadeh
            </h1>
            <p className="text-gray-300 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
              Operations at Hollyhill Shopping Centre surgery are fully active and synchronized. You have <span className="text-gold font-bold">{totalAppointmentsToday} scheduled visits</span> today.
            </p>
          </div>
          
          {/* Action Hub quick badges */}
          <div className="flex flex-row md:flex-col items-start gap-2.5 shrink-0 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs font-semibold">
            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Local Time & Date</div>
            <div className="text-white font-bold flex items-center gap-2 mt-0.5">
              <Clock className="w-4 h-4 text-gold animate-pulse" />
              <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-[10px] text-gold/80 font-bold uppercase tracking-wider">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 text-red-700 text-xs p-4.5 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Failed to load live overview statistics:</span>
            <p className="mt-0.5 text-red-600/90 font-medium">{(error as any)?.message || "Verify your database connection."} Fallback statistics are being displayed.</p>
          </div>
        </div>
      )}

      {/* ── Modern Overview Statistics Grid ── */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 shimmer rounded-3xl bg-white border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-32 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
            <div className="flex items-center justify-between relative">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                Today's Visits
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                <Calendar className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-3xl font-serif font-extrabold text-navy leading-none">
                {totalAppointmentsToday}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center border border-emerald-100 animate-pulse">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12%
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-32 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
            <div className="flex items-center justify-between relative">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                Active Patients
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-3xl font-serif font-extrabold text-navy leading-none">
                {activePatientsCount}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center border border-emerald-100 animate-pulse">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4%
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-32 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
            <div className="flex items-center justify-between relative">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                Monthly Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center border border-gold/20">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-3xl font-serif font-extrabold text-navy leading-none">
                &euro;{monthlyRevenue.toLocaleString()}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center border border-emerald-100 animate-pulse">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +8%
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-32 hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
            <div className="flex items-center justify-between relative">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                Pending Invoices
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100/50">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-3xl font-serif font-extrabold text-navy leading-none">
                &euro;{pendingInvoices.toLocaleString()}
              </span>
              <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center border border-red-100 animate-pulse">
                <ArrowDownRight className="w-3 h-3 mr-0.5" /> -2%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Dynamic Analytics Workspace & Chart Tabs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Chart Block */}
        <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs space-y-5 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3 shrink-0">
            <div>
              <h3 className="font-serif text-base font-extrabold text-navy">
                Clinical Analytics Workspace
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">Review metrics, growth indicators and clinic intake cycles.</p>
            </div>
            
            {/* Chart Tab Navigation */}
            <div className="inline-flex p-1 bg-gray-50 border border-gray-200/60 rounded-xl">
              <button
                onClick={() => setActiveTab("revenue")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "revenue" ? "bg-white text-navy shadow-xs border border-gray-200/30" : "text-gray-400 hover:text-navy"}`}
              >
                Revenue Flow
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "appointments" ? "bg-white text-navy shadow-xs border border-gray-200/30" : "text-gray-400 hover:text-navy"}`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("patients")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "patients" ? "bg-white text-navy shadow-xs border border-gray-200/30" : "text-gray-400 hover:text-navy"}`}
              >
                Intake Growth
              </button>
            </div>
          </div>

          {/* CRITICAL: A rigid, non-flex height container is used here to 100% prevent Recharts ResponsiveContainer infinite sizing loop bug */}
          <div className="h-[285px] w-full relative">
            {loading && !stats ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] text-gray-400 font-semibold tracking-wider">Syncing operational data stream...</p>
              </div>
            ) : (
              <>
                {activeTab === "revenue" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#C9A96E" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} stroke="#9CA3AF" tickLine={false} />
                      <YAxis fontSize={10} stroke="#9CA3AF" tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                      <Tooltip formatter={(value) => [`€${value}`, "Revenue"]} contentStyle={{ background: "#0A1628", borderRadius: "12px", border: "none", color: "#FFF", fontSize: "11px", fontWeight: "bold" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeTab === "appointments" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} stroke="#9CA3AF" tickLine={false} />
                      <YAxis fontSize={10} stroke="#9CA3AF" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0A1628", borderRadius: "12px", border: "none", color: "#FFF", fontSize: "11px", fontWeight: "bold" }} />
                      <Bar dataKey="count" fill="#0A1628" radius={[6, 6, 0, 0]} barSize={36}>
                        {appointmentHistory.map((_entry: unknown, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0A1628" : "#C9A96E"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeTab === "patients" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={patientHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} stroke="#9CA3AF" tickLine={false} />
                      <YAxis fontSize={10} stroke="#9CA3AF" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0A1628", borderRadius: "12px", border: "none", color: "#FFF", fontSize: "11px", fontWeight: "bold" }} />
                      <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorPat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Actions Console */}
        <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col h-[400px]">
          <div>
            <h3 className="font-serif text-base font-extrabold text-navy flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" /> Clinical Command Center
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">Quick administrative actions & tools.</p>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-3.5 my-2">
            <Link
              href="/admin/appointments"
              className="flex flex-col items-center justify-center text-center p-4 border border-gray-100 hover:border-navy hover:shadow-xs rounded-2xl group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 border border-blue-100/50 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Manage Visit</span>
              <span className="text-[9px] text-gray-400 mt-0.5">Check-in walk-in</span>
            </Link>

            <Link
              href="/admin/ai"
              className="flex flex-col items-center justify-center text-center p-4 border border-gray-100 hover:border-gold hover:shadow-xs rounded-2xl group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-2.5 border border-gold/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Clinical AI</span>
              <span className="text-[9px] text-gold font-bold mt-0.5">Gemini Assist</span>
            </Link>

            <Link
              href="/admin/billing"
              className="flex flex-col items-center justify-center text-center p-4 border border-gray-100 hover:border-navy hover:shadow-xs rounded-2xl group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 border border-emerald-100/50 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Create Invoice</span>
              <span className="text-[9px] text-gray-400 mt-0.5">Issue payment bill</span>
            </Link>

            <Link
              href="/admin/messages"
              className="flex flex-col items-center justify-center text-center p-4 border border-gray-100 hover:border-navy hover:shadow-xs rounded-2xl group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2.5 border border-violet-100/50 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-navy">Broadcast</span>
              <span className="text-[9px] text-gray-400 mt-0.5">Alert patients</span>
            </Link>
          </div>

          <div className="bg-navy rounded-2xl p-3 border border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-[10px] text-white font-bold">System Guard</p>
                <p className="text-[8px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                  Protected by SSL & Drizzle
                </p>
              </div>
            </div>
            <Link href="/admin/activity" className="text-[9px] text-gold hover:text-yellow-400 font-extrabold flex items-center gap-0.5 uppercase tracking-wider">
              Logs <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Activity Feed & Dental Daily Checklists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Ticker Ledger */}
        <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs space-y-4 lg:col-span-2 flex flex-col h-[340px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 shrink-0">
            <div>
              <h3 className="font-serif text-base font-extrabold text-navy">
                Operations Ledger
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">Real-time chronicle of clinic visits, check-ins, and payments.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sync Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
            {events.length === 0 ? (
              <div className="text-xs text-gray-400 py-12 text-center flex flex-col items-center justify-center gap-2">
                <Activity className="w-6 h-6 text-gray-300" />
                <p className="font-bold text-navy text-xs">Waiting for clinical events...</p>
                <p className="text-[10px] text-gray-400">Incoming bookings or invoice activities will instantly reflect here.</p>
              </div>
            ) : (
              events.map((evt) => {
                const Icon = iconFor(evt.type);
                return (
                  <div
                    key={evt.id}
                    className="flex items-center gap-3.5 p-3 rounded-xl border border-gray-50 bg-gray-50/20 hover:bg-gray-50/70 transition-colors duration-200"
                  >
                    <div className="w-8.5 h-8.5 rounded-xl bg-white border border-gray-100 text-gold flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 text-xs text-navy font-bold truncate">
                      {evt.text}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg shrink-0 font-bold">
                      <Clock className="w-3 h-3" />
                      {formatRelative(evt.at)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dental Checklists */}
        <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col h-[340px]">
          <div className="border-b border-gray-100 pb-2 shrink-0">
            <h3 className="font-serif text-base font-extrabold text-navy">Daily Audit Alerts</h3>
            <p className="text-[11px] text-gray-400 font-medium">Dental clinic standard SOP checklists.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex items-start gap-2.5 p-2 rounded-xl border border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-all select-none"
              >
                <div className="mt-0.5 text-emerald-500 hover:text-emerald-600 transition-colors shrink-0">
                  <CheckCircle2 className={`w-4.5 h-4.5 transition-all duration-200 ${t.completed ? "text-emerald-500 fill-emerald-50 scale-110" : "text-gray-300 scale-100"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold leading-tight transition-all duration-200 ${t.completed ? "text-gray-400 line-through" : "text-navy"}`}>
                    {t.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${t.priority === "High" ? "bg-red-50 text-red-600 border border-red-100" : t.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                      {t.priority}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due {t.due}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
