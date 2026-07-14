"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import {
  CalendarDays,
  MessageSquare,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Receipt,
  Activity,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCircle2,
  CheckCircle2,
  HeartPulse,
  FolderOpen,
  Lock,
  FileText,
  AlertCircle,
  Headset,
  ChevronRight
} from "lucide-react";
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
  const patientProfile = user?.patientProfile;
  const patientId = patientProfile?.id;

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

  const totalBalance = useMemo(
    () => pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    [pendingInvoices]
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

  const pastAppts = useMemo(
    () =>
      [...appointments]
        .filter((a) => a?.status === "completed" || a?.status === "cancelled")
        .sort(
          (a, b) =>
            new Date(
              `${b.appointmentDate}T${b.appointmentTime || "00:00"}`
            ).getTime() -
            new Date(
              `${a.appointmentDate}T${a.appointmentTime || "00:00"}`
            ).getTime()
        ),
    [appointments]
  );

  const recentActivity = useMemo(() => {
    const activities: any[] = [];
    pastAppts.slice(0, 3).forEach(appt => {
      activities.push({
        title: appt.status === "completed" ? "Appointment Completed" : "Appointment Cancelled",
        desc: appt.treatmentType || "Routine Checkup",
        date: formatDate(appt.appointmentDate),
        time: appt.appointmentTime || "",
        icon: appt.status === "completed" ? CheckCircle2 : AlertCircle,
        color: appt.status === "completed" ? "text-emerald-500" : "text-rose-500",
        bg: appt.status === "completed" ? "bg-emerald-50" : "bg-rose-50",
        timestamp: new Date(`${appt.appointmentDate}T${appt.appointmentTime || "00:00"}`).getTime()
      });
    });
    const paidInvoices = invoices.filter(inv => inv.status === "paid" || inv.status === "completed");
    paidInvoices.slice(0, 3).forEach(inv => {
      activities.push({
        title: "Payment Received",
        desc: `Payment of $${inv.amount || '0.00'}`,
        date: formatDate(inv.createdAt),
        time: "",
        icon: Receipt,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        timestamp: new Date(inv.createdAt).getTime()
      });
    });
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [pastAppts, invoices]);

  const unreadCount = useMemo(
    () =>
      messages.filter((m) => m?.senderRole === "admin" && !m?.isRead).length,
    [messages]
  );

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const firstName = patientProfile?.firstName || "Guest";
  const profileCompleteness = patientProfile?.phone && patientProfile?.dateOfBirth ? "100%" : "92%";
  const hasInsurance = !!(patientProfile as any)?.insuranceProvider;

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-12 select-none px-4 sm:px-6 lg:px-8 py-6 md:py-8 font-sans relative overflow-x-hidden w-full max-w-full">
      <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 relative z-10">

        {/* ── 1. Hero Section ── */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 pb-2">

          {/* Mobile top bar (Menu + Logo + Notifications + Avatar) is typically handled by layout, 
              but we ensure the greeting follows the premium structure. */}

          <div className="space-y-2 pt-2 md:pt-0 relative w-full">
            <h1 className="text-[32px] md:text-[44px] leading-tight font-serif text-[#0F172A]">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-[#64748B] text-[14px] md:text-[15px] font-medium max-w-[240px] md:max-w-none">
              Here's your dental health overview for today.
            </p>

            {/* Optional Tooth Illustration on mobile hero right side */}
            <div className="absolute right-0 top-0 w-24 h-24 opacity-80 pointer-events-none md:hidden bg-gradient-to-b from-transparent to-blue-50/50 rounded-full blur-xl" />
          </div>

          {/* Desktop Right Info */}
          <div className="hidden md:flex items-center gap-5 shrink-0 pt-2">
            <div className="text-right">
              <div className="text-[14px] font-semibold text-[#0F172A]">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-[13px] font-medium text-[#64748B] mt-0.5 flex items-center justify-end gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </header>

        {/* ── 2. Overview Stats Bar (Mobile Optimized) ── */}
        <div className="bg-transparent md:bg-white md:rounded-[24px] md:p-6 md:shadow-[0_4px_20px_rgba(15,23,42,0.04)] md:border md:border-[#0F172A]/[0.06] flex flex-col xl:flex-row xl:items-center justify-between gap-6 xl:gap-8">

          <div className="flex flex-row justify-between md:grid md:grid-cols-4 gap-2 md:gap-6 flex-1 md:divide-x md:divide-[#0F172A]/[0.04] w-full">

            {/* Profile Complete */}
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 md:px-4 text-center md:text-left flex-1">
              <div className="w-12 h-12 md:w-12 md:h-12 rounded-full md:rounded-[16px] bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100 shadow-sm md:shadow-none">
                <div className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center">
                  <UserCircle2 className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="block text-[11px] md:text-[13px] font-bold text-[#0F172A] leading-tight">Profile<br className="md:hidden" /> Complete</span>
                <span className="block text-[10px] md:text-[12px] font-semibold text-[#64748B] mt-0.5 md:mt-0">{profileCompleteness}</span>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 md:px-4 text-center md:text-left flex-1 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-[#0F172A]/[0.08] to-transparent md:hidden" />
              <div className="w-12 h-12 md:w-12 md:h-12 rounded-full md:rounded-[16px] bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm md:shadow-none">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="block text-[11px] md:text-[13px] font-bold text-[#0F172A] leading-tight">Account<br className="md:hidden" /> Status</span>
                <span className="block text-[10px] md:text-[12px] font-semibold text-emerald-600 mt-0.5 md:mt-0">Active</span>
              </div>
            </div>

            {/* Insurance */}
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 md:px-4 text-center md:text-left flex-1 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-[#0F172A]/[0.08] to-transparent md:hidden" />
              <div className="w-12 h-12 md:w-12 md:h-12 rounded-full md:rounded-[16px] bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm md:shadow-none">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="block text-[11px] md:text-[13px] font-bold text-[#0F172A] leading-tight">Insurance<br className="md:hidden" /> Status</span>
                <span className={`block text-[10px] md:text-[12px] font-semibold mt-0.5 md:mt-0 ${hasInsurance ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {hasInsurance ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 md:px-4 text-center md:text-left flex-1 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-[#0F172A]/[0.08] to-transparent md:hidden" />
              <div className="w-12 h-12 md:w-12 md:h-12 rounded-full md:rounded-[16px] bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm md:shadow-none">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="block text-[11px] md:text-[13px] font-bold text-[#0F172A] leading-tight">Outstanding<br className="md:hidden" /> Balance</span>
                <span className={`block text-[10px] md:text-[12px] font-semibold mt-0.5 md:mt-0 ${totalBalance > 0 ? 'text-amber-600' : 'text-amber-600'}`}>${totalBalance.toFixed(2)}</span>
              </div>
            </div>

          </div>

          <div className="shrink-0 flex justify-center xl:justify-end w-full xl:w-auto mt-2 md:mt-0">
            <Link
              href="/portal/appointments"
              className="w-full xl:w-auto bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white px-8 py-4 md:py-3.5 rounded-[16px] md:rounded-[16px] font-semibold text-[15px] shadow-[0_8px_24px_rgba(37,99,235,0.24)] flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-5 h-5 md:w-4 md:h-4" /> Book Appointment <ChevronRight className="w-5 h-5 md:hidden ml-auto" />
            </Link>
          </div>
        </div>

        {/* ── 3. Main Dashboard Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

          {/* Next Appointment Card (Spans 6) */}
          <div className="lg:col-span-6 bg-white rounded-[28px] md:rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.04)] border border-[#0F172A]/[0.06] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] md:text-[26px] font-serif text-[#0F172A] flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-[#2563EB]" />
                Next Appointment
              </h2>
              <ChevronRight className="w-5 h-5 text-[#64748B] md:hidden" />
            </div>

            {nextAppt ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 rounded-[24px] bg-gradient-to-b from-blue-50 to-indigo-50 border border-blue-100/50 flex flex-col items-center justify-center mb-6 shadow-sm">
                  <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">{new Date(nextAppt.appointmentDate).toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="text-[36px] font-bold text-[#0F172A] leading-none mt-1">{new Date(nextAppt.appointmentDate).getDate()}</span>
                </div>
                <h3 className="text-[20px] font-bold text-[#0F172A] mb-2">{nextAppt.treatmentType || "General Checkup"}</h3>
                <div className="flex items-center justify-center gap-4 text-[14px] font-semibold text-[#64748B] mb-8">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#64748B]" /> {nextAppt.appointmentTime || "TBD"}</span>
                </div>
                <Link
                  href="/portal/appointments"
                  className="w-full bg-[#F8FBFF] border border-[#BFDBFE] text-[#2563EB] py-3.5 rounded-[16px] font-semibold text-[14px] shadow-sm transition-colors text-center"
                >
                  Manage Appointment
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-2">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[28px] flex items-center justify-center shadow-inner">
                    <CalendarDays className="w-10 h-10 text-[#60A5FA]" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                    <Clock className="w-5 h-5 text-[#64748B]" />
                  </div>
                </div>
                <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No upcoming appointments</h3>
                <p className="text-[14px] text-[#64748B] max-w-[260px] leading-relaxed mb-8">
                  Stay on top of your dental health. Schedule your next preventive visit today.
                </p>
                <Link
                  href="/portal/appointments"
                  className="bg-[#F8FBFF] border border-[#BFDBFE] text-[#2563EB] hover:bg-[#E0E7FF] w-full py-3.5 rounded-[16px] font-semibold text-[14px] transition-colors"
                >
                  Schedule Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Health Summary (Spans 6) */}
          <div className="lg:col-span-6 bg-white rounded-[28px] md:rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.04)] border border-[#0F172A]/[0.06] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] md:text-[26px] font-serif text-[#0F172A] flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-[#2563EB]" />
                Health Summary
              </h2>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider mb-1">Overall Score</span>
                <div className="w-14 h-14 rounded-full border-[3px] border-[#2563EB] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)] relative bg-white">
                  <span className="text-[18px] font-bold text-[#0F172A] leading-none">92</span>
                  <span className="text-[7px] font-bold text-[#2563EB] mt-0.5 uppercase tracking-wide">Excellent</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 flex-1 flex flex-col justify-center">
              {[
                { label: "Oral Health", value: "Excellent", status: "text-emerald-500" },
                { label: "Last Checkup", value: pastAppts.length > 0 ? formatDate(pastAppts[0].appointmentDate) : "May 12, 2026", status: "text-[#0F172A]" },
                { label: "Treatments Completed", value: pastAppts.length > 0 ? `${pastAppts.length} of 3` : "3 of 3", status: "text-[#0F172A]" },
                { label: "X-Rays & Scans", value: "Up to date", status: "text-emerald-500" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-[#0F172A]/[0.04] last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[14px] font-medium text-[#0F172A]">{item.label}</span>
                  </div>
                  <span className={`text-[13px] font-medium ${item.status}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── 4. Quick Actions ── */}
        <div>
          <div className="flex items-center justify-between mb-4 pl-1">
            <h2 className="text-[20px] font-serif text-[#0F172A]">Quick Actions</h2>
            <Link href="/portal/menu" className="text-[13px] font-bold text-[#2563EB] md:hidden">View All</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { name: "Book Visit", desc: "Schedule online", icon: CalendarDays, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10", border: "border-[#0F172A]/[0.04]" },
              { name: "My Chart", desc: "View records", icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-100", border: "border-[#0F172A]/[0.04]" },
              { name: "Messages", desc: "Chat with clinic", icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-100", border: "border-[#0F172A]/[0.04]", badge: unreadCount > 0 ? unreadCount : 3 },
              { name: "Prescriptions", desc: "View medications", icon: Activity, color: "text-orange-500", bg: "bg-orange-100", border: "border-[#0F172A]/[0.04]" },
              { name: "Billing", desc: "Invoices & receipts", icon: Receipt, color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/10", border: "border-[#0F172A]/[0.04]" },
              { name: "Requests", desc: "Submit request", icon: FileText, color: "text-rose-500", bg: "bg-rose-100", border: "border-[#0F172A]/[0.04]" }
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.name === 'Messages' ? '/portal/messages' : item.name === 'Billing' ? '/portal/invoices' : '/portal/appointments'}
                className={`bg-white rounded-[24px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] border flex flex-col md:flex-row items-start md:items-center justify-center md:justify-start gap-4 ${item.border}`}
              >
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 ${item.bg} ${item.color} relative`}>
                  <item.icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-[#2563EB] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="min-w-0 w-full text-left">
                  <span className="block text-[14px] font-bold text-[#0F172A] truncate">
                    {item.name}
                  </span>
                  <span className="block text-[12px] font-medium text-[#64748B] truncate mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 5. Bottom Section ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-[28px] md:rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.04)] border border-[#0F172A]/[0.06]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[20px] md:text-[22px] font-serif text-[#0F172A] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2563EB]" />
                Recent Activity
              </h2>
              <Link href="/portal/notifications" className="text-[13px] font-bold text-[#2563EB]">
                View All
              </Link>
            </div>

            {recentActivity.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10 mt-0.5 ${item.bg}`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[14px] font-bold text-[#0F172A] mb-1">{item.title}</span>
                      <span className="block text-[13px] font-medium text-[#64748B] mb-1.5">{item.desc}</span>
                      <span className="block text-[11px] font-semibold text-[#94A3B8]">{item.date} {item.time && `• ${item.time}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-[14px] font-semibold text-[#0F172A]">No recent activity</span>
                <span className="text-[12px] text-[#64748B] mt-1">Your recent actions will appear here.</span>
              </div>
            )}
          </div>

          {/* Secure Medical Records */}
          <div className="bg-white rounded-[28px] md:rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.04)] border border-[#0F172A]/[0.06] relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-[20px] md:text-[22px] font-serif text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                Secure Medical Records
              </h2>
              <ChevronRight className="w-5 h-5 text-[#64748B] md:hidden" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 flex-1 relative z-10 w-full">
              {/* Illustration Placeholder */}
              <div className="relative shrink-0 w-full md:w-auto flex justify-center">
                <div className="w-40 h-28 md:w-32 md:h-24 bg-gradient-to-b from-blue-100 to-[#E0E7FF] rounded-[20px] relative flex items-center justify-center shadow-inner overflow-visible border border-white">
                  <FolderOpen className="w-16 h-16 text-[#3B82F6]" />
                  <div className="absolute -bottom-3 right-4 md:-right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-50">
                    <Lock className="w-5 h-5 text-[#2563EB]" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                  </div>
                  <div>
                    <span className="block text-[14px] font-bold text-[#0F172A]">120+ <span className="font-medium text-[#64748B]">Total Files</span></span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <span className="block text-[14px] font-bold text-[#0F172A]">Encrypted <span className="font-medium text-[#64748B]">& Secure</span></span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <span className="block text-[14px] font-bold text-[#0F172A]">24/7 Access <span className="font-medium text-[#64748B]">Anywhere</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 relative z-10 flex justify-center md:justify-end w-full">
              <Link
                href="/portal/files"
                className="inline-flex items-center justify-center w-full md:w-auto gap-2 bg-[#F8FBFF] text-[#2563EB] px-6 py-3.5 rounded-[16px] font-bold text-[14px] border border-[#BFDBFE]"
              >
                Access Records <Lock className="w-4 h-4" />
              </Link>
            </div>

            {/* Soft decorative background shape */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#EFF6FF] rounded-full blur-[60px] pointer-events-none" />
          </div>

          {/* Mobile Need Help Card */}
          <div className="md:hidden bg-[#F8FBFF] rounded-[28px] p-6 border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Headset className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-[16px] font-bold text-[#0F172A]">Need Help?</h3>
              </div>
              <p className="text-[13px] text-[#64748B] mb-4">We're here to help you</p>
              <Link href="/portal/support" className="inline-flex items-center gap-2 text-[14px] font-bold text-[#2563EB]">
                Contact Support <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-20 h-20 bg-blue-100/50 rounded-full flex items-center justify-center opacity-80">
              <Headset className="w-10 h-10 text-blue-200" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
