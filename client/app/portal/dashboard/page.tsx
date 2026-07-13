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

  const { data: invoices = [], loading: lInvoices } = useLiveData<any[]>(
    "/billing/invoices/my",
    {
      intervalMs: 60000,
      select: (raw) => normalizeArray<any>(raw),
      initialData: [],
    }
  );

  const pendingInvoices = useMemo(
    () => invoices.filter((inv) => inv?.status === "pending"),
    [invoices]
  );

  const loading = lAppts || lMsgs || lInvoices;

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
    <div className="space-y-6 pb-12 select-none max-w-7xl mr-auto px-1 xl:px-4">
      
      {/* ── Welcome Premium Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0A1628] p-6 md:p-8 text-white shadow-lg border border-gray-800">
        {/* Subtle glowing accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#009BDE]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#009BDE] text-[10px] font-bold uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" /> Patient Dental Workspace
            </div>
            <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-white mt-1.5">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-gray-400 text-xs md:text-sm font-medium max-w-2xl leading-relaxed mt-1">
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

      {/* ── Pending Billing Alert ── */}
      {pendingInvoices.length > 0 && (
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-full opacity-30 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-red-900 text-base md:text-lg">
                Action Required: Outstanding Balance
              </h3>
              <p className="text-[13px] text-red-700 font-medium mt-0.5">
                You currently have {pendingInvoices.length} pending bill{pendingInvoices.length > 1 ? "s" : ""} requiring payment.
              </p>
            </div>
          </div>
          <Link
            href="/portal/invoices"
            className="w-full md:w-auto shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors relative z-10 shadow-sm"
          >
            View Statement <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Visual Navigation Dashboard Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5">
        {[
          { name: "Dental Chart", href: "/portal/chart", desc: "Teeth health & diagnostic files", icon: ClipboardList },
          { name: "Request Visit", href: "/portal/booking", desc: "Submit slot check-in requests", icon: CalendarDays },
          { name: "Message Clinic", href: "/portal/messages", desc: "Direct chat with dentist", icon: MessageSquare },
          { name: "My Bookings", href: "/portal/appointments", desc: pendingCount > 0 ? `${pendingCount} awaiting approval` : "All slots approved", icon: ClipboardCheck },
          { name: "Prescriptions", href: "/portal/prescriptions", desc: "View medical script files", icon: ClipboardList },
          { name: "Invoices", href: "/portal/invoices", desc: "Receipt & billing balance", icon: Receipt }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group border border-gray-100/80 bg-white hover:bg-[#F4FBFF] shadow-sm hover:shadow-md hover:border-[#D2EAF8] rounded-2xl md:rounded-3xl p-4 md:p-5 transition-all duration-300 flex flex-col md:flex-row items-center text-center md:text-left md:justify-between gap-3 md:gap-0 hover:-translate-y-0.5"
            >
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 min-w-0 w-full">
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#F4FBFF] border border-[#E4F4FD] group-hover:bg-white group-hover:border-[#D2EAF8] transition-colors">
                  <Icon className="w-5 h-5 md:w-4.5 md:h-4.5 text-[#009BDE]" />
                </div>
                <div className="truncate w-full">
                  <span className="block text-xs md:text-[13px] font-bold text-navy truncate transition-colors">
                    {item.name}
                  </span>
                  <span className="block text-[9px] md:text-[10px] text-gray-500 mt-1 md:mt-0.5 truncate md:whitespace-normal line-clamp-1 md:line-clamp-none font-medium">
                    {item.desc}
                  </span>
                </div>
              </div>
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
            <div className="bg-white rounded-3xl p-7 shadow-[0_4px_24px_rgba(5,38,78,0.04)] border border-gray-100/80 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#F4FBFF] to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="space-y-5 relative">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="font-serif text-lg font-bold text-navy">
                    Next Scheduled Visit
                  </h3>
                  <Calendar className="w-5 h-5 text-[#009BDE]" />
                </div>

                {nextAppt ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#009BDE] bg-[#F4FBFF] px-3 py-1 rounded-full">
                          <Stethoscope className="w-3 h-3 text-[#009BDE]" />
                          {String(nextAppt.serviceId || "appointment").replace(/-/g, " ")}
                        </span>
                        <h4 className="font-serif text-2xl font-bold text-navy tracking-tight mt-1">
                          {formatDate(nextAppt.appointmentDate)} &bull; {nextAppt.appointmentTime}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Assigned Dentist: <span className="text-navy font-bold">Dr. Roghay Alizadeh</span>
                        </p>
                      </div>
                      
                      <span
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0 tracking-wide uppercase ${
                          nextAppt.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {nextAppt.status === "pending"
                          ? "Awaiting confirmation"
                          : nextAppt.status}
                      </span>
                    </div>

                    <div className="flex gap-4 border-t border-gray-50 pt-4 text-[13px] font-bold">
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                          (nextAppt.serviceId || "Dental checkup") + " - Hollyhill Shopping Centre"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy hover:text-[#009BDE] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        Add to Google Calendar
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4 max-w-sm mx-auto">
                    <p className="text-[13px] text-gray-500 font-medium">
                      You don't have any upcoming diagnostic checkups or appointments scheduled yet.
                    </p>
                    <Link
                      href="/portal/booking"
                      className="bg-[#009BDE] hover:bg-[#008BCC] text-white text-[13px] font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors"
                    >
                      Book A Treatment <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Visit Ledger */}
            {appointments.length > 1 && (
              <div className="bg-white rounded-3xl p-7 shadow-[0_4px_24px_rgba(5,38,78,0.04)] border border-gray-100/80 space-y-4">
                <h3 className="font-serif text-lg font-bold text-navy border-b border-gray-50 pb-3">
                  Recent Request Ledger
                </h3>
                <div className="space-y-4 text-[13px] text-navy font-bold">
                  {appointments.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <span className="block text-navy uppercase text-[11px] tracking-wide">
                          {String(appt.serviceId || "appointment").replace(/-/g, " ")}
                        </span>
                        <span className="block text-[11px] text-gray-500 font-medium">
                          {formatDate(appt.appointmentDate)}
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${
                        appt.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : appt.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-50 text-gray-600"
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
            <div className="bg-white rounded-3xl p-7 shadow-[0_4px_24px_rgba(5,38,78,0.04)] border border-gray-100/80 space-y-4 flex flex-col justify-between min-h-[220px]">
              <div className="border-b border-gray-50 pb-3 shrink-0">
                <h3 className="font-serif text-lg font-bold text-navy">
                  Booking Status
                </h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center my-3">
                {pendingCount > 0 ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[15px] font-bold text-navy">
                          {pendingCount} Pending Requests
                        </span>
                        <span className="block text-[11px] text-gray-500 font-medium leading-relaxed mt-1">
                          Dr. Roghay is reviewing your requested time slot. A confirmation alert will arrive shortly.
                        </span>
                      </div>
                    </div>
                    
                    <Link
                      href="/portal/appointments"
                      className="w-full bg-navy hover:bg-[#1A2E46] text-white font-bold py-3.5 rounded-xl text-[13px] shadow-sm block text-center transition-colors"
                    >
                      View requested slots
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[15px] font-bold text-navy">
                          Operations Synced
                        </span>
                        <span className="block text-[11px] text-gray-500 font-medium leading-relaxed mt-1">
                          You have no pending visit requests currently. All files are fully updated.
                        </span>
                      </div>
                    </div>
                    
                    <Link
                      href="/portal/booking"
                      className="w-full border border-gray-200 hover:border-[#009BDE] hover:bg-[#F4FBFF] text-navy font-bold py-3.5 rounded-xl text-[13px] block text-center transition-all cursor-pointer"
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
