"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import { CalendarDays, MessageSquare, ChevronRight, Bell, ClipboardCheck, ShieldCheck, ClipboardList, Receipt, Activity, Clock, Calendar, AlertTriangle, ArrowRight, Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/utils";

function normalizeArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.appointments)) return raw.appointments;
  if (Array.isArray(raw?.messages)) return raw.messages;
  return [];
}

export default function PatientDashboardPage() {
  const { user } = useAuthStore();
  const patientId = user?.patientProfile?.id;

  const { data: appointments = [], loading: lAppts } = useLiveData<any[]>(
    "/appointments/my",
    {
      intervalMs: 30000,
      select: (raw) => normalizeArray<any>(raw),
      initialData: [],
    }
  );

  const { data: messages = [], loading: lMsgs } = useLiveData<any[]>(
    patientId ? `/messages/${patientId}` : null,
    {
      intervalMs: 15000,
      select: (raw) => normalizeArray<any>(raw),
      initialData: [],
    }
  );

  const loading = lAppts || lMsgs;

  const nextAppt = useMemo(
    () =>
      [...appointments]
        .filter((a) => a?.status === "confirmed" || a?.status === "pending")
        .sort(
          (a, b) =>
            new Date(
              `${a.appointmentDate}T${a.appointmentTime || "00:00"}`
            ).getTime() -
            new Date(
              `${b.appointmentDate}T${b.appointmentTime || "00:00"}`
            ).getTime()
        )[0],
    [appointments]
  );

  const pendingCount = useMemo(
    () => appointments.filter((a) => a?.status === "pending").length,
    [appointments]
  );

  const unreadCount = useMemo(
    () =>
      messages.filter((m) => m?.senderRole === "admin" && !m?.isRead).length,
    [messages]
  );

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.patientProfile?.firstName || "there";

  return (
    <div className="space-y-6 pb-12 select-none max-w-7xl mx-auto px-1">
      
      {/* ── Welcome Premium Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-blue-950 p-6 md:p-8 text-white shadow-xl border border-white/5">
        {/* Glowing glassmorphism accent shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-extrabold uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Patient Dental Workspace
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white mt-1">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-gray-300 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
              Welcome back to your Hollyhill Dental portal. Explore checkup diagnostics, manage slots, and secure chat logs directly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Clock / Calendar module */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs font-semibold flex flex-col items-start gap-1">
              <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Clinic Calendar</span>
              <div className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-gold animate-pulse" />
                <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <span className="text-[10px] text-gold/80 font-bold uppercase tracking-wider">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            {/* Notifications Hub */}
            <Link
              href="/portal/notifications"
              className="relative w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center transition-colors group shrink-0"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-300 group-hover:text-gold transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-navy animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Visual Navigation Dashboard Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { name: "Dental Chart", href: "/portal/chart", desc: "Teeth health & diagnostic files", icon: ClipboardList, bg: "bg-teal-50 text-teal-600 border-teal-100" },
          { name: "Request Visit", href: "/portal/booking", desc: "Submit slot check-in requests", icon: CalendarDays, bg: "bg-gold/10 text-gold-dark border-gold/25" },
          { name: "Message Clinic", href: "/portal/messages", desc: "Direct chat with dentist", icon: MessageSquare, bg: "bg-navy/5 text-navy border-navy/10" },
          { name: "My Bookings", href: "/portal/appointments", desc: pendingCount > 0 ? `${pendingCount} awaiting approval` : "All slots approved", icon: ClipboardCheck, bg: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { name: "Prescriptions", href: "/portal/prescriptions", desc: "View medical script files", icon: ClipboardList, bg: "bg-amber-50 text-amber-600 border-amber-100" },
          { name: "Invoices", href: "/portal/invoices", desc: "Receipt & billing balance", icon: Receipt, bg: "bg-violet-50 text-violet-600 border-violet-100" }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group border border-gray-250/50 bg-white hover:border-gold hover:shadow-md rounded-2xl p-4.5 transition-all duration-300 flex items-center justify-between hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 border ${item.bg}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-navy truncate group-hover:text-gold transition-colors">
                    {item.name}
                  </span>
                  <span className="block text-[9px] text-gray-400 mt-0.5 truncate">
                    {item.desc}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* ── Main Workspace split ── */}
      {loading && appointments.length === 0 ? (
        <div className="h-[240px] shimmer rounded-3xl w-full bg-white border border-gray-100" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Workspace Workspace (Columns 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Scheduled Visit card */}
            <div className="border border-gray-200/60 bg-white rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h3 className="font-serif text-base font-extrabold text-navy">
                    Next Scheduled Visit
                  </h3>
                  <Calendar className="w-4.5 h-4.5 text-gold" />
                </div>

                {nextAppt ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/15">
                          <Stethoscope className="w-3 h-3 text-gold" />
                          {String(nextAppt.serviceId || "appointment").replace(/-/g, " ")}
                        </span>
                        <h4 className="font-serif text-xl sm:text-2xl font-bold text-navy tracking-tight mt-1">
                          {formatDate(nextAppt.appointmentDate)} &bull; {nextAppt.appointmentTime}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                          Assigned Dentist: <span className="text-navy font-bold">Dr. Roghay Alizadeh</span>
                        </p>
                      </div>
                      
                      <span
                        className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                          nextAppt.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                            : "bg-amber-50 text-amber-700 border-amber-150"
                        }`}
                      >
                        {nextAppt.status === "pending"
                          ? "Awaiting confirmation"
                          : nextAppt.status}
                      </span>
                    </div>

                    <div className="flex gap-4 border-t border-gray-50 pt-4 text-xs font-bold">
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                          (nextAppt.serviceId || "Dental checkup") + " - Hollyhill Shopping Centre"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy hover:text-gold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        Add to Google Calendar
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4 max-w-sm mx-auto">
                    <p className="text-xs text-gray-400 font-medium">
                      You don't have any upcoming diagnostic checkups or appointments scheduled yet.
                    </p>
                    <Link
                      href="/portal/booking"
                      className="bg-gold hover:bg-yellow-400 text-navy text-xs font-bold py-2.5 px-6 rounded-xl inline-flex items-center gap-1.5 shadow transition-colors"
                    >
                      Book A Treatment <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Visit Ledger */}
            {appointments.length > 1 && (
              <div className="border border-gray-200/60 bg-white rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif text-sm font-extrabold text-navy border-b border-gray-50 pb-2">
                  Recent Request Ledger
                </h3>
                <div className="space-y-3.5 text-xs text-navy font-bold">
                  {appointments.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      className="flex justify-between items-center border-b border-gray-50 pb-2.5 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <span className="block text-navy uppercase text-[10px] tracking-wide">
                          {String(appt.serviceId || "appointment").replace(/-/g, " ")}
                        </span>
                        <span className="block text-[9px] text-gray-400 font-medium">
                          {formatDate(appt.appointmentDate)}
                        </span>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                        appt.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                          : appt.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-150"
                          : "bg-gray-50 text-gray-500 border-gray-150"
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Clinical Telemetry & Alerts) */}
          <div className="space-y-6">
            
            {/* Status overview */}
            <div className="border border-gray-200/60 bg-white rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between min-h-[220px]">
              <div className="border-b border-gray-50 pb-2 shrink-0">
                <h3 className="font-serif text-base font-extrabold text-navy">
                  Booking Status
                </h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center my-3">
                {pendingCount > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                        <ClipboardCheck className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-extrabold text-navy">
                          {pendingCount} Pending Requests
                        </span>
                        <span className="block text-[10px] text-gray-400 font-medium leading-relaxed mt-0.5">
                          Dr. Roghay is reviewing your requested time slot. An confirmation alert will arrive shortly.
                        </span>
                      </div>
                    </div>
                    
                    <Link
                      href="/portal/appointments"
                      className="w-full bg-navy hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md block text-center uppercase tracking-wider transition-colors"
                    >
                      View requested slots
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-extrabold text-navy">
                          Operations Synced
                        </span>
                        <span className="block text-[10px] text-gray-400 font-medium leading-relaxed mt-0.5">
                          You have no pending visit requests currently. All files are fully updated.
                        </span>
                      </div>
                    </div>
                    
                    <Link
                      href="/portal/booking"
                      className="w-full border border-navy/20 hover:border-navy text-navy font-bold py-2.5 rounded-xl text-xs block text-center transition-all cursor-pointer"
                    >
                      Request visit slot
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor alerts */}
            {unreadCount > 0 && (
              <div className="border border-red-150 bg-red-50/20 rounded-3xl p-5 shadow-2xs space-y-3 relative overflow-hidden animate-fade-up">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full pointer-events-none" />
                <h4 className="font-serif text-xs font-bold text-red-700 flex items-center gap-1.5 relative">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Clinic Telemetry Alert
                </h4>
                <p className="text-gray-500 text-[11px] leading-relaxed font-semibold relative">
                  You have <span className="text-red-600 font-extrabold">{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</span> from Dr. Roghay Alizadeh awaiting your clinical review.
                </p>
                <Link
                  href="/portal/messages"
                  className="text-[10px] font-extrabold text-gold hover:text-gold-dark hover:underline flex items-center gap-0.5 uppercase tracking-wider relative pt-1"
                >
                  Open Secure chat <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
