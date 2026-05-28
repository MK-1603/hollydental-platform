"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import {
  Plus,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  Edit3,
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf";

interface PatientLite {
  id: string;
  firstName: string;
  lastName: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  totalAmount: string | number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  items?: InvoiceItem[];
  patientId?: string;
}

function normalizePatients(raw: any): PatientLite[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.patients)) return raw.patients;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}
function normalizeInvoices(raw: any): Invoice[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.invoices)) return raw.invoices;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

const STATUS_CONFIG = {
  paid: { label: "Paid", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-100" },
  cancelled: { label: "Cancelled", icon: X, color: "text-gray-500 bg-gray-50 border-gray-100" },
};

export default function AdminBillingPage() {
  const { data: patients = [] } = useLiveData<PatientLite[]>("/patients", {
    intervalMs: 0,
    select: normalizePatients,
    initialData: [],
  });

  const { data: invoices = [], loading, refetch } = useLiveData<Invoice[]>("/billing/invoices", {
    intervalMs: 30000,
    select: normalizeInvoices,
    initialData: [],
  });

  const [showBuilder, setShowBuilder] = useState(false);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Create form
  const [patientId, setPatientId] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemCost, setItemCost] = useState("");

  // Edit form
  const [editStatus, setEditStatus] = useState<Invoice["status"]>("pending");
  const [editDesc, setEditDesc] = useState("");
  const [editCost, setEditCost] = useState("");

  useEffect(() => {
    if (!patientId && patients.length > 0) setPatientId(patients[0].id);
  }, [patients, patientId]);

  const patientName = (id?: string) => {
    if (!id) return "—";
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "—";
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.warning("Please select a patient first."); return; }
    setBuilderLoading(true);
    try {
      const cost = parseFloat(itemCost);
      if (isNaN(cost) || cost <= 0) { toast.warning("Please enter a valid cost."); return; }
      await apiRequest("/billing/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          items: [{ description: itemDesc, quantity: 1, price: cost }],
          subtotal: cost,
          vatAmount: 0,
          totalAmount: cost,
        }),
      });
      setShowBuilder(false);
      setItemDesc("");
      setItemCost("");
      refetch();
      toast.success("Invoice generated.");
    } catch (error: any) {
      toast.error(`Failed to create invoice: ${error?.message || "Please try again."}`);
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleEditOpen = (inv: Invoice) => {
    setEditInvoice(inv);
    setEditStatus(inv.status);
    setEditDesc(inv.items?.[0]?.description || "");
    setEditCost(String(inv.totalAmount || ""));
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;
    setEditLoading(true);
    try {
      await apiRequest(`/billing/invoices/${editInvoice.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: editStatus }),
      });
      refetch();
      setEditInvoice(null);
      toast.success("Invoice updated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update invoice.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    const ok = await toast.confirm({
      title: `Delete ${num}?`,
      message: "This invoice will be permanently deleted. This can't be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/billing/invoices/${id}`, { method: "DELETE" });
      refetch();
      toast.success("Invoice deleted.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete invoice.");
    }
  };

  const handleDownloadPdf = (inv: Invoice) => {
    generateInvoicePDF({
      invoiceNumber: inv.invoiceNumber,
      issueDate:     inv.issueDate,
      dueDate:       inv.dueDate,
      paidAt:        undefined,
      status:        inv.status,
      patientName:   patientName(inv.patientId),
      items:         Array.isArray(inv.items) ? inv.items : [],
      subtotal:      inv.totalAmount,
      vatAmount:     0,
      totalAmount:   inv.totalAmount,
    });
  };

  const totalCollected = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4 gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">Billing &amp; Invoices</h1>
          <p className="text-gray-500 text-xs mt-1">Review revenue, process settlements, and generate invoices.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowBuilder(true)}
            disabled={patients.length === 0}
            className="bg-gold hover:bg-gold-dark text-navy font-bold px-3 sm:px-4 py-2 rounded-lg text-xs shadow flex items-center gap-1.5 focus:outline-none disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
          <button
            onClick={refetch}
            className="border border-navy text-navy font-semibold p-2 sm:px-4 rounded-lg text-xs hover:bg-gray-50 focus:outline-none flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Total Collected</span>
          <span className="text-xl sm:text-3xl font-serif font-bold text-navy block mt-1">€{totalCollected.toLocaleString()}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Outstanding</span>
          <span className="text-xl sm:text-3xl font-serif font-bold text-amber-600 block mt-1">€{totalPending.toLocaleString()}</span>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Total Invoices</span>
          <span className="text-xl sm:text-3xl font-serif font-bold text-navy block mt-1">{invoices.length}</span>
        </div>
      </div>

      {/* Invoices list */}
      {loading && invoices.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="border border-gray-200 rounded-2xl bg-white p-12 text-center space-y-3 max-w-md mx-auto">
          <FileText className="w-10 h-10 text-gray-200 mx-auto" />
          <h3 className="font-serif text-base font-semibold text-navy">No Invoices</h3>
          <p className="text-gray-500 text-xs leading-relaxed">No invoices have been generated yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv) => {
            const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
            const Icon = sc.icon;
            return (
              <div key={inv.id} className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-50 pb-3">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-navy text-xs group-hover:text-gold transition-colors">{inv.invoiceNumber}</span>
                      <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5" title={patientName(inv.patientId)}>
                        Patient: {patientName(inv.patientId)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border shrink-0 ${sc.color}`}>
                      <Icon className="w-2.5 h-2.5" />
                      {sc.label}
                    </span>
                  </div>

                  {/* Pricing / Details */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Total Amount</span>
                      <span className="font-serif font-bold text-navy text-base block mt-0.5">€{Number(inv.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Issued Date</span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">{new Date(inv.issueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 w-full">
                    <button onClick={() => setViewInvoice(inv)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-blue-100 text-blue-500 text-[10px] font-bold hover:bg-blue-50 transition-colors active:scale-95">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => handleEditOpen(inv)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gold/30 text-gold text-[10px] font-bold hover:bg-gold/5 transition-colors active:scale-95">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDownloadPdf(inv)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-navy/20 text-navy text-[10px] font-bold hover:bg-navy/5 transition-colors active:scale-95" title="PDF">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors active:scale-95" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) }
      {/* ─── View Modal ─── */}
      {viewInvoice && (
        <Modal title={`Invoice ${viewInvoice.invoiceNumber}`} onClose={() => setViewInvoice(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <InfoRow label="Patient" value={patientName(viewInvoice.patientId)} />
              <InfoRow label="Invoice #" value={viewInvoice.invoiceNumber} mono />
              <InfoRow label="Date" value={new Date(viewInvoice.issueDate).toLocaleDateString()} />
              <InfoRow label="Amount" value={`€${Number(viewInvoice.totalAmount).toFixed(2)}`} />
              <InfoRow label="Status" value={STATUS_CONFIG[viewInvoice.status]?.label || viewInvoice.status} />
              {viewInvoice.dueDate && <InfoRow label="Due" value={new Date(viewInvoice.dueDate).toLocaleDateString()} />}
            </div>
            {viewInvoice.items && viewInvoice.items.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-navy uppercase tracking-widest mb-2">Line Items</p>
                <div className="space-y-1.5">
                  {viewInvoice.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      <span className="text-navy font-medium truncate mr-4">{item.description}</span>
                      <span className="text-navy font-bold shrink-0">€{Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleDownloadPdf(viewInvoice)}
                className="flex-1 bg-navy text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={() => { setViewInvoice(null); handleEditOpen(viewInvoice); }}
                className="flex-1 bg-gold text-navy font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Edit Modal ─── */}
      {editInvoice && (
        <Modal title={`Edit ${editInvoice.invoiceNumber}`} onClose={() => setEditInvoice(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Invoice Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Invoice["status"])}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-gold"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Invoice #</span><span className="font-mono font-semibold">{editInvoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-navy">€{Number(editInvoice.totalAmount).toFixed(2)}</span></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={editLoading} className="flex-1 bg-gold hover:bg-gold-dark text-navy font-bold py-2.5 rounded-lg text-xs disabled:opacity-50">
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditInvoice(null)} className="flex-1 border border-gray-200 text-navy font-semibold py-2.5 rounded-lg text-xs hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Create Invoice Drawer ─── */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-[460px] p-6 space-y-6 shadow-2xl relative flex flex-col justify-between animate-fade-up overflow-y-auto">
            <button onClick={() => setShowBuilder(false)} className="absolute right-4 top-4 text-gray-400 hover:text-navy text-lg font-bold">&times;</button>
            <form onSubmit={handleCreateInvoice} className="space-y-4 flex-1 mt-6">
              <div className="border-b border-gray-200 pb-3">
                <h4 className="font-serif text-lg font-bold text-navy">New Clinical Invoice</h4>
                <p className="text-gray-500 text-[10px] mt-0.5">Generate a billing record for a procedure.</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-navy">Patient</label>
                  <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-gold">
                    {patients.length === 0 ? <option value="">No patients</option> : patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-navy">Treatment Description</label>
                  <input type="text" required value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="e.g. Tooth restoration filling" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-gold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-navy">Cost Fee (€)</label>
                  <input type="number" step="0.01" min="0" required value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="e.g. 150.00" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-gold" />
                </div>
              </div>
              <button type="submit" disabled={builderLoading} className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-2.5 rounded-lg text-xs shadow-md transition-colors disabled:opacity-50 mt-4">
                {builderLoading ? "Generating…" : "Generate and Send Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Modal ─── */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl animate-fade-up overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h4 className="font-serif text-sm font-bold text-navy">{title}</h4>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-navy font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
