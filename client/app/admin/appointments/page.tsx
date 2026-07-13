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
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* ── Main Header (Hidden on mobile when an appointment is selected) ── */}
      <div className={`bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-10 shadow-sm ${selected ? "hidden lg:flex" : "flex"}`}>
        <div className="flex items-center gap-6">
          <h1 className="text-[22px] font-extrabold text-navy tracking-tight">Appointments</h1>
          <div className="hidden md:flex items-center gap-5 border-l border-gray-200 pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</span>
              <span className="text-[15px] font-bold text-navy">{grouped.today.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
              <span className="text-[15px] font-bold text-emerald-600">{counts.completed || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
              <span className="text-[15px] font-bold text-amber-600">{counts.pending || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative hidden md:block">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-9 pr-9 h-[40px] bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold cursor-pointer transition-all"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_META).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button onClick={() => setShowWalkin(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-bold h-[40px] px-5 rounded-[10px] text-[13px] transition-all shadow-md hover:shadow-lg active:scale-95">
            <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Walk-in</span>
          </button>
          <button onClick={fetchAppointments} className="flex items-center justify-center w-[40px] h-[40px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-[10px] shadow-sm transition-all active:scale-95 shrink-0" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        
        {/* ── Left Pane (List) ── */}
        <div className={`w-full lg:w-[35%] xl:w-[320px] bg-white border-r border-gray-200 h-full flex flex-col shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] absolute lg:static z-20 ${selected ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}`}>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white border border-gray-100 rounded-[12px] shimmer shadow-sm" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">No Appointments</h3>
                <p className="text-[13px] text-gray-500 max-w-[200px]">You have no appointments matching the current filter.</p>
              </div>
            ) : (
              <div className="space-y-6 pb-20 lg:pb-0">
                {renderListGroup("Today", grouped.today)}
                {renderListGroup("Walk-in", grouped.walkIn)}
                {renderListGroup("Upcoming", grouped.upcoming)}
                {renderListGroup("Past", grouped.past)}
                {renderListGroup("Completed", grouped.completed)}
                {renderListGroup("No Show", grouped.noShow)}
                {renderListGroup("Cancelled", grouped.cancelled)}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Pane (Live Workspace) ── */}
        <div className={`flex-1 h-full bg-[#F8FAFC] flex flex-col min-w-0 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] absolute lg:static w-full z-30 ${selected ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
          {selected ? (
            <div className="flex-1 flex flex-col h-full relative">
              
              {/* Mobile Top Navigation */}
              <div className="lg:hidden flex items-center justify-between bg-white px-4 h-[60px] border-b border-gray-200 shrink-0 sticky top-0 z-20 shadow-sm">
                <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-navy font-bold text-[14px] p-2 -ml-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <h2 className="text-[15px] font-extrabold text-navy absolute left-1/2 -translate-x-1/2">
                  Details
                </h2>
                <div className="w-8" /> {/* spacer for center alignment */}
              </div>

              {/* Scrollable Workspace Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-[100px] lg:pb-10">
                
                {/* Hero Profile Header */}
                <div className="bg-white px-5 py-6 lg:px-8 lg:py-8 border-b border-gray-200">
                  <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4 lg:gap-5">
                      <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[16px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xl lg:text-2xl shadow-sm shrink-0">
                        {selected.patient ? selected.patient.firstName[0] : "W"}
                      </div>
                      <div className="flex flex-col pt-1">
                        <h2 className="text-[22px] lg:text-[26px] font-extrabold text-navy leading-tight tracking-tight">
                          {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}
                        </h2>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-2 text-[13px] text-gray-500 font-medium">
                          <span className="bg-gray-100 px-2.5 py-0.5 rounded text-gray-700 font-mono text-[11px] uppercase tracking-wider font-bold">
                            {selected.patient ? `ID: ${selected.patient.id.split('-')[0]}` : "ID: N/A"}
                          </span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> {selected.appointmentDate ? formatDate(selected.appointmentDate) : "N/A"}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" /> {selected.appointmentTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Status Actions (Hidden on mobile) */}
                    <div className="hidden lg:flex items-center gap-3">
                      {selected.status !== "completed" && selected.status !== "cancelled" && (
                        <button onClick={() => handleStatus("completed")} className="h-[44px] px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-[12px] text-[13px] transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                          <CheckCircle2 className="w-4 h-4" /> Complete
                        </button>
                      )}
                      {selected.status !== "in_progress" && selected.status !== "completed" && (
                        <button onClick={() => handleStatus("in_progress")} className="h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[12px] text-[13px] transition-all shadow-sm shadow-blue-600/20 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                          <Zap className="w-4 h-4" /> Start Visit
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 lg:p-8 space-y-6 lg:space-y-8 max-w-5xl mx-auto">
                  
                  {/* Two Column Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
                    
                    {/* Service Details Card */}
                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-gray-400" /> Service Details
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-[8px] ${STATUS_META[selected.status]?.bg || "bg-gray-50"} ${STATUS_META[selected.status]?.color || "text-gray-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[selected.status]?.dot || "bg-gray-400"}`} />
                          {STATUS_META[selected.status]?.label || "Unknown"}
                        </span>
                      </div>
                      <div className="p-6 space-y-6 flex-1">
                        <div>
                          <p className="text-[12px] text-gray-500 mb-1.5 font-bold">Primary Reason</p>
                          <p className="text-[16px] font-extrabold text-navy capitalize">{(selected.serviceId || "dental-treatment").replace(/-/g, " ")}</p>
                        </div>
                        {selected.patient?.doctor && (
                          <div>
                            <p className="text-[12px] text-gray-500 mb-1.5 font-bold">Assigned Doctor</p>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Stethoscope className="w-4 h-4" /></div>
                              <p className="text-[15px] font-bold text-navy">Dr. {selected.patient.doctor}</p>
                            </div>
                          </div>
                        )}
                        {selected.notes && (
                          <div className="bg-amber-50/50 rounded-[12px] p-4 border border-amber-100/50">
                            <p className="text-[13px] text-amber-900 font-medium leading-relaxed flex gap-2.5">
                              <StickyNote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              {selected.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patient Profile Card */}
                    {selected.patient ? (
                      <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                          <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" /> Patient Profile
                          </h3>
                        </div>
                        <div className="p-6 space-y-6 flex-1 flex flex-col">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-[12px] border border-gray-100">
                              <p className="text-[11px] text-gray-500 mb-1 font-bold">Age / Gender</p>
                              <p className="text-[14px] font-extrabold text-navy">{selected.patient.age || '-'}y <span className="text-gray-300 font-normal mx-1">•</span> {selected.patient.gender?.[0]?.toUpperCase() || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-[12px] border border-gray-100">
                              <p className="text-[11px] text-gray-500 mb-1 font-bold">Registered</p>
                              <p className="text-[14px] font-extrabold text-navy">
                                {selected.patient.createdAt ? new Date(selected.patient.createdAt).getFullYear() : "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <a href={`tel:${selected.patient.phone}`} className="flex items-center gap-3 text-[14px] font-bold text-gray-700 hover:text-blue-600 transition-colors bg-white border border-gray-200 hover:border-blue-200 p-3 rounded-[12px]">
                              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-gray-500" /></div>
                              {selected.patient.phone}
                            </a>
                            <a href={`mailto:${selected.patient.email}`} className="flex items-center gap-3 text-[14px] font-bold text-gray-700 hover:text-blue-600 transition-colors bg-white border border-gray-200 hover:border-blue-200 p-3 rounded-[12px]">
                              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-gray-500" /></div>
                              <span className="truncate">{selected.patient.email}</span>
                            </a>
                          </div>
                          <div className="mt-auto pt-4">
                            <a href={`/admin/workspace?patient=${selected.patient.id}`} className="w-full flex items-center justify-center gap-2 h-[44px] bg-navy text-white hover:bg-navy-light rounded-[12px] text-[13px] font-bold transition-all shadow-sm">
                              Open Full Medical Record <ArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm flex items-center justify-center flex-col text-center">
                        <div className="w-16 h-16 rounded-[16px] bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                          <User className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-[16px] font-extrabold text-navy mb-2">Unregistered Walk-in</p>
                        <p className="text-[13px] text-gray-500 max-w-[220px]">Create a patient profile to enable full medical records and clinical tools.</p>
                        <button className="mt-6 px-6 h-[40px] bg-white border border-gray-200 hover:bg-gray-50 text-navy font-bold rounded-[10px] text-[13px] shadow-sm transition-all active:scale-95">Register Patient</button>
                      </div>
                    )}
                  </div>

                  {/* Clinical Actions Hub */}
                  {selected.patient && (
                    <div className="pt-2">
                      <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" /> Clinical Action Hub
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                        <button onClick={() => setActiveAction("rx")} className="bg-white border border-gray-200 rounded-[16px] p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                          <div className="w-10 h-10 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <p className="text-[14px] font-bold text-navy mb-0.5">Write Script</p>
                          <p className="text-[12px] text-gray-500">Issue prescription</p>
                        </button>
                        
                        <button onClick={() => setActiveAction("bill")} className="bg-white border border-gray-200 rounded-[16px] p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="text-[14px] font-bold text-navy mb-0.5">New Invoice</p>
                          <p className="text-[12px] text-gray-500">Bill patient directly</p>
                        </button>
                        
                        <a href={`/admin/workspace?patient=${selected.patient.id}`} className="bg-white border border-gray-200 rounded-[16px] p-5 text-left hover:border-purple-300 hover:shadow-md transition-all group block focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                          <div className="w-10 h-10 rounded-[10px] bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <p className="text-[14px] font-bold text-navy mb-0.5">SOAP Notes</p>
                          <p className="text-[12px] text-gray-500">Document the visit</p>
                        </a>
                        
                        <button className="bg-white border border-gray-200 rounded-[16px] p-5 text-left hover:border-amber-300 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                          <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <p className="text-[14px] font-bold text-navy mb-0.5">Reschedule</p>
                          <p className="text-[12px] text-gray-500">Change time/date</p>
                        </button>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* Mobile Fixed Bottom Action Bar */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40 pb-safe">
                <div className="flex items-center gap-3">
                  {selected.status !== "completed" && selected.status !== "cancelled" && (
                    <button onClick={() => handleStatus("completed")} className="flex-1 h-[48px] bg-emerald-500 text-white font-bold rounded-[12px] text-[14px] shadow-sm flex items-center justify-center gap-2 active:bg-emerald-600 transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                  )}
                  {selected.status !== "in_progress" && selected.status !== "completed" && (
                    <button onClick={() => handleStatus("in_progress")} className="flex-1 h-[48px] bg-blue-600 text-white font-bold rounded-[12px] text-[14px] shadow-sm flex items-center justify-center gap-2 active:bg-blue-700 transition-colors">
                      <Zap className="w-4 h-4" /> Start Visit
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-[20px] font-extrabold text-navy mb-2">Select an Appointment</h3>
              <p className="text-[14px] text-gray-500 max-w-[320px] leading-relaxed">Choose an appointment from the list to view clinical context, update status, and manage records.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Prescribe Modal ── */}
      {activeAction === "rx" && selected && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[18px]">New Prescription</h4>
                <p className="text-white/70 text-[13px] mt-0.5">Issue script for {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}</p>
              </div>
              <button onClick={() => {
                setActiveAction(null);
                setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
              }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRx} className="p-6 space-y-5 bg-[#F8FAFC]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Quick Templates</span>
                <select onChange={(e) => { const t = RX_TEMPLATES[e.target.value]; if (t) setRx(t); }} className="text-[12px] bg-white border border-gray-200 rounded-[10px] px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold text-gray-700 shadow-sm cursor-pointer">
                  <option value="">Choose Template…</option>
                  <option value="amox">Amoxicillin (500mg Antibiotic)</option>
                  <option value="metro">Metronidazole (400mg Antibiotic)</option>
                  <option value="ibup">Ibuprofen (400mg Painkiller)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-navy">Drug Name</label>
                  <input required placeholder="Amoxicillin, etc." value={rx.drugName} onChange={(e) => setRx((p) => ({ ...p, drugName: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-navy">Dosage</label>
                  <input required placeholder="e.g. 500mg" value={rx.dosage} onChange={(e) => setRx((p) => ({ ...p, dosage: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-navy">Frequency</label>
                  <input required placeholder="e.g. 3 times daily" value={rx.frequency} onChange={(e) => setRx((p) => ({ ...p, frequency: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-navy">Duration</label>
                  <input required placeholder="e.g. 7 days" value={rx.duration} onChange={(e) => setRx((p) => ({ ...p, duration: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-navy">Instructions</label>
                <input required placeholder="Take with food, complete full course." value={rx.instructions} onChange={(e) => setRx((p) => ({ ...p, instructions: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-navy">Clinical Notes (Optional)</label>
                <input placeholder="Add internal dentist notes here..." value={rx.notes} onChange={(e) => setRx((p) => ({ ...p, notes: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div className="flex gap-3 pt-5">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-[44px] rounded-[12px] text-[14px] shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Save Prescription</>}
                </button>
                <button type="button" onClick={() => {
                  setActiveAction(null);
                  setRx({ drugName: "", dosage: "", frequency: "", duration: "", instructions: "", notes: "" });
                }} className="w-[120px] bg-white border border-gray-200 text-navy font-bold h-[44px] rounded-[12px] text-[14px] hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bill Modal ── */}
      {activeAction === "bill" && selected && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[18px]">Generate Invoice</h4>
                <p className="text-white/70 text-[13px] mt-0.5">Bill {selected.patient ? `${selected.patient.firstName} ${selected.patient.lastName}` : "Walk-in Patient"}</p>
              </div>
              <button onClick={() => {
                setActiveAction(null);
                setBill({ desc: "", cost: "" });
              }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBill} className="p-6 space-y-5 bg-[#F8FAFC]">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-navy">Treatment Description</label>
                <input required placeholder="e.g. Tooth restoration filling" value={bill.desc} onChange={(e) => setBill((p) => ({ ...p, desc: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-navy">Amount (€)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">€</span>
                  <input required type="number" step="0.01" min="0" placeholder="0.00" value={bill.cost} onChange={(e) => setBill((p) => ({ ...p, cost: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] pl-8 pr-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-5">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-[44px] rounded-[12px] text-[14px] shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5" /> Send Invoice</>}
                </button>
                <button type="button" onClick={() => {
                  setActiveAction(null);
                  setBill({ desc: "", cost: "" });
                }} className="w-[120px] bg-white border border-gray-200 text-navy font-bold h-[44px] rounded-[12px] text-[14px] hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Walk-in modal ── */}
      {showWalkin && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[18px]">Walk-in Check-in</h4>
                <p className="text-white/70 text-[13px] mt-0.5">Register a walk-in patient for today</p>
              </div>
              <button onClick={() => setShowWalkin(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleWalkin} className="p-6 space-y-5 bg-[#F8FAFC]">
              {[
                { label: "Patient Full Name", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "e.g. 085 123 4567" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[12px] font-bold text-navy">{label}</label>
                  <input type={type} required placeholder={placeholder} value={(walkin as any)[key]} onChange={(e) => setWalkin((p) => ({ ...p, [key]: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-navy">Reason for Visit</label>
                <div className="relative">
                  <select value={walkin.reason} onChange={(e) => setWalkin((p) => ({ ...p, reason: e.target.value }))} className="appearance-none w-full bg-white border border-gray-200 rounded-[10px] pl-3 pr-8 py-2.5 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer">
                    <option value="general-dentistry">General Dentistry</option>
                    <option value="emergency-dentistry">Emergency / Toothache</option>
                    <option value="teeth-cleaning">Hygiene / Cleaning</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-[48px] rounded-[12px] text-[15px] shadow-md flex items-center justify-center gap-2 transition-all active:scale-95">
                  <UserPlus className="w-5 h-5" /> Check In Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
