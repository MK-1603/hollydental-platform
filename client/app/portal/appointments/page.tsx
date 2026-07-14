"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { CalendarDays, ChevronDown, Plus, Clock, RefreshCw, MapPin, Phone, X, Stethoscope, ChevronRight, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CLINIC } from "@/lib/constants";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string; stripe: string }> = {
  pending:     { label: "Awaiting Approval", color: "text-amber-700",   bg: "bg-amber-50",   dot: "bg-amber-400",   stripe: "from-amber-400 to-amber-300" },
  confirmed:   { label: "Confirmed",         color: "text-blue-700",    bg: "bg-blue-50",    dot: "bg-blue-500",    stripe: "from-blue-500 to-blue-400" },
  arrived:     { label: "Arrived",           color: "text-teal-700",    bg: "bg-teal-50",    dot: "bg-teal-500",    stripe: "from-teal-500 to-teal-400" },
  in_progress: { label: "In Progress",       color: "text-purple-700",  bg: "bg-purple-50",  dot: "bg-purple-500",  stripe: "from-purple-500 to-purple-400" },
  completed:   { label: "Completed",         color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500", stripe: "from-emerald-500 to-emerald-400" },
  cancelled:   { label: "Cancelled",         color: "text-red-600",     bg: "bg-red-50",     dot: "bg-red-400",     stripe: "from-red-400 to-red-300" },
  no_show:     { label: "No Show",           color: "text-gray-500",    bg: "bg-gray-50",    dot: "bg-gray-400",    stripe: "from-gray-400 to-gray-300" },
};

const FILTERS = ["All", "Upcoming", "Completed", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "text-gray-600", bg: "bg-gray-50", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FilterDropdown({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 border border-gray-200 hover:border-blue-500 text-gray-900 font-semibold px-4 py-2 rounded-xl text-xs transition-colors bg-white shadow-sm">
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-[16px] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { onChange(f); setOpen(false); }} className={`w-full text-left px-5 py-2.5 text-xs font-semibold transition-colors ${value === f ? "text-blue-600 bg-blue-50/50" : "text-gray-700 hover:bg-gray-50"}`}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortalAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("Upcoming");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchAppointments = () => {
    setLoading(true);
    apiRequest("/appointments/my")
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id: string) => {
    const ok = await toast.confirm({ title: "Cancel this appointment?", message: "We'll free up the slot. You can rebook anytime.", confirmText: "Yes, cancel", danger: true });
    if (!ok) return;
    try {
      await apiRequest(`/appointments/${id}`, { method: "DELETE" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setSelected(null);
      toast.success("Appointment cancelled.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel. Contact the clinic.");
    }
  };

  const nowStr = new Date().toISOString().split("T")[0];
  const filtered = appointments.filter((a) => {
    if (filter === "Upcoming") return a.appointmentDate >= nowStr && !["cancelled", "completed", "no_show"].includes(a.status);
    if (filter === "Completed") return a.status === "completed";
    if (filter === "Cancelled") return a.status === "cancelled" || a.status === "no_show";
    return true;
  });
  const upcoming = appointments.filter((a) => a.appointmentDate >= nowStr && !["cancelled", "completed", "no_show"].includes(a.status));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-1 xl:px-4 select-none">
      
      {/* ── Light Luxury Header ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-white p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
            <CalendarDays className="w-3.5 h-3.5" /> Patient Portal
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mt-1.5">
            My Appointments
          </h1>
          <p className="text-gray-500 text-sm font-medium max-w-2xl leading-relaxed mt-1">
            {upcoming.length > 0 ? `${upcoming.length} upcoming visit${upcoming.length > 1 ? "s" : ""} scheduled` : "No upcoming visits scheduled"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <button onClick={fetchAppointments} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} /> Refresh
          </button>
          <Link href="/portal/booking" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Book New
          </Link>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-[20px] px-6 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-blue-100/50">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm text-gray-700 font-medium">Next visit: <span className="font-bold text-gray-900">{formatDate(upcoming[0].appointmentDate)}</span> at <span className="font-bold text-blue-700">{upcoming[0].appointmentTime}</span></span>
        </div>
      )}

      {/* Filter row */}
      <div className="flex items-center justify-between gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100/50">
        <p className="text-sm text-gray-500 font-medium pl-3"><span className="font-bold text-gray-900">{filtered.length}</span> appointment{filtered.length !== 1 ? "s" : ""}</p>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-[220px] shimmer rounded-[20px] bg-white border border-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-[20px] bg-white p-16 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
          <div className="w-20 h-20 rounded-[20px] bg-gray-50 flex items-center justify-center mx-auto border border-gray-100">
            <CalendarDays className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-gray-900">No appointments found</h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto font-medium">
            {filter === "Upcoming" ? "You don't have any upcoming visits scheduled." : `We couldn't find any ${filter.toLowerCase()} appointments.`}
          </p>
          {filter === "Upcoming" && (
            <Link href="/portal/booking" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-8 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 mt-2">
              <Plus className="w-4 h-4" /> Book First Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((appt) => {
            const cfg = STATUS_CFG[appt.status] || STATUS_CFG.pending;
            const canCancel = ["pending", "confirmed"].includes(appt.status) && appt.appointmentDate >= nowStr;
            return (
              <button
                key={appt.id}
                onClick={() => setSelected(appt)}
                className={`text-left rounded-[20px] bg-white shadow-sm hover:shadow-md transition-all overflow-hidden group border ${
                  appt.status === "cancelled" ? "border-gray-100 opacity-75" :
                  appt.status === "completed" ? "border-emerald-100 hover:border-emerald-200" :
                  "border-gray-100 hover:border-blue-200"
                }`}
              >
                {/* Gradient top bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${cfg.stripe}`} />

                <div className="p-6 space-y-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Stethoscope className={`w-6 h-6 ${cfg.color}`} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/50">
                          {String(appt.serviceId || "appointment").replace(/-/g, " ")}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-gray-900 mt-2 leading-snug">
                          {formatDate(appt.appointmentDate)}
                        </h4>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100/50">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Time</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> {appt.appointmentTime}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100/50">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dentist</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-blue-500" /> Dr. {appt.doctorName || "Assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-50 group-hover:bg-blue-50/30 transition-colors">
                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    View full details <ChevronRight className="w-3 h-3" />
                  </span>
                  {canCancel && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(appt.id); }}
                      className="text-[10px] uppercase font-bold tracking-wider text-gray-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-red-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-32 bg-gray-50 flex flex-col justify-end p-6 border-b border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2" />
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white text-gray-500 rounded-full transition-colors backdrop-blur-md border border-gray-200 shadow-sm">
                <X className="w-4 h-4" />
              </button>
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-white px-2 py-1 rounded shadow-sm">
                    {String(selected.serviceId || "appointment").replace(/-/g, " ")}
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-gray-900 mt-2">
                    {formatDate(selected.appointmentDate)}
                  </h2>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="p-6 space-y-5">
              {selected.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Awaiting Approval</p>
                    <p className="text-xs text-amber-800 leading-relaxed">Your requested time slot is reserved and awaiting clinic approval.</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dentist</p>
                  <p className="font-bold text-gray-900 mt-0.5">Dr. Roghay Alizadeh</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Type</p>
                  <p className="font-bold text-gray-900 mt-0.5 capitalize">{selected.type || "In-Clinic"}</p>
                </div>
              </div>

              {selected.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Clinical Notes</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              <div className="border border-gray-100 rounded-xl p-4 space-y-2.5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clinic Location</p>
                <p className="text-xs text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" /> {CLINIC.address}
                </p>
                <a href={CLINIC.phoneHref} className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-bold flex items-center gap-2 w-fit">
                  <Phone className="w-4 h-4" /> {CLINIC.phone}
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href={`/portal/appointments/${selected.id}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs text-center transition-all shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  Full Details <ChevronRight className="w-4 h-4" />
                </Link>
                {["pending", "confirmed"].includes(selected.status) && selected.appointmentDate >= nowStr && (
                  <button onClick={() => handleCancel(selected.id)} className="flex-1 border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 font-bold py-3.5 rounded-xl text-xs transition-colors">
                    Cancel Visit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
