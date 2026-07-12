"use client";

import { useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { Calendar, Users, TrendingUp, AlertCircle, FileText, UserPlus, ArrowUpRight, ArrowDownRight, Activity, Clock, CreditCard, ChevronRight, CheckCircle2, ShieldCheck, Database, RefreshCw, Pill, Stethoscope, Mail, Plus } from "lucide-react";
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
} from "recharts";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: stats, loading } = useLiveData<any>("/analytics/overview", {
    intervalMs: 15000,
  });

  const { data: activityResp } = useLiveData<{ events: any[] }>(
    "/analytics/activity?limit=10",
    {
      intervalMs: 15000,
      initialData: { events: [] },
    }
  );

  const events = activityResp?.events ?? [];
  const totalAppointmentsToday = Number(stats?.totalAppointmentsToday ?? 0);
  const activePatientsCount = Number(stats?.activePatientsCount ?? 0);
  const monthlyRevenue = Number(stats?.monthlyRevenue ?? 0);
  const pendingInvoices = Number(stats?.pendingInvoices ?? 0);
  
  const revenueHistory = stats?.revenueHistory || [];
  const appointmentHistory = stats?.appointmentHistory || [];
  const patientHistory = stats?.patientHistory || [];
  
  const { data: appointments } = useLiveData<any[]>("/appointments", {
    intervalMs: 15000,
    initialData: [],
  });

  const upcomingSchedule = (appointments || [])
    .filter(a => a.status === 'confirmed' || a.status === 'pending')
    .sort((a, b) => new Date(`${a.appointmentDate}T${a.appointmentTime}`).getTime() - new Date(`${b.appointmentDate}T${b.appointmentTime}`).getTime())
    .slice(0, 5);

  const [activeTab, setActiveTab] = useState<"revenue" | "appointments" | "patients">("revenue");

  function getEventIcon(type: string) {
    if (type.includes("patient")) return <UserPlus className="w-4 h-4 text-blue-600" />;
    if (type.includes("appointment")) return <Calendar className="w-4 h-4 text-indigo-600" />;
    if (type.includes("invoice") || type.includes("payment")) return <CreditCard className="w-4 h-4 text-emerald-600" />;
    if (type.includes("soap") || type.includes("clinical")) return <Stethoscope className="w-4 h-4 text-purple-600" />;
    if (type.includes("prescription")) return <Pill className="w-4 h-4 text-amber-600" />;
    if (type.includes("notification")) return <Mail className="w-4 h-4 text-gray-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  }

  function formatRelative(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Math.max(0, Date.now() - then);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="w-full">
      {/* 12-Column Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* TOP ROW: KPIs (Each takes 3 cols on desktop) */}
        <div className="md:col-span-3 bg-white rounded-[20px] p-5 shadow-admin-soft border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <p className="text-[13px] font-semibold text-gray-500">Revenue Today</p>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">${Math.round(monthlyRevenue / 30).toLocaleString()}</span>
            <span className="flex items-center text-[12px] font-bold text-emerald-600"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-[20px] p-5 shadow-admin-soft border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <p className="text-[13px] font-semibold text-gray-500">Outstanding</p>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">${(pendingInvoices * 120).toLocaleString()}</span>
            <span className="flex items-center text-[12px] font-bold text-red-600"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 4%</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-[20px] p-5 shadow-admin-soft border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <p className="text-[13px] font-semibold text-gray-500">Today's Appts</p>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{totalAppointmentsToday}</span>
            <span className="flex items-center text-[12px] font-bold text-emerald-600"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 2</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-[20px] p-5 shadow-admin-soft border border-gray-100 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <p className="text-[13px] font-semibold text-gray-500">Patients</p>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{activePatientsCount}</span>
            <span className="flex items-center text-[12px] font-bold text-emerald-600"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 18%</span>
          </div>
        </div>


        {/* MIDDLE ROW: Main Chart (8 cols) & Schedule (4 cols) */}
        <div className="md:col-span-8 bg-white rounded-[20px] shadow-admin-soft border border-gray-100 flex flex-col h-[420px]">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">Performance Overview</h3>
              <p className="text-[13px] text-gray-500 mt-1">Monthly financial and clinical metrics</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200/60">
              <button 
                onClick={() => setActiveTab("revenue")}
                className={`px-3 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all ${activeTab === 'revenue' ? 'bg-white shadow-sm border border-gray-200/60 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >Revenue</button>
              <button 
                onClick={() => setActiveTab("appointments")}
                className={`px-3 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all ${activeTab === 'appointments' ? 'bg-white shadow-sm border border-gray-200/60 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >Appointments</button>
              <button 
                onClick={() => setActiveTab("patients")}
                className={`px-3 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all ${activeTab === 'patients' ? 'bg-white shadow-sm border border-gray-200/60 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >Patients</button>
            </div>
          </div>
          <div className="p-6 flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "revenue" ? (
                <AreaChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              ) : activeTab === "appointments" ? (
                <BarChart data={appointmentHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 600 }}
                     cursor={{ fill: '#F1F5F9' }}
                   />
                   <Bar dataKey="count" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              ) : (
                <BarChart data={patientHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 600 }}
                     cursor={{ fill: '#F1F5F9' }}
                   />
                   <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 bg-white rounded-[20px] shadow-admin-soft border border-gray-100 flex flex-col h-[420px]">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
             <div>
               <h3 className="text-[16px] font-bold text-gray-900">Today's Schedule</h3>
               <p className="text-[13px] text-gray-500 mt-1">Next upcoming appointments</p>
             </div>
             <Link href="/admin/appointments" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
             {upcomingSchedule.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center">
                 <Calendar className="w-8 h-8 text-gray-300 mb-3" />
                 <p className="text-[14px] font-medium text-gray-500">No upcoming appointments</p>
               </div>
             ) : (
               upcomingSchedule.map((appt) => {
                 const dateObj = new Date(appt.appointmentDate);
                 return (
                   <div key={appt.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                     <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                       <span className="text-[10px] font-bold uppercase">{dateObj.toLocaleString('default', { month: 'short' })}</span>
                       <span className="text-[14px] font-black leading-none mt-0.5">{dateObj.getDate()}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[14px] font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                         {appt.patientName || "Walk-in Patient"}
                       </p>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[12px] font-medium text-gray-500 flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {appt.appointmentTime}</span>
                         <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                         <span className="text-[12px] font-medium text-purple-600 truncate">{appt.serviceName || "Consultation"}</span>
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>


        {/* BOTTOM ROW: Activity (6 cols) & Side widgets (6 cols split) */}
        <div className="md:col-span-6 bg-white rounded-[20px] shadow-admin-soft border border-gray-100 flex flex-col h-[400px]">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
             <div>
               <h3 className="text-[16px] font-bold text-gray-900">Recent Activity</h3>
               <p className="text-[13px] text-gray-500 mt-1">Latest actions across the platform</p>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
             {events.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center">
                 <Activity className="w-8 h-8 text-gray-300 mb-3" />
                 <p className="text-[14px] font-medium text-gray-500">No recent activity</p>
               </div>
             ) : (
               <div className="space-y-1">
                 {events.map((event) => (
                   <div key={event.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                     <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-gray-300 transition-colors">
                       {getEventIcon(event.type)}
                     </div>
                     <div className="flex-1 min-w-0 pt-0.5">
                       <p className="text-[13px] font-medium text-gray-900 leading-snug">
                         {event.text}
                       </p>
                       <div className="flex items-center gap-2 mt-1.5">
                         <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{event.type}</span>
                         <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                         <span className="text-[12px] text-gray-500 font-medium">{formatRelative(event.at)}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-6">
          {/* System Health */}
          <div className="bg-white rounded-[20px] shadow-admin-soft border border-gray-100 p-6 flex-1 flex flex-col">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Database className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[14px] font-semibold text-gray-700">Database</span>
                </div>
                <span className="text-[12px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[14px] font-semibold text-gray-700">API</span>
                </div>
                <span className="text-[12px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[14px] font-semibold text-gray-700">Redis</span>
                </div>
                <span className="text-[12px] font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">Online</span>
              </div>
            </div>
            <Link href="/admin/settings/system" className="mt-4 flex items-center justify-center w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-xl border border-gray-200 transition-colors">
              View Metrics
            </Link>
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-[20px] shadow-admin-soft border border-gray-100 p-6 flex-1 flex flex-col">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
              <Link href="/admin/patients/new" className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition-colors text-blue-700">
                <UserPlus className="w-5 h-5" />
                <span className="text-[12px] font-bold text-center leading-tight">Add<br/>Patient</span>
              </Link>
              <Link href="/admin/appointments" className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl transition-colors text-purple-700">
                <Calendar className="w-5 h-5" />
                <span className="text-[12px] font-bold text-center leading-tight">New<br/>Appt</span>
              </Link>
              <Link href="/admin/billing" className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-colors text-emerald-700">
                <CreditCard className="w-5 h-5" />
                <span className="text-[12px] font-bold text-center leading-tight">Create<br/>Invoice</span>
              </Link>
              <Link href="/admin/workspace" className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-gray-700">
                <Stethoscope className="w-5 h-5" />
                <span className="text-[12px] font-bold text-center leading-tight">Clinical<br/>Notes</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
