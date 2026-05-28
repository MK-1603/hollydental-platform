"use client";

import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  RefreshCw, ClipboardList, FileText, User, Calendar,
  Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight,
  Stethoscope, Phone, Mail, StickyNote, Zap, X, UserPlus,
  ArrowRight, Check, ChevronDown, Filter,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { div } from "framer-motion/client";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:     { label: "Pending",     color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400" },
  confirmed:   { label: "Confirmed",   color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500" },
  arrived:     { label: "Arrived",     color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-500" },
  in_progress: { label: "In Progress", color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500 animate-pulse" },
  completed:   { label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",   color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-400" },
  no_show:     { label: "No Show",     color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",   dot: "bg-gray-400" },
};

const RX_TEMPLATES: Record<string, any> = {
  amox:  { drugName: "Amoxicillin",    dosage: "500mg", frequency: "Three times a day",      duration: "7 days", instructions: "Take with food. Complete the full course.", notes: "Abscess swelling prevention" },
  metro: { drugName: "Metronidazole",  dosage: "400mg", frequency: "Three times a day",      duration: "5 days", instructions: "Do NOT drink alcohol while taking this medication.", notes: "Acute dental infection" },
  ibup:  { drugName: "Ibuprofen",      dosage: "400mg", frequency: "Every 6 hours as needed",duration: "3 days", instructions: "Take with or after food. Max 3 tablets daily.", notes: "Post-extraction pain" },
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showWalkin, setShowWalkin] = useState(false);
  const [activeAction, setActiveAction] = useState<"rx" | "bill" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const apptRef = useRef<any[]>([]);

  // Rx form
  const [rx, setRx] = useState({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
  // Bill form
  const [bill, setBill] = useState({ desc: "", cost: "" });
  // Walkin form
  const [walkin, setWalkin] = useState({ name: "", phone: "", reason: "general-dentistry" });

  useEffect(() => { apptRef.current = appointments; }, [appointments]);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(() => {
      apiRequest("/appointments").then((data) => {
        if (!Array.isArray(data)) return;
        const prev = apptRef.current;
        if (prev.length > 0) {
          data.filter((n) => !prev.some((o) => o.id === n.id) && n.status === "pending")
            .forEach((a) => {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                new Notification("New Appointment Request!", {
                  body: `${(a.serviceId || "dental-treatment").replace(/-/g, " ")} on ${formatDate(a.appointmentDate)} at ${a.appointmentTime}`,
                });
              }
            });
        }
        setAppointments(data);
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) {
      setBill((b) => ({ ...b, desc: (selected.serviceId || "dental-treatment").replace(/-/g, " ").toUpperCase() }));
      setActiveAction(null);
    }
  }, [selected?.id]);

  const fetchAppointments = () => {
    setLoading(true);
    apiRequest("/appointments").then(setAppointments).catch(() => {}).finally(() => setLoading(false));
  };

  const handleStatus = async (status: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const result = await apiRequest(`/appointments/${selected.id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      setAppointments((prev) => prev.map((a) => a.id === selected.id ? { ...a, status: result.status } : a));
      setSelected((p: any) => ({ ...p, status: result.status }));
      toast.success("Status updated.");
    } catch { toast.error("Failed to update status."); }
    finally { setUpdating(false); }
  };

  const handleRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.patientId) return;
    setActionLoading(true);
    try {
      await apiRequest("/prescriptions", { method: "POST", body: JSON.stringify({ patientId: selected.patientId, ...rx }) });
      toast.success("Prescription saved.");
      setActiveAction(null);
      setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  const handleBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.patientId) return;
    const cost = parseFloat(bill.cost);
    if (isNaN(cost) || cost <= 0) { toast.warning("Enter a valid cost."); return; }
    setActionLoading(true);
    try {
      await apiRequest("/billing/invoices", { method: "POST", body: JSON.stringify({ patientId: selected.patientId, items: [{ description: bill.desc, quantity: 1, price: cost }], subtotal: cost, vatAmount: 0, totalAmount: cost }) });
      toast.success("Invoice generated.");
      setActiveAction(null);
      setBill({ desc: "", cost: "" });
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(false); }
  };

  const handleWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiRequest("/appointments", { method: "POST", body: JSON.stringify({ patientId: "walk-in-patient", serviceId: walkin.reason, appointmentDate: new Date().toISOString().split("T")[0], appointmentTime: "11:30", notes: `Walk-in: ${walkin.name}. Phone: ${walkin.phone}` }) });
      setAppointments((prev) => [...prev, result.appointment]);
      setShowWalkin(false);
      setWalkin({ name: "", phone: "", reason: "general-dentistry" });
      toast.success("Walk-in checked in.");
    } catch { toast.error("Walk-in booking failed."); }
  };

  const filtered = filterStatus === "all" ? appointments : appointments.filter((a) => a.status === filterStatus);
  const counts = Object.fromEntries(Object.keys(STATUS_META).map((s) => [s, appointments.filter((a) => a.status === s).length]));

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">

      {/* ── Header Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gold" />
            </div>
            Appointments
          </h1>
          <p className="text-gray-400 text-xs mt-1 ml-10.5 hidden sm:block">Manage visits, update statuses, prescribe & bill</p>
        </div>
        
        {/* Actions & Dropdown */}
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          {/* Status Filter Dropdown / Popover */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-navy font-bold rounded-xl text-xs shadow-xs focus:outline-none transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">Status: </span>
              {filterStatus === "all" ? (
                <span className="text-navy font-extrabold">All ({appointments.length})</span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 font-extrabold ${STATUS_META[filterStatus]?.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[filterStatus]?.dot}`} />
                  {STATUS_META[filterStatus]?.label} ({counts[filterStatus] || 0})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Desktop Absolute Dropdown */}
            {showFilterDropdown && (
              <>
                <div className="hidden md:block absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-30 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus("all");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${filterStatus === "all" ? "text-gold bg-gold/5" : "text-navy"}`}
                  >
                    <span>All Appointments</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{appointments.length}</span>
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  {Object.entries(STATUS_META).map(([key, m]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setFilterStatus(key);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${filterStatus === key ? `${m.bg} ${m.color}` : "text-navy"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                        <span>{m.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{counts[key]}</span>
                    </button>
                  ))}
                </div>

                {/* Click outside overlay for desktop */}
                <div className="hidden md:block fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
              </>
            )}
          </div>

          <button onClick={() => setShowWalkin(true)} className="inline-flex items-center gap-1.5 border border-navy/20 hover:border-navy text-navy font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer">
            <UserPlus className="w-3.5 h-3.5" /> Walk-in
          </button>
          <button onClick={fetchAppointments} className="inline-flex items-center gap-1.5 bg-gold hover:bg-yellow-400 text-navy font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-colors cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Up / Backdrop Modal Popup */}
      {showFilterDropdown && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in" onClick={() => setShowFilterDropdown(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 space-y-4 animate-fade-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-serif text-base font-bold text-navy">Filter Appointments</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Select a category status to filter</p>
              </div>
              <button onClick={() => setShowFilterDropdown(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-navy cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setShowFilterDropdown(false);
                }}
                className={`w-full text-left px-4.5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${filterStatus === "all" ? "bg-navy text-white border-navy" : "bg-gray-50 border-gray-100 text-navy hover:bg-gray-100"}`}
              >
                <span>All Appointments</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${filterStatus === "all" ? "bg-white/20 text-white" : "bg-gray-200/80 text-gray-500"}`}>{appointments.length}</span>
              </button>
              {Object.entries(STATUS_META).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFilterStatus(key);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4.5 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${filterStatus === key ? `${m.bg} ${m.color} ${m.border}` : "bg-gray-50 border-gray-100 text-navy hover:bg-gray-100"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                    <span>{m.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${filterStatus === key ? "bg-white/40" : "bg-gray-200/80 text-gray-500"}`}>{counts[key]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-hidden bg-gray-50">

          {/* ── Appointment list ── */}
          <div className="lg:col-span-7 h-full overflow-y-auto p-6 space-y-2.5 bg-gray-50 border-r border-gray-200">
            {filtered.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-xs text-gray-400 font-medium">No appointments match this filter.</p>
              </div>
            ) : filtered.map((appt) => {
              const meta = STATUS_META[appt.status] || STATUS_META.pending;
              const isActive = selected?.id === appt.id;
              return (
                <button
                  key={appt.id}
                  onClick={() => setSelected(isActive ? null : appt)}
                  className={`w-full text-left group bg-white border rounded-2xl p-4 transition-all hover:shadow-md flex items-center gap-4 ${isActive ? "border-gold ring-2 ring-gold/20 shadow-md" : "border-gray-100 hover:border-gray-200"}`}
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} border ${meta.border}`}>
                    <User className={`w-5 h-5 ${meta.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-navy truncate">
                        {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : "Walk-in Patient"}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {(appt.serviceId || "dental-treatment").replace(/-/g, " ")}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {appt.appointmentTime}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(appt.appointmentDate)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${isActive ? "text-gold rotate-90" : "text-gray-300 group-hover:text-gray-400"}`} />
                </button>
              );
            })}
          </div>

          {/* ── Detail panel ── */}
          <div className="lg:col-span-5 h-full overflow-y-auto bg-white flex flex-col">
            {selected ? (
              <div className="flex-1 flex flex-col h-full">
                {/* Panel header */}
                <div className="bg-gradient-to-r from-navy to-blue-900 p-5 text-white relative">
                  <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center font-bold text-gold text-sm">
                      {selected.patient ? selected.patient.firstName[0] : "W"}
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}
                      </p>
                      <p className="text-white/60 text-[11px] mt-0.5">
                        {(selected.serviceId || "dental-treatment").replace(/-/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-white/10 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider">Date</p>
                      <p className="text-xs font-bold text-white mt-0.5">{formatDate(selected.appointmentDate)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider">Time</p>
                      <p className="text-xs font-bold text-white mt-0.5">{selected.appointmentTime}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Patient contact */}
                  {selected.patient && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                      <div className="flex items-center gap-2 text-xs text-navy">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {selected.patient.phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-navy">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {selected.patient.email}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selected.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 leading-relaxed">{selected.notes}</p>
                    </div>
                  )}

                  {/* Status update */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Update Status</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(STATUS_META).map(([key, m]) => (
                        <button
                          key={key}
                          disabled={updating || selected.status === key}
                          onClick={() => handleStatus(key)}
                          className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 ${selected.status === key ? `${m.bg} ${m.color} ${m.border}` : "border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50"} disabled:opacity-50`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                          {m.label}
                          {selected.status === key && <Check className="w-3 h-3 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Quick Actions */}
                  {selected.patient && (
                    <div className="space-y-3 border-t border-gray-50 pt-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-gold" /> Clinical Quick Actions
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveAction("rx")}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 border-gray-200 text-navy hover:bg-gray-50"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> Prescribe
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAction("bill")}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 border-gray-200 text-navy hover:bg-gray-50"
                        >
                          <FileText className="w-3.5 h-3.5" /> Bill Patient
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7 text-gray-200" />
                </div>
                <p className="text-sm font-semibold text-navy font-serif">Select an appointment</p>
                <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto leading-relaxed">Click any appointment to view details, update status, or take clinical actions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Prescribe Modal ── */}
      {activeAction === "rx" && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-navy p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold">New Prescription</h4>
                <p className="text-white/60 text-[11px] mt-0.5">Issue drug script for {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}</p>
              </div>
              <button onClick={() => {
                setActiveAction(null);
                setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
              }} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRx} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-navy uppercase tracking-wider">Quick Templates</span>
                <select onChange={(e) => { const t = RX_TEMPLATES[e.target.value]; if (t) setRx(t); }} className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gold">
                  <option value="">Choose Template…</option>
                  <option value="amox">Amoxicillin (500mg Antibiotic)</option>
                  <option value="metro">Metronidazole (400mg Antibiotic)</option>
                  <option value="ibup">Ibuprofen (400mg Painkiller)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Drug Name</label>
                  <input required placeholder="Amoxicillin, etc." value={rx.drugName} onChange={(e) => setRx((p) => ({ ...p, drugName: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Dosage</label>
                  <input required placeholder="e.g. 500mg" value={rx.dosage} onChange={(e) => setRx((p) => ({ ...p, dosage: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Frequency</label>
                  <input required placeholder="e.g. 3 times daily" value={rx.frequency} onChange={(e) => setRx((p) => ({ ...p, frequency: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Duration</label>
                  <input required placeholder="e.g. 7 days" value={rx.duration} onChange={(e) => setRx((p) => ({ ...p, duration: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Instructions</label>
                <input required placeholder="Take with food, complete full course." value={rx.instructions} onChange={(e) => setRx((p) => ({ ...p, instructions: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Clinical Notes (Optional)</label>
                <input placeholder="Add internal dentist notes here..." value={rx.notes} onChange={(e) => setRx((p) => ({ ...p, notes: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-navy hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Prescription</>}
                </button>
                <button type="button" onClick={() => {
                  setActiveAction(null);
                  setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
                }} className="flex-1 border border-gray-200 text-navy font-semibold py-3 rounded-xl text-xs hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bill Modal ── */}
      {activeAction === "bill" && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-navy p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold">Generate Invoice</h4>
                <p className="text-white/60 text-[11px] mt-0.5">Bill {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}</p>
              </div>
              <button onClick={() => {
                setActiveAction(null);
                setBill({ desc: "", cost: "" });
              }} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBill} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Treatment Description</label>
                <input required placeholder="e.g. Tooth restoration filling" value={bill.desc} onChange={(e) => setBill((p) => ({ ...p, desc: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Amount (€)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">€</span>
                  <input required type="number" step="0.01" min="0" placeholder="0.00" value={bill.cost} onChange={(e) => setBill((p) => ({ ...p, cost: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-gold hover:bg-yellow-400 text-navy font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Generate & Send Invoice</>}
                </button>
                <button type="button" onClick={() => {
                  setActiveAction(null);
                  setBill({ desc: "", cost: "" });
                }} className="flex-1 border border-gray-200 text-navy font-semibold py-3 rounded-xl text-xs hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Walk-in modal ── */}
      {showWalkin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-navy p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold">Walk-in Check-in</h4>
                <p className="text-white/60 text-[11px] mt-0.5">Register a walk-in patient for today</p>
              </div>
              <button onClick={() => setShowWalkin(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleWalkin} className="p-5 space-y-4">
              {[
                { label: "Patient Full Name", key: "name", type: "text" },
                { label: "Phone Number", key: "phone", type: "tel" },
              ].map(({ label, key, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">{label}</label>
                  <input type={type} required value={(walkin as any)[key]} onChange={(e) => setWalkin((p) => ({ ...p, [key]: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Reason for Visit</label>
                <select value={walkin.reason} onChange={(e) => setWalkin((p) => ({ ...p, reason: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-gold">
                  <option value="general-dentistry">General Dentistry</option>
                  <option value="emergency-dentistry">Emergency / Toothache</option>
                  <option value="teeth-cleaning">Hygiene / Cleaning</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-gold hover:bg-yellow-400 text-navy font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center gap-2 transition-colors">
                <UserPlus className="w-4 h-4" /> Check In Patient <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
