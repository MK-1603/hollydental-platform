"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import Link from "next/link";
import {
  CalendarDays, ChevronDown, Plus, Clock, RefreshCw,
  MapPin, Phone, X, Stethoscope, ChevronRight, Sparkles,
} from "lucide-react";
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
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 border border-gray-200 hover:border-gold text-navy font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors bg-white">
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-50">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { onChange(f); setOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${value === f ? "text-gold bg-gold/5" : "text-navy hover:bg-gray-50"}`}>
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Patient Portal</span>
            </div>
            <h1 className="font-serif text-2xl font-bold">My Appointments</h1>
            <p className="text-white/60 text-xs mt-1">
              {upcoming.length > 0 ? `${upcoming.length} upcoming visit${upcoming.length > 1 ? "s" : ""} scheduled` : "No upcoming visits scheduled"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchAppointments} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/portal/booking" className="bg-gold hover:bg-yellow-400 text-navy font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Book New
            </Link>
          </div>
        </div>
        {upcoming.length > 0 && (
          <div className="relative mt-4 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/10">
            <Sparkles className="w-4 h-4 text-gold shrink-0" />
            <span className="text-xs text-white/80">Next visit: <span className="font-bold text-white">{formatDate(upcoming[0].appointmentDate)}</span> at <span className="font-bold text-gold">{upcoming[0].appointmentTime}</span></span>
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500"><span className="font-bold text-navy">{filtered.length}</span> appointment{filtered.length !== 1 ? "s" : ""}</p>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-[180px] shimmer rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl bg-white p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto">
            <CalendarDays className="w-8 h-8 text-gray-200" />
          </div>
          <h3 className="font-serif text-base font-semibold text-navy">No appointments found</h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
            {filter === "Upcoming" ? "You don't have any upcoming visits." : `No ${filter.toLowerCase()} appointments.`}
          </p>
          {filter === "Upcoming" && (
            <Link href="/portal/booking" className="inline-flex items-center gap-1.5 bg-gold hover:bg-yellow-500 text-navy font-bold text-xs py-2.5 px-5 rounded-xl shadow transition-colors">
              <Plus className="w-3.5 h-3.5" /> Book First Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((appt) => {
            const cfg = STATUS_CFG[appt.status] || STATUS_CFG.pending;
            const canCancel = ["pending", "confirmed"].includes(appt.status) && appt.appointmentDate >= nowStr;
            const isUpcoming = appt.appointmentDate >= nowStr && !["cancelled", "completed", "no_show"].includes(appt.status);
            return (
              <button
                key={appt.id}
                onClick={() => setSelected(appt)}
                className={`text-left rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all overflow-hidden group border ${
                  appt.status === "cancelled" ? "border-gray-100 opacity-75" :
                  appt.status === "completed" ? "border-emerald-100 hover:border-emerald-200" :
                  "border-gray-100 hover:border-gold/40"
                }`}
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.stripe}`} />

                <div className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Stethoscope className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded">
                          {String(appt.serviceId || "appointment").replace(/-/g, " ")}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-navy mt-1 leading-snug">
                          {formatDate(appt.appointmentDate)}
                        </h4>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Time</p>
                      <p className="text-xs font-bold text-navy mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gold" /> {appt.appointmentTime}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dentist</p>
                      <p className="text-xs font-bold text-navy mt-0.5">Dr. Roghay</p>
                    </div>
                  </div>

                  {appt.notes && (
                    <p className="text-[10px] text-gray-400 bg-gray-50 px-3 py-2 rounded-lg line-clamp-2 italic">{appt.notes}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <span className="text-[10px] text-gold font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      View details <ChevronRight className="w-3 h-3" />
                    </span>
                    {canCancel && (
                      <span className="text-[10px] bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded-full">Can cancel</span>
                    )}
                    {isUpcoming && appt.status === "confirmed" && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Confirmed
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Modal header with gradient */}
            <div className={`bg-gradient-to-r ${STATUS_CFG[selected.status]?.stripe || "from-gray-400 to-gray-300"} p-5 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/70">
                    {String(selected.serviceId || "appointment").replace(/-/g, " ")}
                  </span>
                  <h3 className="font-serif text-lg font-bold mt-0.5">{formatDate(selected.appointmentDate)}</h3>
                  <p className="text-sm text-white/80 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5" /> {selected.appointmentTime} · {selected.durationMinutes || 30} min
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dentist</p>
                  <p className="font-bold text-navy mt-0.5">Dr. Roghay Alizadeh</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Type</p>
                  <p className="font-bold text-navy mt-0.5 capitalize">{selected.type || "In-Clinic"}</p>
                </div>
              </div>

              {selected.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Clinical Notes</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              <div className="border border-gray-100 rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Clinic Location</p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0" /> {CLINIC.address}
                </p>
                <a href={CLINIC.phoneHref} className="text-xs text-gold font-bold flex items-center gap-1.5 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {CLINIC.phone}
                </a>
              </div>

              <div className="flex gap-3 pt-1">
                <Link href={`/portal/appointments/${selected.id}`} className="flex-1 bg-navy hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs text-center transition-colors shadow">
                  Full Details
                </Link>
                {["pending", "confirmed"].includes(selected.status) && selected.appointmentDate >= nowStr && (
                  <button onClick={() => handleCancel(selected.id)} className="flex-1 border border-red-200 hover:bg-red-50 text-red-600 font-semibold py-3 rounded-xl text-xs transition-colors">
                    Cancel
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
