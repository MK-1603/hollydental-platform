"use client";

import { useState, useMemo } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { FileText, Calendar, Receipt, Download, RefreshCw, X, ShieldCheck, CreditCard, AlertCircle, TrendingUp, Activity, ArrowRight, Printer, Lock, QrCode, CheckCircle2, ShieldAlert, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf";

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: string | number;
  subtotal?: string | number;
  vatAmount?: string | number;
  paidAt?: string | null;
  status: "paid" | "pending" | "overdue" | "cancelled" | string;
  items: InvoiceItem[];
}

function normalizeInvoices(raw: any): Invoice[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.invoices)) return raw.invoices;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

// Visual styles for statuses
function getStatusStyles(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "overdue":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    case "cancelled":
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    default:
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }
}

// 3D Visual gradients for virtual billing cards
function getInvoiceCardBg(status: string) {
  switch (status) {
    case "paid":
      return "from-emerald-700 via-teal-900 to-slate-950 border-emerald-500/20";
    case "overdue":
      return "from-rose-700 via-rose-950 to-slate-950 border-red-500/20";
    case "cancelled":
      return "from-gray-600 via-gray-800 to-slate-900 border-white/5";
    default:
      return "from-amber-600 via-amber-950 to-slate-950 border-amber-500/20";
  }
}

export default function PatientInvoicesPage() {
  const {
    data: invoices = [],
    loading,
    refetch,
  } = useLiveData<Invoice[]>("/billing/invoices/my", {
    intervalMs: 20000,
    select: normalizeInvoices,
    initialData: [],
  });

  // Popup Modal Selection State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleDownloadPdf = (inv: Invoice) => {
    generateInvoicePDF({
      invoiceNumber: inv.invoiceNumber,
      issueDate:     inv.issueDate,
      dueDate:       inv.dueDate,
      paidAt:        inv.paidAt,
      status:        inv.status,
      patientName:   "Patient Profile",
      items:         Array.isArray(inv.items) ? inv.items : [],
      subtotal:      inv.subtotal ?? inv.totalAmount,
      vatAmount:     inv.vatAmount ?? 0,
      totalAmount:   inv.totalAmount,
    });
    toast.success(`Downloaded ${inv.invoiceNumber} PDF receipt.`);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const unpaidBal = invoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

    const lastPaid = invoices
      .filter((i) => i.status === "paid" && i.paidAt)
      .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())[0];
    const lastPaidDate = lastPaid?.paidAt ? formatDate(lastPaid.paidAt) : "—";

    return { totalCount, paidCount, unpaidBal, lastPaidDate };
  }, [invoices]);



  return (
    <div className="space-y-6 font-sans pb-12 relative">
      


      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy">
            My Billing & Invoices
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Track statements, review clinical itemized fees, and complete secure payments.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
          <button
            onClick={refetch}
            className="text-xs font-semibold text-gold border border-gold/20 hover:bg-gold/5 px-4 py-2 rounded-xl flex items-center gap-1.5 focus:outline-none transition-colors h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* 🚀 1. Premium Metrics Overview Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-2 relative overflow-hidden group hover:border-gold/30 transition-all">
          <div className="absolute right-3 top-3 text-gold/10 group-hover:scale-110 transition-transform">
            <CreditCard className="w-12 h-12" />
          </div>
          <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">Unpaid Balance</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-navy">€{metrics.unpaidBal.toFixed(2)}</span>
            <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-2 relative overflow-hidden group hover:border-gold/30 transition-all">
          <div className="absolute right-3 top-3 text-emerald-500/10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">Paid Invoices</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-navy">{metrics.paidCount}</span>
            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Cleared</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-2 relative overflow-hidden group hover:border-gold/30 transition-all">
          <div className="absolute right-3 top-3 text-navy/5 group-hover:scale-110 transition-transform">
            <Receipt className="w-12 h-12" />
          </div>
          <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">Total Statements</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-navy">{metrics.totalCount}</span>
            <span className="text-[8px] font-bold text-navy bg-navy/5 px-2 py-0.5 rounded-full">Statements</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-2 relative overflow-hidden group hover:border-gold/30 transition-all">
          <div className="absolute right-3 top-3 text-indigo-500/10 group-hover:scale-110 transition-transform">
            <Calendar className="w-12 h-12" />
          </div>
          <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">Last Payment</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-navy truncate block max-w-full">{metrics.lastPaidDate}</span>
            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">Clear</span>
          </div>
        </div>
      </div>

      {/* 🚀 2. Invoices List Rendered as Gorgeous Virtual Cards Grid */}
      {loading && invoices.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="h-[210px] shimmer rounded-3xl" />
          <div className="h-[210px] shimmer rounded-3xl" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-3xl bg-white p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <Receipt className="w-10 h-10 text-gold/30 mx-auto animate-pulse" />
          <h3 className="font-serif text-base font-bold text-navy">No Statements Issued</h3>
          <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
            You don't have any billing statements logged. Dental items raised during checkout or treatments will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          {invoices.map((inv) => {
            const total = Number(inv.totalAmount || 0);

            return (
              <div
                key={inv.id}
                onClick={() => {
                  setSelectedInvoice(inv);
                }}
                className="w-full max-w-sm h-[210px] relative font-sans cursor-pointer group"
              >
                {/* Visual Glassmorphic credit-card shaped invoice representation */}
                <div
                  className={`w-full h-full rounded-3xl p-5 bg-gradient-to-br ${getInvoiceCardBg(
                    inv.status
                  )} text-white flex flex-col justify-between shadow-lg hover:shadow-xl hover:scale-102 border transition-all duration-300 relative overflow-hidden`}
                >
                  
                  {/* Glowing background highlights */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.06),_transparent_45%)] pointer-events-none" />

                  {/* Top Header of Card */}
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-white/50 tracking-widest uppercase">Hollyhill Dental</span>
                      <span className="block font-serif text-[9px] font-bold uppercase tracking-widest text-gold">Invoice Statement</span>
                    </div>

                    {/* Status pulsing badge */}
                    <span
                      className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyles(
                        inv.status
                      )}`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {/* Middle Section: Gold Chip and formatted invoice digits */}
                  <div className="flex items-center gap-4 z-10 mt-1">
                    
                    {/* Hologram Card Chip */}
                    <div className="w-10 h-7 rounded bg-gradient-to-r from-amber-400 to-yellow-300 relative overflow-hidden border border-gold/40 flex items-center justify-center shadow-inner shrink-0">
                      <div className="absolute inset-x-0 top-1/4 h-px bg-navy/15" />
                      <div className="absolute inset-x-0 top-2/4 h-px bg-navy/15" />
                      <div className="absolute inset-x-0 top-3/4 h-px bg-navy/15" />
                      <div className="absolute inset-y-0 left-1/3 w-px bg-navy/15" />
                      <div className="absolute inset-y-0 left-2/3 w-px bg-navy/15" />
                    </div>

                    {/* Invoice ID styled like card numbers */}
                    <div className="font-mono text-sm font-bold tracking-widest text-white/90">
                      {inv.invoiceNumber.replace("-", " ").replace("-", " ")}
                    </div>
                  </div>

                  {/* Description text row */}
                  {inv.items?.length > 0 && (
                    <div className="text-[10px] text-white/60 truncate italic max-w-full z-10 border-t border-white/5 pt-1.5 leading-snug">
                      {inv.items.map((it) => it.description).join(" · ")}
                    </div>
                  )}

                  {/* Bottom details: Issued, Due, Price */}
                  <div className="flex justify-between items-end z-10">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] leading-normal text-white/60">
                      <div>
                        <span className="block text-[7px] text-white/40 uppercase tracking-wider">Issued</span>
                        <span className="font-bold text-white">{formatDate(inv.issueDate)}</span>
                      </div>
                      <div>
                        {inv.status === "paid" ? (
                          <>
                            <span className="block text-[7px] text-white/40 uppercase tracking-wider">Cleared</span>
                            <span className="font-bold text-emerald-400">{inv.paidAt ? formatDate(inv.paidAt) : "Yes"}</span>
                          </>
                        ) : (
                          <>
                            <span className="block text-[7px] text-white/40 uppercase tracking-wider">Good Thru</span>
                            <span className="font-bold text-amber-400">{formatDate(inv.dueDate)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[7px] text-white/40 uppercase tracking-wider">Total Charges</span>
                      <span className="font-serif text-base font-bold text-white leading-none">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🚀 3. Stunning, Fully-Aesthetic Invoice Popup Modal (Popup Modal) */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-in flex flex-col my-8 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-navy p-5 text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gold animate-bounce" />
                <span className="font-serif text-sm font-bold tracking-wider">STATEMENT & INVOICE DETAILS</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors focus:outline-none cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto min-h-0 text-xs">
              
              {/* Clinic Letterhead */}
              <div className="border-b border-gray-100 pb-4 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-bold text-navy uppercase tracking-wider">Hollyhill Dental Clinic</h4>
                  <p className="text-gray-400 text-[10px] leading-relaxed max-w-xs">
                    Unit 6 Hollyhill Shopping Centre, Co. Cork, T23 E030, Ireland
                  </p>
                  <p className="text-gray-400 text-[10px]">Phone: +353 21 430 3072</p>
                </div>
                
                <span
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 border ${getStatusStyles(
                    selectedInvoice.status
                  )}`}
                >
                  {selectedInvoice.status}
                </span>
              </div>

              {/* Invoice Date Details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100 text-[11px] leading-normal">
                <div>
                  <span className="text-gray-400 block font-semibold text-[9px] uppercase tracking-wider mb-0.5">Invoice Number</span>
                  <span className="font-mono font-bold text-navy">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold text-[9px] uppercase tracking-wider mb-0.5">Issued To</span>
                  <span className="font-bold text-navy">Patient Profile</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold text-[9px] uppercase tracking-wider mb-0.5">Issue Date</span>
                  <span className="font-semibold text-navy">{formatDate(selectedInvoice.issueDate)}</span>
                </div>
                <div>
                  {selectedInvoice.status === "paid" && selectedInvoice.paidAt ? (
                    <>
                      <span className="text-gray-400 block font-semibold text-[9px] uppercase tracking-wider mb-0.5">Payment Date</span>
                      <span className="font-bold text-emerald-600">{formatDate(selectedInvoice.paidAt)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 block font-semibold text-[9px] uppercase tracking-wider mb-0.5">Payment Due Date</span>
                      <span className="font-bold text-amber-700">{formatDate(selectedInvoice.dueDate)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2">
                <h5 className="text-[10px] uppercase font-bold text-navy tracking-wider">Itemized treatments</h5>
                
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 text-navy font-bold text-[9px] uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedInvoice.items || []).map((it, i) => {
                        const price = Number(it.price || 0);
                        const qty = Number(it.quantity || 1);
                        return (
                          <tr key={i} className="text-navy font-medium">
                            <td className="p-3 leading-relaxed">{it.description}</td>
                            <td className="p-3 text-center text-gray-500">{qty}</td>
                            <td className="p-3 text-right text-gray-500">€{price.toFixed(2)}</td>
                            <td className="p-3 text-right font-bold">€{(price * qty).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subtotals */}
              <div className="border-t border-gray-100 pt-3.5 ml-auto max-w-xs space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>€{Number(selectedInvoice.subtotal || selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                {Number(selectedInvoice.vatAmount || 0) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax / VAT (0%)</span>
                    <span>€{Number(selectedInvoice.vatAmount).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-navy text-sm items-baseline">
                  <span className="uppercase text-[10px] tracking-widest">Total Statement</span>
                  <span className="font-serif text-lg font-bold">€{Number(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* 💳 DYNAMIC PAYMENT GATEWAY MODULE (ONLY FOR UNPAID/PENDING INVOICES) */}
              {selectedInvoice.status !== "paid" && selectedInvoice.status !== "cancelled" && (
                <div className="border-t border-gray-150 pt-5 space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-200 animate-scale-in text-center">
                  
                  <div className="w-12 h-12 bg-navy/5 rounded-full flex items-center justify-center mx-auto text-navy">
                    <Lock className="w-6 h-6 text-gold animate-pulse" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-serif text-sm font-bold text-navy uppercase tracking-wider">🔒 Online Payments Coming Soon</h4>
                    <p className="text-gray-400 text-[10px] leading-relaxed max-w-xs mx-auto">
                      Online bill pay options via **Credit/Debit Card, UPI QR, & Counter Cashier** checkouts are currently <span className="font-bold text-gold">Under Active Development</span>.
                    </p>
                  </div>

                  <div className="bg-amber-50 text-amber-700 border border-amber-100 p-3.5 rounded-xl text-[10px] font-semibold text-left flex items-start gap-2.5 max-w-sm mx-auto leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Hollyhill clinical billing gateways are being structured in sandbox developer preview. Active real-time bank reconciliation and clearing connections will go live shortly. 
                    </span>
                  </div>

                  <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-full"><CreditCard className="w-3 h-3 text-gray-400" /> Cards (Soon)</span>
                    <span className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-full"><QrCode className="w-3 h-3 text-gray-400" /> UPI QR (Soon)</span>
                    <span className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 text-gray-400" /> Cash counter (Soon)</span>
                  </div>

                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-gray-50 p-5 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-bold text-gray-500 hover:text-navy transition-colors focus:outline-none"
              >
                Close View
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  className="bg-navy hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 focus:outline-none transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-gold" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
