"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import { Plus, Trash2, Edit3, Eye, X, Pill, Calendar, RefreshCw } from "lucide-react";

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

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-gold focus:bg-white transition-colors";

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
    <div className="pb-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-200 py-4 px-4 md:px-6 gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">Prescriptions Manager</h1>
          <p className="text-gray-500 text-xs mt-1">Generate drug scripts, pre-fill template dosages, and send to patient portals.</p>
        </div>
        <div className="flex gap-2 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setShowForm(true)}
            disabled={patients.length === 0}
            className="bg-gold hover:bg-gold-dark text-navy font-bold px-3 sm:px-4 py-2 rounded-lg text-xs shadow flex items-center gap-1.5 focus:outline-none disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Prescription</span>
            <span className="sm:hidden">New</span>
          </button>
          <button onClick={refetch} className="border border-gray-200 text-navy p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-6 space-y-6">
      {/* List */}
      {loading && prescriptions.length === 0 ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
      ) : prescriptions.length === 0 ? (
        <div className="border border-gray-200 rounded-2xl bg-white p-12 text-center space-y-3 max-w-md mx-auto">
          <Pill className="w-10 h-10 text-gray-200 mx-auto" />
          <h3 className="font-serif text-base font-semibold text-navy">No Prescriptions</h3>
          <p className="text-gray-500 text-xs leading-relaxed">No prescriptions have been issued yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full group">
              <div className="space-y-4">
                {/* Top Header */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                      <Pill className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif text-sm font-bold text-navy group-hover:text-gold transition-colors truncate" title={rx.drugName}>
                        {rx.drugName}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5" title={patientName(rx.patientId)}>
                        Patient: {patientName(rx.patientId)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-navy text-white px-2.5 py-1 rounded-lg shrink-0 uppercase tracking-wider shadow-sm">
                    {rx.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="bg-gray-50/80 rounded-xl p-3 space-y-1.5 border border-gray-100">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Dosage & Frequency</span>
                      <span className="text-navy font-semibold block mt-0.5">{rx.dosage} · {rx.frequency}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Instructions</span>
                      <span className="text-gray-600 block mt-0.5 line-clamp-2" title={rx.instructions}>{rx.instructions}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewRx(rx)} className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-blue-100 text-blue-500 text-[10px] font-bold hover:bg-blue-50 transition-colors active:scale-95">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => openEdit(rx)} className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-gold/30 text-gold text-[10px] font-bold hover:bg-gold/5 transition-colors active:scale-95">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(rx)} className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors active:scale-95" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* ─── View Modal ─── */}
      {viewRx && (
        <Modal title={`${viewRx.drugName} — ${patientName(viewRx.patientId)}`} onClose={() => setViewRx(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Patient" value={patientName(viewRx.patientId)} />
              <InfoRow label="Issued" value={new Date(viewRx.createdAt).toLocaleDateString()} />
              <InfoRow label="Drug" value={viewRx.drugName} />
              <InfoRow label="Dosage" value={viewRx.dosage} />
              <InfoRow label="Frequency" value={viewRx.frequency} />
              <InfoRow label="Duration" value={viewRx.duration} />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[9px] font-bold text-navy uppercase tracking-widest mb-1">Instructions</p>
              <p className="text-xs text-gray-600 leading-relaxed">{viewRx.instructions}</p>
            </div>
            {viewRx.notes && (
              <div className="border-l-2 border-gold/40 pl-3">
                <p className="text-[9px] font-bold text-navy uppercase tracking-widest mb-1">Doctor's Notes</p>
                <p className="text-xs text-gray-500 italic">{viewRx.notes}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setViewRx(null); openEdit(viewRx); }} className="flex-1 bg-gold text-navy font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => { setViewRx(null); handleDelete(viewRx); }} className="flex-1 border border-red-100 text-red-500 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Edit Modal ─── */}
      {editRx && (
        <Modal title={`Edit Prescription`} onClose={() => setEditRx(null)}>
          <form onSubmit={handleEditSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Drug Name</label>
                <input type="text" required value={eDrugName} onChange={(e) => setEDrugName(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Dosage</label>
                <input type="text" required value={eDosage} onChange={(e) => setEDosage(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Frequency</label>
                <input type="text" required value={eFrequency} onChange={(e) => setEFrequency(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Duration</label>
                <input type="text" required value={eDuration} onChange={(e) => setEDuration(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Instructions</label>
              <input type="text" required value={eInstructions} onChange={(e) => setEInstructions(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Clinical Notes</label>
              <input type="text" value={eNotes} onChange={(e) => setENotes(e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={editLoading} className="flex-1 bg-gold hover:bg-gold-dark text-navy font-bold py-2.5 rounded-lg text-xs disabled:opacity-50">
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditRx(null)} className="flex-1 border border-gray-200 text-navy font-semibold py-2.5 rounded-lg text-xs hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Create Prescription Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl animate-fade-up overflow-y-auto max-h-[95vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h4 className="font-serif text-base font-bold text-navy">New Prescription</h4>
                <p className="text-gray-400 text-[10px]">Create an authorized clinical drug instruction.</p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateRx} className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Patient</label>
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required className={inputCls}>
                  {patients.length === 0 ? <option value="">No patients</option> : patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Pre-fill Template</label>
                <select onChange={(e) => handleTemplateSelect(e.target.value)} className={inputCls}>
                  <option value="">-- Choose Template --</option>
                  <option value="amox">Amoxicillin 500mg (Antibiotic)</option>
                  <option value="metro">Metronidazole 400mg (Antibiotic)</option>
                  <option value="ibup">Ibuprofen 400mg (Painkiller)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Drug Name</label>
                  <input type="text" required value={drugName} onChange={(e) => setDrugName(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Dosage</label>
                  <input type="text" required value={dosage} onChange={(e) => setDosage(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Frequency</label>
                  <input type="text" required value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Duration</label>
                  <input type="text" required value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Pharmacist Instructions</label>
                <input type="text" required value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Clinical Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
              </div>

              <button type="submit" disabled={btnLoading} className="w-full bg-navy text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors disabled:opacity-50 mt-2">
                {btnLoading ? "Generating script…" : "Generate and Send Script"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared components ─── */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl animate-fade-up overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h4 className="font-serif text-sm font-bold text-navy truncate pr-2">{title}</h4>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-navy font-semibold">{value}</p>
    </div>
  );
}
