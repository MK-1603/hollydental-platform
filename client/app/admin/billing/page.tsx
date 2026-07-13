"use client";

import { useEffect, useState, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import { 
  Plus, Download, Eye, Trash2, Edit3, X, FileText, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, DollarSign, CreditCard, Send, Printer,
  Search, ChevronDown, Filter
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
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
  paid: { label: "Paid", icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  pending: { label: "Pending", icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  overdue: { label: "Overdue", icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  cancelled: { label: "Cancelled", icon: X, bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
};

export default function AdminBillingPage() {
  const { confirm } = useDialog();
  const { data: patients = [] } = useLiveData<PatientLite[]>("/patients", {
    intervalMs: 0, select: normalizePatients, initialData: [],
  });
  const { data: invoices = [], loading, refetch } = useLiveData<Invoice[]>("/billing/invoices", {
    intervalMs: 30000, select: normalizeInvoices, initialData: [],
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [patientId, setPatientId] = useState("");
  const [lineItems, setLineItems] = useState([{ description: "", price: "" }]);
  const [invoiceStatus, setInvoiceStatus] = useState<Invoice["status"]>("pending");

  useEffect(() => {
    if (!patientId && patients.length > 0) setPatientId(patients[0].id);
  }, [patients, patientId]);

  const patientName = (id?: string) => {
    if (!id) return "—";
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "—";
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const pName = patientName(i.patientId).toLowerCase();
      const matchesSearch = i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || pName.includes(search.toLowerCase());
      const matchesFilter = filterStatus === "all" || i.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [invoices, search, filterStatus, patients]);

  const kpis = useMemo(() => {
    const total = invoices.length;
    let paid = 0, pending = 0, overdueAmount = 0, totalRevenue = 0;
    
    invoices.forEach(inv => {
      const amt = parseFloat(inv.totalAmount.toString());
      if (inv.status === 'paid') { paid++; totalRevenue += amt; }
      else if (inv.status === 'pending') pending++;
      else if (inv.status === 'overdue') overdueAmount += amt;
    });

    return { total, paid, pending, totalRevenue, overdueAmount };
  }, [invoices]);

  const handleOpenDetails = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoiceStatus(inv.status);
    setIsAdding(false);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedInvoice(null);
    setLineItems([{ description: "", price: "" }]);
    setIsAdding(true);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedInvoice(null);
      setIsAdding(false);
    }, 300);
  };

  const handleSaveInvoice = async () => {
    if (!patientId) return toast.warning("Select a patient.");
    
    const validItems = lineItems.map(item => ({
      description: item.description || "Dental Services",
      quantity: 1,
      price: parseFloat(item.price) || 0
    })).filter(item => item.price > 0);

    if (validItems.length === 0) return toast.warning("At least one valid item cost is required.");
    
    const totalCost = validItems.reduce((acc, curr) => acc + curr.price, 0);
    
    setIsSaving(true);
    try {
      await apiRequest("/billing/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: validItems,
          subtotal: totalCost,
          totalAmount: totalCost,
          status: "pending"
        })
      });
      toast.success("Invoice created.");
      refetch();
      handleCloseDrawer();
    } catch (e: any) {
      toast.error(e.message || "Failed to create invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedInvoice) return;
    setIsSaving(true);
    try {
      await apiRequest(`/billing/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: invoiceStatus })
      });
      toast.success("Invoice status updated.");
      refetch();
      setSelectedInvoice(prev => prev ? {...prev, status: invoiceStatus} : null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Invoice",
      description: "Permanently delete this invoice? This action cannot be undone.",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      await apiRequest(`/billing/invoices/${id}`, { method: "DELETE" });
      toast.success("Invoice deleted.");
      refetch();
      if (selectedInvoice?.id === id) handleCloseDrawer();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete invoice");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] relative overflow-hidden">
      
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-white shrink-0 z-20">
        <div className="min-w-0 flex-1">
          <h1 className="text-[13px] sm:text-[14px] md:text-[20px] font-bold text-gray-900 font-serif whitespace-nowrap overflow-hidden text-ellipsis">Financial Dashboard</h1>
          <p className="text-[10px] md:text-[13px] text-gray-500 mt-0.5 md:mt-1 truncate">Manage patient invoices, payments, and revenue insights.</p>
        </div>
        <div className="flex shrink-0">
          <button onClick={handleOpenAdd} className="flex items-center justify-center w-8 h-8 md:w-auto md:px-4 md:py-2.5 bg-blue-600 text-white rounded-lg md:rounded-[10px] text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> 
            <span className="hidden md:inline ml-2">Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col p-4 sm:p-6 min-w-0 flex-1 overflow-hidden">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <div className="w-7 h-7 md:w-10 md:h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 md:w-5 md:h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-[16px] md:text-[24px] font-bold text-gray-900">€{kpis.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Overdue</p>
              <div className="w-7 h-7 md:w-10 md:h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-600" />
              </div>
            </div>
            <p className="text-[16px] md:text-[24px] font-bold text-red-600">€{kpis.overdueAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Paid</p>
              <div className="w-7 h-7 md:w-10 md:h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-[16px] md:text-[24px] font-bold text-gray-900">{kpis.paid}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pending</p>
              <div className="w-7 h-7 md:w-10 md:h-10 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 shrink-0">
                <Clock className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-[16px] md:text-[24px] font-bold text-gray-900">{kpis.pending}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-row items-center justify-between gap-2 mb-4 shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-[8px] pl-9 pr-8 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="relative shrink-0 dropdown-container">
            <button
              onClick={(e) => {
                const target = e.currentTarget.nextElementSibling;
                if (target) target.classList.toggle('hidden');
              }}
              onBlur={(e) => {
                const target = e.currentTarget.nextElementSibling;
                setTimeout(() => { if (target) target.classList.add('hidden'); }, 150);
              }}
              className="flex items-center gap-2 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer transition-colors hover:bg-gray-50"
            >
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span className="capitalize">{filterStatus}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </button>
            <div className="absolute right-0 top-[110%] w-32 bg-white border border-gray-100 shadow-xl rounded-[10px] py-1 z-30 hidden overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {['all', 'paid', 'pending', 'overdue'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    const el = document.activeElement as HTMLElement;
                    if (el) el.blur();
                  }}
                  className={`w-full text-left px-4 py-2 text-[13px] capitalize font-medium transition-colors ${filterStatus === status ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
             <div className="flex-1 flex items-center justify-center text-[14px] text-gray-500 bg-white md:bg-transparent rounded-[16px] md:border md:border-gray-200">
               Loading invoices...
             </div>
          ) : filteredInvoices.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[16px] border border-gray-200 shadow-sm">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-[16px] font-bold text-gray-900">No invoices found</p>
                <p className="text-[14px] text-gray-500 mt-1 max-w-[250px]">Try adjusting your search or filter.</p>
             </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-[80px] custom-scrollbar -mx-2 px-2">
                {filteredInvoices.map((inv) => {
                  const meta = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                  return (
                    <div 
                      key={inv.id} 
                      onClick={() => handleOpenDetails(inv)}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] cursor-pointer active:scale-[0.98] transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <h3 className="text-[14px] font-semibold text-gray-900 leading-snug">{patientName(inv.patientId)}</h3>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">#{inv.invoiceNumber}</p>
                        </div>
                        <span className="text-[15px] font-bold text-gray-900 shrink-0 flex items-center h-full">
                          {inv.status === 'cancelled' ? (
                             <span className="text-[11px] text-red-500 uppercase tracking-widest font-bold">Cancelled</span>
                          ) : (
                             `€${parseFloat(inv.totalAmount.toString()).toFixed(2)}`
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide ${meta.bg} ${meta.text}`}>
                          <meta.icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        
                        <span className="text-[11px] font-medium text-gray-400">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:flex flex-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50/80 sticky top-0 z-10 shadow-[0_1px_0_0_#e5e7eb]">
                      <tr>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Invoice Details</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInvoices.map((inv) => {
                        const meta = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                        const StatusIcon = meta.icon;
                        return (
                          <tr key={inv.id} onClick={() => handleOpenDetails(inv)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">#{inv.invoiceNumber}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">Issued: {new Date(inv.issueDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[13px] font-medium text-gray-900">
                              {patientName(inv.patientId)}
                            </td>
                            <td className="px-6 py-4">
                              {inv.status === 'cancelled' ? (
                                <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Cancelled</span>
                              ) : (
                                <span className="text-[14px] font-bold text-gray-900">€{parseFloat(inv.totalAmount.toString()).toFixed(2)}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide border ${meta.bg} ${meta.text} ${meta.border}`}>
                                <StatusIcon className="w-3.5 h-3.5" /> {meta.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-[12px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-gray-700 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer / Bottom Sheet */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-stretch md:justify-end">
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={handleCloseDrawer} />
          
          <div className="relative w-full md:max-w-lg bg-white h-auto max-h-[90vh] md:h-full md:max-h-full rounded-t-[24px] md:rounded-none shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300 pb-[env(safe-area-inset-bottom)] md:pb-0 overflow-hidden">
            
            {/* iOS Drag Handle (Mobile Only) */}
            <div className="md:hidden flex justify-center pt-3 pb-1 w-full bg-white shrink-0" onClick={handleCloseDrawer}>
              <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
            </div>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white md:bg-gray-50/50 shrink-0 gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] md:text-[18px] font-bold text-gray-900 truncate">
                  {isAdding ? "Create New Invoice" : `Invoice #${selectedInvoice?.invoiceNumber}`}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isAdding && selectedInvoice && (
                  <>
                    <button onClick={() => handleDelete(selectedInvoice.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={handleCloseDrawer} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[8px] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
              {isAdding ? (
                <div className="space-y-6 pb-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Select Patient <span className="text-red-500">*</span></label>
                    <select value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer">
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[12px] font-bold text-gray-700">Line Items <span className="text-red-500">*</span></label>
                      <button 
                        onClick={() => setLineItems([...lineItems, { description: "", price: "" }])}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>
                    {lineItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 relative bg-white p-2 rounded-[10px] border border-gray-200">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              value={item.description} 
                              onChange={e => {
                                const newItems = [...lineItems];
                                newItems[index].description = e.target.value;
                                setLineItems(newItems);
                              }} 
                              className="w-full px-3 py-2 bg-gray-50 border-none rounded-[6px] text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner" 
                              placeholder="Description" 
                            />
                          </div>
                          <div className="col-span-1 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[13px] font-medium">€</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={item.price} 
                              onChange={e => {
                                const newItems = [...lineItems];
                                newItems[index].price = e.target.value;
                                setLineItems(newItems);
                              }} 
                              className="w-full pl-6 pr-2 py-2 bg-gray-50 border-none rounded-[6px] text-[13px] text-gray-900 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                        {lineItems.length > 1 && (
                          <button 
                            onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveInvoice} disabled={isSaving} className="group relative w-full mt-6 mb-2 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-[12px] text-[15px] font-bold transition-all shadow-[0_5px_0_0_#1d4ed8,0_10px_15px_-3px_rgba(37,99,235,0.4)] hover:bg-blue-400 active:translate-y-[5px] active:shadow-[0_0px_0_0_#1d4ed8,0_0px_0px_0px_rgba(37,99,235,0)] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-[0_5px_0_0_#1d4ed8]">
                    <span className="relative z-10 flex items-center gap-2">
                       Create & Send Invoice
                       <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                  </button>
                </div>
              ) : selectedInvoice ? (
                <div className="space-y-6">
                  
                  {/* Status Management (Top Placed) */}
                  <div className="flex flex-col gap-2.5 p-3 rounded-[12px] border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-1.5 mb-0.5">
                       {(() => {
                         const Icon = STATUS_CONFIG[selectedInvoice.status].icon;
                         return <Icon className={`w-3.5 h-3.5 ${STATUS_CONFIG[selectedInvoice.status].text}`} />;
                       })()}
                       <span className={`text-[11px] font-bold ${STATUS_CONFIG[selectedInvoice.status].text} uppercase tracking-wider`}>
                          Current Status: {selectedInvoice.status}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="relative flex-1">
                         <select value={invoiceStatus} onChange={e => setInvoiceStatus(e.target.value as any)} className="w-full pl-2.5 pr-8 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[12px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer">
                           <option value="pending">Pending</option>
                           <option value="paid">Paid (Record Payment)</option>
                           <option value="overdue">Overdue</option>
                           <option value="cancelled">Cancelled</option>
                         </select>
                         <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                       </div>
                       <button onClick={handleUpdateStatus} disabled={isSaving || invoiceStatus === selectedInvoice.status} className="px-3 py-1.5 bg-blue-600 text-white rounded-[6px] text-[11px] font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 shrink-0 uppercase tracking-wider">
                          Update
                       </button>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4">
                     <h4 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1">Billed To</h4>
                     <p className="text-[15px] font-bold text-gray-900">{patientName(selectedInvoice.patientId)}</p>
                     <p className="text-[13px] text-gray-500 mt-1">Due: {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  {/* Line Items */}
                  <div>
                    <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-3">Line Items</h4>
                    <div className="border border-gray-100 rounded-[12px] overflow-hidden">
                      <table className="w-full text-left">
                         <thead className="bg-gray-50 border-b border-gray-100">
                           <tr>
                              <th className="px-4 py-2 text-[11px] font-bold text-gray-500">Description</th>
                              <th className="px-4 py-2 text-[11px] font-bold text-gray-500 text-right">Qty</th>
                              <th className="px-4 py-2 text-[11px] font-bold text-gray-500 text-right">Price</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                            {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                               selectedInvoice.items.map((item, idx) => (
                                  <tr key={idx}>
                                     <td className="px-4 py-3 text-[13px] text-gray-900">{item.description}</td>
                                     <td className="px-4 py-3 text-[13px] text-gray-500 text-right">{item.quantity}</td>
                                     <td className="px-4 py-3 text-[13px] font-medium text-gray-900 text-right">€{parseFloat(item.price.toString()).toFixed(2)}</td>
                                  </tr>
                               ))
                            ) : (
                               <tr><td colSpan={3} className="px-4 py-3 text-center text-[13px] text-gray-500">No items on this invoice.</td></tr>
                            )}
                            <tr className="bg-gray-50/50">
                               <td colSpan={2} className="px-4 py-3 text-[12px] font-bold text-gray-700 uppercase tracking-wider text-right">Total Due</td>
                               <td className="px-4 py-3 text-[15px] font-bold text-gray-900 text-right">
                                 {selectedInvoice.status === 'cancelled' ? (
                                   <span className="text-red-500 font-bold uppercase tracking-widest text-[12px]">Cancelled</span>
                                 ) : (
                                   `€${parseFloat(selectedInvoice.totalAmount.toString()).toFixed(2)}`
                                 )}
                               </td>
                            </tr>
                         </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-gray-100 pb-2">
                     <button onClick={() => {
                        generateInvoicePDF({
                          invoiceNumber: selectedInvoice.invoiceNumber,
                          issueDate: selectedInvoice.issueDate,
                          dueDate: selectedInvoice.dueDate,
                          status: selectedInvoice.status,
                          patientName: patientName(selectedInvoice.patientId),
                          items: selectedInvoice.items || [],
                          subtotal: selectedInvoice.totalAmount,
                          totalAmount: selectedInvoice.totalAmount
                        });
                        toast.success("Downloading PDF...");
                     }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[10px] text-[13px] font-bold hover:bg-gray-50 shadow-sm transition-colors active:scale-[0.98]">
                        <Download className="w-4 h-4" /> Download PDF
                     </button>
                  </div>

                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
