"use client";

import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { RefreshCw, ClipboardList, FileText, User, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Stethoscope, Phone, Mail, StickyNote, Zap, X, UserPlus, ArrowRight, Check, ChevronDown, Filter, Activity } from "lucide-react";
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

  // Grouping for the list
  const todayStr = new Date().toISOString().split("T")[0];
  const isWalkIn = (a: any) => a.patientId === "walk-in-patient";
  const isTerminal = (a: any) => ["completed", "cancelled", "no_show"].includes(a.status);

  const grouped = {
    walkIn: filtered.filter(a => isWalkIn(a) && !isTerminal(a)),
    today: filtered.filter(a => a.appointmentDate === todayStr && !isTerminal(a) && !isWalkIn(a)),
    upcoming: filtered.filter(a => a.appointmentDate > todayStr && !isTerminal(a) && !isWalkIn(a)),
    past: filtered.filter(a => a.appointmentDate < todayStr && !isTerminal(a) && !isWalkIn(a)),
    completed: filtered.filter(a => a.status === "completed"),
    cancelled: filtered.filter(a => a.status === "cancelled"),
    noShow: filtered.filter(a => a.status === "no_show"),
  };

  const renderListGroup = (title: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{title}</h3>
        <div className="space-y-1.5">
          {items.map((appt) => {
            const meta = STATUS_META[appt.status] || STATUS_META.pending;
            const isActive = selected?.id === appt.id;
            return (
              <button
                key={appt.id}
                onClick={() => setSelected(isActive ? null : appt)}
                className={`w-full text-left group bg-white border rounded-[12px] p-3 transition-all hover:bg-gray-50 flex flex-col gap-2 ${isActive ? "border-blue-500 ring-1 ring-blue-500 shadow-sm" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[14px] font-bold text-gray-900 break-words flex-1 pr-2">
                    {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : "Walk-in Patient"}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${meta.bg} ${meta.color} shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                
                <div className="flex items-center justify-between w-full">
                  <span className="text-[12px] text-gray-500 flex-1 break-words pr-2">
                    {(appt.serviceId || "dental-treatment").replace(/-/g, " ")}
                  </span>
                  <span className="text-[11px] font-bold text-gray-700 shrink-0">
                    {appt.appointmentTime}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Appointments</h1>
          <div className="hidden md:flex items-center gap-4 border-l border-gray-200 pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</span>
              <span className="text-[14px] font-bold text-gray-900">{grouped.today.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
              <span className="text-[14px] font-bold text-emerald-600">{counts.completed || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
              <span className="text-[14px] font-bold text-amber-600">{counts.pending || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Native Select for fast filtering without complex dropdowns */}
          <div className="relative hidden md:block">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-8 pr-8 h-[36px] bg-gray-50 border border-gray-200 rounded-[8px] text-[12px] font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_META).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button onClick={() => setShowWalkin(true)} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold h-[36px] px-4 rounded-[8px] text-[12px] transition-colors shadow-sm">
            <UserPlus className="w-3.5 h-3.5" /> Walk-in
          </button>
          <button onClick={fetchAppointments} className="flex items-center justify-center w-[36px] h-[36px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[8px] shadow-sm transition-colors shrink-0" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        
        {/* ── Left Pane (List) ── */}
        <div className={`w-full lg:w-[35%] xl:w-[30%] bg-gray-50 border-r border-gray-200 h-full flex flex-col shrink-0 transition-transform duration-300 absolute lg:static z-20 ${selected ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}`}>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white border border-gray-200 rounded-[12px] shimmer shadow-sm" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-[13px] text-gray-500 font-medium">No appointments found.</p>
              </div>
            ) : (
              <>
                {renderListGroup("Today", grouped.today)}
                {renderListGroup("Walk-in", grouped.walkIn)}
                {renderListGroup("Upcoming", grouped.upcoming)}
                {renderListGroup("Past", grouped.past)}
                {renderListGroup("Completed", grouped.completed)}
                {renderListGroup("No Show", grouped.noShow)}
                {renderListGroup("Cancelled", grouped.cancelled)}
              </>
            )}
          </div>
        </div>

        {/* ── Right Pane (Live Workspace) ── */}
        <div className={`flex-1 h-full bg-white flex flex-col min-w-0 transition-transform duration-300 absolute lg:static w-full z-30 ${selected ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          {selected ? (
            <div className="flex-1 flex flex-col h-full bg-[#FCFCFD]">
              {/* Workspace Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center gap-6 shrink-0 shadow-sm relative z-10 w-full min-h-[80px]">
                {/* Mobile Close */}
                <button onClick={() => setSelected(null)} className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>

                {/* Patient Context Group */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm shrink-0">
                    {selected.patient ? selected.patient.firstName[0] : "W"}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h2 className="text-[16px] font-bold text-gray-900 leading-snug">
                      {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}
                    </h2>
                    <span className="text-[11px] font-semibold text-gray-500 font-mono tracking-widest uppercase">
                      {selected.patient ? `ID: ${selected.patient.id.split('-')[0]}` : "ID: N/A"}
                    </span>
                  </div>
                </div>

                <div className="hidden lg:block w-[1px] h-10 bg-gray-200 shrink-0" />

                {/* Appointment Date & Time */}
                <div className="flex items-center gap-3 shrink-0 text-[14px] font-bold text-gray-900">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>
                    {selected.appointmentDate ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(selected.appointmentDate)) : "N/A"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>{selected.appointmentTime}</span>
                </div>

                {/* Actions & Status Block */}
                <div className="flex items-center gap-3 ml-auto shrink-0 flex-wrap lg:flex-nowrap">
                    {selected.status !== "completed" && selected.status !== "cancelled" && (
                      <button onClick={() => handleStatus("completed")} className="h-[40px] px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-[8px] text-[13px] transition-colors shadow-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </button>
                    )}
                    {selected.status !== "in_progress" && selected.status !== "completed" && (
                      <button onClick={() => handleStatus("in_progress")} className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[8px] text-[13px] transition-colors shadow-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Start Visit
                      </button>
                    )}
                  </div>
                </div>

              {/* Workspace Body */}
              <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8">
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Service Details */}
                  <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Service Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] text-gray-500 mb-0.5">Primary Reason</p>
                        <p className="text-[14px] font-bold text-gray-900 capitalize">{(selected.serviceId || "dental-treatment").replace(/-/g, " ")}</p>
                      </div>
                      {selected.patient?.doctor && (
                        <div>
                          <p className="text-[11px] text-gray-500 mb-0.5">Assigned Doctor</p>
                          <p className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-blue-500" /> {selected.patient.doctor}</p>
                        </div>
                      )}
                      {selected.notes && (
                        <div className="bg-amber-50 rounded-[8px] p-3 border border-amber-100">
                          <p className="text-[12px] text-amber-900 font-medium leading-relaxed flex gap-2">
                            <StickyNote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            {selected.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient Info */}
                  {selected.patient ? (
                    <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Patient Profile</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] text-gray-500 mb-0.5">Age / Gender</p>
                            <p className="text-[13px] font-bold text-gray-900">{selected.patient.age || '-'}y • {selected.patient.gender?.[0] || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-500 mb-0.5">Patient ID</p>
                            <p className="text-[13px] font-mono text-gray-900">{selected.patient.id?.substring(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 p-2 rounded-[8px]">
                            <Phone className="w-4 h-4 text-gray-400" /> {selected.patient.phone}
                          </div>
                          <div className="flex items-center gap-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 p-2 rounded-[8px]">
                            <Mail className="w-4 h-4 text-gray-400" /> {selected.patient.email}
                          </div>
                        </div>
                        <a href={`/admin/workspace?patient=${selected.patient.id}`} className="w-full flex items-center justify-center gap-1.5 h-[36px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-[8px] text-[12px] font-bold transition-colors">
                          Open Full Medical Record <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex items-center justify-center flex-col text-center">
                      <div className="w-12 h-12 rounded-[12px] bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-[14px] font-bold text-gray-900 mb-1">Unregistered Walk-in</p>
                      <p className="text-[12px] text-gray-500">Create a patient profile to enable full medical records and clinical tools.</p>
                      <button className="mt-4 px-4 h-[32px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold rounded-[8px] text-[12px] shadow-sm">Register Patient</button>
                    </div>
                  )}
                </div>

                {/* Clinical Actions Hub */}
                {selected.patient && (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-500" /> Clinical Action Hub</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => setActiveAction("rx")}
                        className="bg-white border border-gray-200 rounded-[12px] p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <p className="text-[13px] font-bold text-gray-900 mb-0.5">Write Script</p>
                        <p className="text-[11px] text-gray-500">Issue prescription</p>
                      </button>
                      
                      <button
                        onClick={() => setActiveAction("bill")}
                        className="bg-white border border-gray-200 rounded-[12px] p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all group"
                      >
                        <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <p className="text-[13px] font-bold text-gray-900 mb-0.5">New Invoice</p>
                        <p className="text-[11px] text-gray-500">Bill patient</p>
                      </button>
                      
                      <a
                        href={`/admin/workspace?patient=${selected.patient.id}`}
                        className="bg-white border border-gray-200 rounded-[12px] p-4 text-left hover:border-purple-300 hover:shadow-md transition-all group block"
                      >
                        <div className="w-8 h-8 rounded-[8px] bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <p className="text-[13px] font-bold text-gray-900 mb-0.5">SOAP Notes</p>
                        <p className="text-[11px] text-gray-500">Document visit</p>
                      </a>
                      
                      <button
                        className="bg-white border border-gray-200 rounded-[12px] p-4 text-left hover:border-amber-300 hover:shadow-md transition-all group"
                      >
                        <div className="w-8 h-8 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <p className="text-[13px] font-bold text-gray-900 mb-0.5">Reschedule</p>
                        <p className="text-[11px] text-gray-500">Change time</p>
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-8 bg-[#F8FAFC]">
              <div className="w-16 h-16 rounded-[16px] bg-white border border-gray-200 flex items-center justify-center mb-5 shadow-sm">
                <Calendar className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-2">No Appointment Selected</h3>
              <p className="text-[14px] text-gray-500 max-w-[300px]">Select an appointment from the list to view clinical context, update status, and take actions.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Prescribe Modal ── */}
      {activeAction === "rx" && selected && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-gray-900 p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[16px]">New Prescription</h4>
                <p className="text-white/60 text-[12px] mt-0.5">Issue drug script for {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}</p>
              </div>
              <button onClick={() => {
                setActiveAction(null);
                setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
              }} className="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRx} className="p-5 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick Templates</span>
                <select onChange={(e) => { const t = RX_TEMPLATES[e.target.value]; if (t) setRx(t); }} className="text-[12px] bg-white border border-gray-200 rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-blue-500 font-bold text-gray-700 shadow-sm cursor-pointer">
                  <option value="">Choose Template…</option>
                  <option value="amox">Amoxicillin (500mg Antibiotic)</option>
                  <option value="metro">Metronidazole (400mg Antibiotic)</option>
                  <option value="ibup">Ibuprofen (400mg Painkiller)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">Drug Name</label>
                  <input required placeholder="Amoxicillin, etc." value={rx.drugName} onChange={(e) => setRx((p) => ({ ...p, drugName: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">Dosage</label>
                  <input required placeholder="e.g. 500mg" value={rx.dosage} onChange={(e) => setRx((p) => ({ ...p, dosage: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">Frequency</label>
                  <input required placeholder="e.g. 3 times daily" value={rx.frequency} onChange={(e) => setRx((p) => ({ ...p, frequency: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">Duration</label>
                  <input required placeholder="e.g. 7 days" value={rx.duration} onChange={(e) => setRx((p) => ({ ...p, duration: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Instructions</label>
                <input required placeholder="Take with food, complete full course." value={rx.instructions} onChange={(e) => setRx((p) => ({ ...p, instructions: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Clinical Notes (Optional)</label>
                <input placeholder="Add internal dentist notes here..." value={rx.notes} onChange={(e) => setRx((p) => ({ ...p, notes: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-[40px] rounded-[8px] text-[13px] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Prescription</>}
                </button>
                <button type="button" onClick={() => {
                  setActiveAction(null);
                  setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
                }} className="w-[100px] bg-white border border-gray-200 text-gray-700 font-bold h-[40px] rounded-[8px] text-[13px] hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bill Modal ── */}
      {activeAction === "bill" && selected && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-gray-900 p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[16px]">Generate Invoice</h4>
                <p className="text-white/60 text-[12px] mt-0.5">Bill {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}</p>
              </div>
              <button onClick={() => {
                setActiveAction(null);
                setBill({ desc: "", cost: "" });
              }} className="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBill} className="p-5 space-y-4 bg-gray-50">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Treatment Description</label>
                <input required placeholder="e.g. Tooth restoration filling" value={bill.desc} onChange={(e) => setBill((p) => ({ ...p, desc: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Amount (€)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-bold">€</span>
                  <input required type="number" step="0.01" min="0" placeholder="0.00" value={bill.cost} onChange={(e) => setBill((p) => ({ ...p, cost: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] pl-8 pr-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-[40px] rounded-[8px] text-[13px] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Send Invoice</>}
                </button>
                <button type="button" onClick={() => {
                  setActiveAction(null);
                  setBill({ desc: "", cost: "" });
                }} className="w-[100px] bg-white border border-gray-200 text-gray-700 font-bold h-[40px] rounded-[8px] text-[13px] hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Walk-in modal ── */}
      {showWalkin && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-gray-900 p-5 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[16px]">Walk-in Check-in</h4>
                <p className="text-white/60 text-[12px] mt-0.5">Register a walk-in patient for today</p>
              </div>
              <button onClick={() => setShowWalkin(false)} className="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleWalkin} className="p-5 space-y-4 bg-gray-50">
              {[
                { label: "Patient Full Name", key: "name", type: "text" },
                { label: "Phone Number", key: "phone", type: "tel" },
              ].map(({ label, key, type }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">{label}</label>
                  <input type={type} required value={(walkin as any)[key]} onChange={(e) => setWalkin((p) => ({ ...p, [key]: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Reason for Visit</label>
                <select value={walkin.reason} onChange={(e) => setWalkin((p) => ({ ...p, reason: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                  <option value="general-dentistry">General Dentistry</option>
                  <option value="emergency-dentistry">Emergency / Toothache</option>
                  <option value="teeth-cleaning">Hygiene / Cleaning</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-[40px] rounded-[8px] text-[13px] shadow-sm flex items-center justify-center gap-2 transition-colors">
                  <UserPlus className="w-4 h-4" /> Check In Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
