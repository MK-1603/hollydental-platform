"use client";

import { useState, useMemo, useEffect } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useDialog } from "@/components/DialogProvider";
import { 
  Search, X, Check, Package, CreditCard, User, Clock, Filter, 
  Download, FileText, FileDown, Activity, ChevronRight, Ban
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Order {
  id: string;
  productName: string;
  quantity: number;
  totalAmount: string | number;
  paymentMethod: "cash" | "upi";
  upiReference?: string | null;
  status: "pending" | "paid" | "ready" | "completed" | "cancelled";
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  paid: { label: "Paid", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  ready: { label: "Ready", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  completed: { label: "Completed", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const TABS = [
  { label: "All Orders", value: "" },
  { label: "Pending Review", value: "pending" },
  { label: "Payment Confirmed", value: "paid" },
  { label: "Ready for Pickup", value: "ready" },
  { label: "Completed", value: "completed" }
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const { confirm } = useDialog();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: rawOrders = [], loading, refetch, error } = useLiveData<any>("/orders", {
    intervalMs: 15000,
    initialData: [],
  });

  const orders: Order[] = useMemo(() => {
    if (Array.isArray(rawOrders)) return rawOrders;
    if (Array.isArray(rawOrders?.orders)) return rawOrders.orders;
    return [];
  }, [rawOrders]);

  useEffect(() => {
    if (error) toast.error("Failed to load orders.");
  }, [error]);

  const filteredOrders = useMemo(() => {
    let list = activeTab ? orders.filter(o => o.status === activeTab) : orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.productName.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiRequest(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      toast.success(`Order status updated to ${newStatus}.`);
      refetch();
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update order.");
    }
  };

  const handleCancelOrder = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Cancel Order",
      description: "Are you sure you want to cancel this order? This cannot be undone.",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      await apiRequest(`/orders/${id}`, { method: "DELETE" });
      toast.success("Order cancelled.");
      refetch();
      if (selectedOrder?.id === id) {
         setSelectedOrder(prev => prev ? { ...prev, status: "cancelled" as any } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order.");
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] relative overflow-hidden h-full">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 font-serif">Order Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Process patient prescriptions, retail orders, and fulfillments.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex flex-wrap items-center p-1 bg-gray-100 rounded-[10px] shadow-inner">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-1.5 text-[12px] font-bold rounded-[8px] transition-all ${
                  activeTab === tab.value 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-[10px] pl-9 pr-8 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Robust Table */}
        <div className="flex-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/80 sticky top-0 z-10 shadow-[0_1px_0_0_#e5e7eb]">
                <tr>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Order ID & Item</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[13px] text-gray-500">Loading orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-[14px] font-bold text-gray-900">No orders found</p>
                      <p className="text-[13px] text-gray-500 mt-1">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                     const meta = STATUS_META[o.status] || STATUS_META.pending;
                     return (
                      <tr key={o.id} onClick={() => handleOpenDetails(o)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[10px] bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{o.productName}</p>
                              <p className="text-[11px] text-gray-500 font-mono mt-0.5">#{o.id.slice(0, 8).toUpperCase()} • Qty: {o.quantity}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <User className="w-4 h-4 text-gray-400" />
                             <div>
                                <p className="text-[13px] font-bold text-gray-900">{o.customerName || "Walk-in Patient"}</p>
                                {o.customerPhone && <p className="text-[11px] text-gray-500">{o.customerPhone}</p>}
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-[13px] font-bold text-gray-900">€{parseFloat(o.totalAmount.toString()).toFixed(2)}</span>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-500 uppercase tracking-wide">
                               <CreditCard className="w-3 h-3" /> {o.paymentMethod}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide border ${meta.bg} ${meta.text} ${meta.border}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[12px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-gray-700 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Drawer Slide-over */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={handleCloseDrawer} />
          
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[16px] font-bold text-gray-900">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCancelOrder(selectedOrder.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors" title="Cancel Order">
                  <Ban className="w-4 h-4" />
                </button>
                <button onClick={handleCloseDrawer} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[8px] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              
               {/* Order Info */}
               <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-[12px] shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <Package className="w-6 h-6 text-indigo-600" />
                     </div>
                     <div>
                        <h3 className="text-[15px] font-bold text-gray-900">{selectedOrder.productName}</h3>
                        <p className="text-[13px] text-gray-500 mt-0.5">Quantity: <span className="font-bold text-gray-700">{selectedOrder.quantity}</span></p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                     <p className="text-[18px] font-bold text-gray-900">€{parseFloat(selectedOrder.totalAmount.toString()).toFixed(2)}</p>
                  </div>
               </div>

               {/* Patient & Payment */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4">
                     <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-3">Patient Details</h4>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[13px]">
                           <User className="w-4 h-4 text-gray-400" />
                           <span className="font-bold text-gray-900">{selectedOrder.customerName || "Walk-in Patient"}</span>
                        </div>
                        {selectedOrder.customerPhone && (
                           <div className="text-[12px] text-gray-500 pl-6">{selectedOrder.customerPhone}</div>
                        )}
                        {selectedOrder.customerEmail && (
                           <div className="text-[12px] text-gray-500 pl-6 truncate">{selectedOrder.customerEmail}</div>
                        )}
                     </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4">
                     <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-3">Payment Info</h4>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[13px]">
                           <CreditCard className="w-4 h-4 text-gray-400" />
                           <span className="font-bold text-gray-900 uppercase">{selectedOrder.paymentMethod}</span>
                        </div>
                        {selectedOrder.upiReference && (
                           <div className="text-[12px] text-gray-500 pl-6 font-mono break-all">Ref: {selectedOrder.upiReference}</div>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide border ml-6 ${
                           ['paid', 'ready', 'completed'].includes(selectedOrder.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                           {['paid', 'ready', 'completed'].includes(selectedOrder.status) ? "Paid" : "Pending"}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Timeline */}
               <div>
                  <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-4">Order Timeline</h4>
                  <div className="relative pl-6 space-y-6 border-l-2 border-gray-100 ml-3">
                     
                     <div className="relative">
                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[19.5px] top-1"></div>
                        <p className="text-[13px] font-bold text-gray-900">Order Placed</p>
                        <p className="text-[11px] text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                     </div>

                     {selectedOrder.paidAt && (
                        <div className="relative">
                           <div className="absolute w-3 h-3 bg-white border-2 border-emerald-500 rounded-full -left-[19.5px] top-1"></div>
                           <p className="text-[13px] font-bold text-gray-900">Payment Confirmed</p>
                           <p className="text-[11px] text-gray-500">{new Date(selectedOrder.paidAt).toLocaleString()}</p>
                        </div>
                     )}

                     {selectedOrder.fulfilledAt && (
                        <div className="relative">
                           <div className="absolute w-3 h-3 bg-emerald-500 border-2 border-emerald-500 rounded-full -left-[19.5px] top-1"></div>
                           <p className="text-[13px] font-bold text-gray-900">Order Completed</p>
                           <p className="text-[11px] text-gray-500">{new Date(selectedOrder.fulfilledAt).toLocaleString()}</p>
                        </div>
                     )}

                     {selectedOrder.cancelledAt && (
                        <div className="relative">
                           <div className="absolute w-3 h-3 bg-red-500 border-2 border-red-500 rounded-full -left-[19.5px] top-1"></div>
                           <p className="text-[13px] font-bold text-gray-900">Order Cancelled</p>
                           <p className="text-[11px] text-gray-500">{new Date(selectedOrder.cancelledAt).toLocaleString()}</p>
                        </div>
                     )}
                     
                  </div>
               </div>

               {selectedOrder.notes && (
                  <div>
                     <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-2">Customer Notes</h4>
                     <p className="text-[13px] text-gray-700 bg-amber-50 border border-amber-100 p-3 rounded-[8px] italic">
                        "{selectedOrder.notes}"
                     </p>
                  </div>
               )}

            </div>

            {/* Contextual Actions Footer */}
            {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
               <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                 {selectedOrder.status === 'pending' && (
                   <button onClick={() => handleUpdateStatus(selectedOrder.id, "paid")} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-[10px] text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm">
                     <CreditCard className="w-4 h-4" /> Confirm Payment
                   </button>
                 )}
                 {selectedOrder.status === 'paid' && (
                   <button onClick={() => handleUpdateStatus(selectedOrder.id, "ready")} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-[10px] text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
                     <Package className="w-4 h-4" /> Mark as Ready
                   </button>
                 )}
                 {selectedOrder.status === 'ready' && (
                   <button onClick={() => handleUpdateStatus(selectedOrder.id, "completed")} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-[10px] text-[13px] font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                     <Check className="w-4 h-4" /> Complete Order
                   </button>
                 )}
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
