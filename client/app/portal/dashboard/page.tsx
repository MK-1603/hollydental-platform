"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import { CalendarDays, MessageSquare, ChevronRight, Bell, ClipboardCheck, ClipboardList, Receipt, Activity, Clock, AlertTriangle, ArrowRight, Stethoscope, ShieldCheck } from "lucide-react";
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
    <div className="space-y-6 pb-12 select-none max-w-7xl mx-auto px-1 xl:px-4">
      
      {/* ── Welcome Light Luxury Header ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-white p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
            <Activity className="w-3.5 h-3.5" /> Patient Portal
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-1.5">
            {getGreeting()}, <span className="text-[#009BDE]">{firstName}</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium max-w-2xl leading-relaxed mt-1">
            Welcome back to your Hollyhill Dental portal. Everything you need to manage your smile is right here.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          {/* Live Clock / Calendar module */}
          <div className="bg-gray-50 rounded-[16px] p-4 border border-gray-100 text-xs font-semibold flex flex-col items-start gap-1">
            <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Today</span>
            <div className="text-gray-900 font-bold flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#009BDE]" />
              <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          {/* Notifications Hub */}
          <Link
            href="/portal/notifications"
            className="relative w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-[16px] border border-gray-100 flex items-center justify-center transition-colors group shrink-0"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Highlight Area (Alerts & Next Visit) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Next Visit Card */}
        {nextAppt ? (
          <div className="bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Next Visit</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${nextAppt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {nextAppt.status}
              </span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-blue-700 shrink-0">
                <span className="text-[10px] font-bold uppercase">{new Date(nextAppt.appointmentDate).toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="text-xl font-black leading-none mt-0.5">{new Date(nextAppt.appointmentDate).getDate()}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{nextAppt.treatmentType || "Dental Appointment"}</h4>
                <div className="flex items-center gap-3 text-[13px] font-medium text-gray-500 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {nextAppt.appointmentTime || "TBD"}
                  </div>
                  {nextAppt.doctorName && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      Dr. {nextAppt.doctorName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-[20px] p-6 flex flex-col items-center justify-center text-center">
            <CalendarDays className="w-8 h-8 text-gray-300 mb-3" />
            <h3 className="text-[14px] font-bold text-gray-900">No Upcoming Visits</h3>
            <p className="text-[12px] text-gray-500 mt-1 max-w-[250px]">You don't have any appointments scheduled at the moment.</p>
            <Link href="/portal/appointments" className="mt-4 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-bold rounded-lg transition-colors border border-gray-100">
              Book an Appointment
            </Link>
          </div>
        )}

        {/* Pending Billing Alert */}
        {pendingInvoices.length > 0 ? (
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-[20px] p-6 shadow-sm flex flex-col justify-center">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100/50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-amber-900 text-lg">
                  Outstanding Balance
                </h3>
                <p className="text-[13px] text-amber-700/80 font-medium mt-0.5">
                  You have {pendingInvoices.length} pending bill{pendingInvoices.length > 1 ? "s" : ""} that require your attention.
                </p>
                <Link
                  href="/portal/invoices"
                  className="inline-flex items-center gap-2 mt-3 text-[13px] font-bold text-amber-700 hover:text-amber-800 transition-colors"
                >
                  View Statement <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-[20px] p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-100/50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-[14px] font-bold text-emerald-900">Account Up to Date</h3>
            <p className="text-[12px] text-emerald-700/80 mt-1">You have no outstanding invoices to pay.</p>
          </div>
        )}

      </div>

      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1 pt-2">Quick Access</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[
          { name: "Dental Chart", href: "/portal/chart", desc: "Teeth & diagnostics", icon: ClipboardList },
          { name: "Request Visit", href: "/portal/appointments", desc: "Book a slot", icon: CalendarDays },
          { name: "Message Clinic", href: "/portal/messages", desc: "Direct chat", icon: MessageSquare },
          { name: "My Bookings", href: "/portal/appointments", desc: pendingCount > 0 ? `${pendingCount} awaiting` : "View history", icon: ClipboardCheck },
          { name: "Prescriptions", href: "/portal/prescriptions", desc: "Medical scripts", icon: ClipboardList },
          { name: "Invoices", href: "/portal/invoices", desc: "Billing & receipts", icon: Receipt }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="group bg-white hover:bg-blue-50/30 border border-gray-100 hover:border-blue-100 rounded-[18px] p-4 md:p-5 transition-all duration-300 flex flex-col md:flex-row items-center text-center md:text-left gap-3 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-[14px] flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-colors text-gray-500 group-hover:text-blue-600">
                  <Icon className="w-5 h-5 md:w-4.5 md:h-4.5" />
                </div>
                <div className="truncate w-full">
                  <span className="block text-[13px] font-bold text-gray-900 truncate transition-colors group-hover:text-blue-900">
                    {item.name}
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-0.5 truncate font-medium">
                    {item.desc}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Status Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Booking Status */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[200px]">
          <div className="border-b border-gray-50 pb-3 shrink-0">
            <h3 className="font-serif text-lg font-bold text-gray-900">
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
                    <span className="block text-[15px] font-bold text-gray-900">
                      {pendingCount} Pending Requests
                    </span>
                    <span className="block text-[11px] text-gray-500 font-medium leading-relaxed mt-1">
                      Our team is reviewing your requested time slot. A confirmation alert will arrive shortly.
                    </span>
                  </div>
                </div>
                
                <Link
                  href="/portal/appointments"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-[13px] shadow-sm block text-center transition-colors"
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
                    <span className="block text-[15px] font-bold text-gray-900">
                      Operations Synced
                    </span>
                    <span className="block text-[11px] text-gray-500 font-medium leading-relaxed mt-1">
                      You have no pending visit requests currently. All files are fully updated.
                    </span>
                  </div>
                </div>
                
                <Link
                  href="/portal/appointments"
                  className="w-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-bold py-3.5 rounded-xl text-[13px] block text-center transition-all cursor-pointer"
                >
                  Request visit slot
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Help / Info Card */}
        <div className="bg-[#F8FBFC] rounded-[20px] p-6 shadow-sm border border-blue-100/50 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none transition-colors" />
          
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-5 relative z-10">
            <Stethoscope className="w-6 h-6 text-[#009BDE]" />
          </div>
          
          <h3 className="font-serif font-bold text-xl text-gray-900 mb-2 relative z-10">
            Secure Health Portal
          </h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mb-6 relative z-10">
            Your medical records, X-rays, and treatment plans are encrypted and securely stored. Access them anytime from your files.
          </p>
          
          <Link
            href="/portal/files"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors w-fit relative z-10 group/link"
          >
            Access My Files <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
