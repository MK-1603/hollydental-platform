"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import { Plus, Trash2, Edit3, Eye, X, Pill, Calendar, RefreshCw, Syringe, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface PatientLite {
  id: string;
  firstName: string;
  lastName: string;
}

interface Prescription {
  id: string;
  patientId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
  createdAt: string;
}

function normalizePatients(raw: any): PatientLite[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.patients)) return raw.patients;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}
function normalizePrescriptions(raw: any): Prescription[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.prescriptions)) return raw.prescriptions;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

const TEMPLATES: Record<string, Partial<Prescription>> = {
  amox: {
    drugName: "Amoxicillin", dosage: "500mg", frequency: "Three times a day",
    duration: "7 days", instructions: "Take with food. Complete the full course.", notes: "Abscess swelling prevention",
  },
  metro: {
    drugName: "Metronidazole", dosage: "400mg", frequency: "Three times a day",
    duration: "5 days", instructions: "Do NOT drink alcohol while taking this medication.", notes: "Acute dental infection treatment",
  },
  ibup: {
    drugName: "Ibuprofen", dosage: "400mg", frequency: "Every 6 hours as needed",
    duration: "3 days", instructions: "Take with or after food. Maximum 3 tablets daily.", notes: "Post-extraction pain management",
  },
};

const inputCls = "w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-sm font-medium text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:bg-white transition-all";

export default function AdminPrescriptionsPage() {
  const { data: patients = [] } = useLiveData<PatientLite[]>("/patients", {
    intervalMs: 0, select: normalizePatients, initialData: [],
  });

  const { data: prescriptions = [], loading, refetch } = useLiveData<Prescription[]>("/prescriptions", {
    intervalMs: 30000, select: normalizePrescriptions, initialData: [],
  });

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");

  // View / Edit / Delete state
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [editRx, setEditRx] = useState<Prescription | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Edit form fields
  const [eDrugName, setEDrugName] = useState("");
  const [eDosage, setEDosage] = useState("");
  const [eFrequency, setEFrequency] = useState("");
  const [eDuration, setEDuration] = useState("");
  const [eInstructions, setEInstructions] = useState("");
  const [eNotes, setENotes] = useState("");

  useEffect(() => {
    if (!patientId && patients.length > 0) setPatientId(patients[0].id);
  }, [patients, patientId]);

  const patientName = (id: string) => {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "—";
  };

  const handleTemplateSelect = (key: string) => {
    const tpl = TEMPLATES[key];
    if (!tpl) return;
    setDrugName(tpl.drugName || "");
    setDosage(tpl.dosage || "");
    setFrequency(tpl.frequency || "");
    setDuration(tpl.duration || "");
    setInstructions(tpl.instructions || "");
    setNotes(tpl.notes || "");
  };

  const resetForm = () => {
    setDrugName(""); setDosage(""); setFrequency(""); setDuration(""); setInstructions(""); setNotes("");
  };

  const handleCreateRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.warning("Please select a patient first."); return; }
    setBtnLoading(true);
    try {
      await apiRequest("/prescriptions", {
        method: "POST",
        body: JSON.stringify({ patientId, drugName, dosage, frequency, duration, instructions, notes }),
      });
      setShowForm(false);
      resetForm();
      refetch();
      toast.success("Prescription added.");
    } catch (error: any) {
      toast.error(`Failed to create prescription: ${error?.message || "Please try again."}`);
    } finally {
      setBtnLoading(false);
    }
  };

  const openEdit = (rx: Prescription) => {
    setEditRx(rx);
    setEDrugName(rx.drugName);
    setEDosage(rx.dosage);
    setEFrequency(rx.frequency);
    setEDuration(rx.duration);
    setEInstructions(rx.instructions);
    setENotes(rx.notes || "");
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRx) return;
    setEditLoading(true);
    try {
      await apiRequest(`/prescriptions/${editRx.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          drugName: eDrugName, dosage: eDosage, frequency: eFrequency,
          duration: eDuration, instructions: eInstructions, notes: eNotes,
        }),
      });
      refetch();
      setEditRx(null);
      toast.success("Prescription updated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update prescription.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (rx: Prescription) => {
    const ok = await toast.confirm({
      title: `Delete ${rx.drugName} prescription?`,
      message: `This will permanently remove the prescription for ${patientName(rx.patientId)}.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/prescriptions/${rx.id}`, { method: "DELETE" });
      refetch();
      toast.success("Prescription deleted.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete prescription.");
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-[#F4F7FB] w-full font-inter select-none">
           {/* ── LUXURY HEADER ── */}
      <div className="bg-white px-4 md:px-6 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] sticky top-0 z-40 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-sm md:text-base font-bold text-[#0A1628] tracking-tight font-serif leading-none truncate">Prescriptions</h1>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button onClick={refetch} className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md hover:bg-[#F1F5F9] transition-all flex items-center justify-center text-[#475569] hover:text-[#0A1628]">
              <RefreshCw className={cn("w-3 h-3 md:w-3.5 md:h-3.5", loading && "animate-spin")} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              disabled={patients.length === 0}
              className="h-[28px] md:h-[32px] px-2 md:px-3 bg-gradient-to-r from-[#0A1628] to-[#1a2b45] hover:opacity-90 text-white text-[10px] md:text-xs font-bold rounded-md transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            >
              <Plus className="w-3 h-3 text-[#C9A84C]" />
              <span className="hidden sm:inline">New Script</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-8 space-y-6">
        {loading && prescriptions.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-2xl" />)}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="border border-[#E2E8F0] rounded-3xl bg-white p-12 text-center space-y-4 max-w-md mx-auto shadow-sm mt-10">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#E2E8F0]">
              <Pill className="w-8 h-8 text-[#94A3B8]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#0A1628]">No Prescriptions</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">You haven't issued any prescriptions yet. Click the "New Script" button to generate one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden">
                
                {/* Decorative background element */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#F8FAFC] to-white rounded-full opacity-50 pointer-events-none border border-[#E2E8F0]" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] text-[#0A1628] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
                        <Pill className="w-5 h-5 text-[#C9A84C]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif text-[15px] font-bold text-[#0A1628] group-hover:text-[#C9A84C] transition-colors truncate" title={rx.drugName}>
                          {rx.drugName}
                        </h4>
                        <p className="text-xs text-[#64748B] font-medium truncate mt-0.5" title={patientName(rx.patientId)}>
                          {patientName(rx.patientId)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-[#0A1628] text-white px-2.5 py-1 rounded-md shrink-0 uppercase tracking-widest shadow-sm">
                      {rx.duration}
                    </span>
                  </div>

                  <div className="space-y-2 text-[13px]">
                    <div className="bg-[#F8FAFC] rounded-xl p-3.5 space-y-2.5 border border-[#E2E8F0]/50">
                      <div className="flex items-start gap-2">
                        <Syringe className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block leading-none mb-1">Dosage</span>
                          <span className="text-[#0A1628] font-semibold">{rx.dosage}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block leading-none mb-1">Frequency</span>
                          <span className="text-[#0A1628] font-semibold">{rx.frequency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-1 mt-1">
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">Instructions</span>
                      <span className="text-[#475569] font-medium line-clamp-2 leading-relaxed" title={rx.instructions}>{rx.instructions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#94A3B8]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(rx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewRx(rx)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0A1628] hover:bg-[#F8FAFC] transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(rx)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#C9A84C] hover:bg-[#F8FAFC] transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(rx)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#FEE2E2] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── iOS Bottom Sheet Modal for Creating Prescription ─── */}
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          showForm ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-[#0A1628]/40 backdrop-blur-sm"
          onClick={() => { setShowForm(false); resetForm(); }}
        />
        
        {/* Bottom Sheet Drawer */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col max-h-[90vh]",
            showForm ? "translate-y-0" : "translate-y-full"
          )}
        >
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-4 pb-2 shrink-0 touch-none">
            <div className="w-12 h-1.5 bg-[#E2E8F0] rounded-full" />
          </div>

          <div className="flex items-center justify-between px-8 pb-4 border-b border-[#F1F5F9] shrink-0">
            <div>
              <h4 className="font-serif text-2xl font-bold text-[#0A1628]">New Script</h4>
              <p className="text-[#64748B] text-xs font-medium mt-1">Generate a secure clinical prescription.</p>
            </div>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <form id="new-rx-form" onSubmit={handleCreateRx} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Patient</label>
                <CustomSelect 
                  value={patientId} 
                  onChange={setPatientId} 
                  options={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))}
                  placeholder={patients.length === 0 ? "No patients" : "Select a patient..."}
                  className={inputCls} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block flex justify-between">
                  <span>Pre-fill Template</span>
                  <span className="text-[#C9A84C] normal-case text-xs">Optional</span>
                </label>
                <CustomSelect 
                  value="" 
                  onChange={handleTemplateSelect} 
                  options={[
                    { value: "amox", label: "Amoxicillin 500mg (Antibiotic)" },
                    { value: "metro", label: "Metronidazole 400mg (Antibiotic)" },
                    { value: "ibup", label: "Ibuprofen 400mg (Painkiller)" },
                  ]}
                  placeholder="-- Choose Template --"
                  className={inputCls} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Drug Name</label>
                  <input type="text" required value={drugName} onChange={(e) => setDrugName(e.target.value)} className={inputCls} placeholder="e.g. Amoxicillin" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Dosage</label>
                  <input type="text" required value={dosage} onChange={(e) => setDosage(e.target.value)} className={inputCls} placeholder="e.g. 500mg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Frequency</label>
                  <input type="text" required value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls} placeholder="e.g. 3x daily" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Duration</label>
                  <input type="text" required value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} placeholder="e.g. 7 days" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Pharmacist Instructions</label>
                <input type="text" required value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} placeholder="Take with food..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Clinical Notes (Internal)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Any private notes..." />
              </div>
            </form>
          </div>
          
          <div className="px-8 pt-4 pb-8 md:pb-6 border-t border-[#F1F5F9] shrink-0 bg-white">
            <button form="new-rx-form" type="submit" disabled={btnLoading} className="w-full bg-gradient-to-r from-[#0A1628] to-[#1a2b45] text-white font-bold h-14 rounded-xl text-[15px] shadow-lg shadow-navy/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center">
              {btnLoading ? "Generating..." : "Generate and Send Script"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Standard View Modal ─── */}
      {viewRx && (
        <Modal title={`${viewRx.drugName} Script`} onClose={() => setViewRx(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <InfoRow label="Patient" value={patientName(viewRx.patientId)} />
              <InfoRow label="Issued On" value={new Date(viewRx.createdAt).toLocaleDateString()} />
              <InfoRow label="Drug Name" value={viewRx.drugName} />
              <InfoRow label="Dosage" value={viewRx.dosage} />
              <InfoRow label="Frequency" value={viewRx.frequency} />
              <InfoRow label="Duration" value={viewRx.duration} />
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">Pharmacist Instructions</p>
              <p className="text-sm font-medium text-[#0A1628] leading-relaxed">{viewRx.instructions}</p>
            </div>
            {viewRx.notes && (
              <div className="border-l-2 border-[#C9A84C] pl-4 py-1">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Doctor's Notes</p>
                <p className="text-[13px] font-medium text-[#475569] italic">{viewRx.notes}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setViewRx(null); openEdit(viewRx); }} className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0A1628] hover:bg-[#F1F5F9] font-bold h-12 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <Edit3 className="w-4 h-4" /> Edit Script
              </button>
              <button onClick={() => { setViewRx(null); handleDelete(viewRx); }} className="flex-1 border border-[#FEE2E2] text-[#EF4444] font-bold h-12 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#FEF2F2] transition-colors">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Standard Edit Modal ─── */}
      {editRx && (
        <Modal title={`Edit Prescription`} onClose={() => setEditRx(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Drug Name</label>
                <input type="text" required value={eDrugName} onChange={(e) => setEDrugName(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Dosage</label>
                <input type="text" required value={eDosage} onChange={(e) => setEDosage(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Frequency</label>
                <input type="text" required value={eFrequency} onChange={(e) => setEFrequency(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Duration</label>
                <input type="text" required value={eDuration} onChange={(e) => setEDuration(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Instructions</label>
              <input type="text" required value={eInstructions} onChange={(e) => setEInstructions(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Clinical Notes</label>
              <input type="text" value={eNotes} onChange={(e) => setENotes(e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={editLoading} className="flex-1 bg-[#0A1628] text-white font-bold h-12 rounded-xl text-sm disabled:opacity-50 hover:bg-[#1a2b45] transition-colors">
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditRx(null)} className="flex-1 border border-[#E2E8F0] text-[#0A1628] font-bold h-12 rounded-xl text-sm hover:bg-[#F8FAFC] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}

/* ─── Shared View/Edit Modal Component ─── */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#0A1628]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[500px] shadow-2xl animate-fade-up overflow-hidden max-h-[90vh] flex flex-col border border-[#E2E8F0]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] shrink-0">
          <h4 className="font-serif text-lg font-bold text-[#0A1628] truncate pr-2">{title}</h4>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F1F5F9] text-[#64748B] transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{label}</p>
      <p className="text-[13px] text-[#0A1628] font-semibold">{value}</p>
    </div>
  );
}
