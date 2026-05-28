"use client";

import Link from "next/link";
import { useLiveData } from "@/lib/useLiveData";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  PackageCheck, RefreshCw, X, Check, Truck, CreditCard,
  Clock, Package, XCircle, ChevronDown, ChevronRight, ArrowUpRight, Search, Filter,
  User, Phone, Mail, StickyNote, Hash, Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState, useMemo } from "react";

interface Order {
  id: string; productName: string; quantity: number;
  totalAmount: string | number; paymentMethod: "cash" | "upi";
  upiReference?: string | null; status: "pending"|"paid"|"ready"|"completed"|"cancelled";
  customerName?: string | null; customerPhone?: string | null;
  customerEmail?: string | null; notes?: string | null;
  createdAt: string; updatedAt: string;
  paidAt?: string | null; fulfilledAt?: string | null; cancelledAt?: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string; stripe: string }> = {
  pending:   { label: "Pending",          color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-400",   stripe: "from-amber-400 to-amber-300" },
  paid:      { label: "Payment Confirmed",color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",    stripe: "from-blue-500 to-blue-400" },
  ready:     { label: "Ready for Pickup", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500 animate-pulse", stripe: "from-emerald-500 to-emerald-400" },
  completed: { label: "Completed",        color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-600",  stripe: "from-emerald-600 to-emerald-500" },
  cancelled: { label: "Cancelled",        color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-400",     stripe: "from-red-400 to-red-300" },
};

function normalizeOrders(raw: any): Order[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.orders)) return raw.orders;
  return [];
}

const TABS = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "pending" },
  { label: "Paid",      value: "paid" },
  { label: "Ready",     value: "ready" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: orders = [], loading, refetch } = useLiveData<Order[]>("/orders", {
    intervalMs: 15000, initialData: [], select: normalizeOrders,
  });

  const filtered = useMemo(() => {
    let list = activeTab ? orders.filter((o) => o.status === activeTab) : orders;
    if (search.trim()) {
      const t = search.toLowerCase();
      list = list.filter((o) =>
        o.productName.toLowerCase().includes(t) ||
        o.customerName?.toLowerCase().includes(t) ||
        o.id.toLowerCase().includes(t)
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, t.value ? orders.filter((o) => o.status === t.value).length : orders.length])), [orders]);

  const act = async (id: string, fn: () => Promise<void>) => {
    setActingId(id);
    try { await fn(); refetch(); }
    finally { setActingId(null); }
  };

  const handleStatus = (id: string, status: Order["status"]) =>
    act(id, async () => {
      await apiRequest(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success(`Order marked as ${status}.`);
    });

  const handleCancel = (id: string) =>
    act(id, async () => {
      const ok = await toast.confirm({ title: "Cancel order?", message: "This will restock the product inventory.", confirmText: "Cancel Order", danger: true });
      if (!ok) { setActingId(null); return; }
      await apiRequest(`/orders/${id}`, { method: "DELETE" });
      toast.success("Order cancelled and inventory restocked.");
    });

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
                <PackageCheck className="w-4 h-4 text-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Admin Panel</span>
            </div>
            <h1 className="font-serif text-2xl font-bold">Product Orders</h1>
            <p className="text-white/60 text-xs mt-1">Verify payments, manage pickup status, and restock inventory.</p>
          </div>
          <button onClick={refetch} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Pending Review", value: pendingCount },
            { label: "Revenue", value: `€${revenue.toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Tabs ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${activeTab === tab.value ? "bg-navy text-white border-navy shadow" : "bg-white border-gray-200 text-navy hover:border-gold hover:text-gold"}`}
            >
              {tab.label}
              {counts[tab.value] > 0 && <span className="ml-1.5 opacity-60">{counts[tab.value]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders list ── */}
      {loading && orders.length === 0 ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-3">
          <PackageCheck className="w-10 h-10 text-gray-200 mx-auto" />
          <p className="text-sm font-semibold text-navy font-serif">No orders found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const meta = STATUS_META[o.status] || STATUS_META.pending;
            const orderId = o.id.slice(0, 8).toUpperCase();

            return (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="group bg-white border border-gray-100 hover:border-gold/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between"
              >
                {/* Left Color Indicator Block */}
                <div className={`h-1.5 md:h-16 md:w-1.5 w-full bg-gradient-to-r md:bg-gradient-to-b ${meta.stripe} shrink-0`} />

                <div className="p-4 flex flex-1 items-center gap-4 justify-between w-full">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Status Icon in custom circle */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} border ${meta.border}`}>
                      {o.status === "pending" && <Clock className={`w-5 h-5 ${meta.color}`} />}
                      {o.status === "paid" && <CreditCard className={`w-5 h-5 ${meta.color}`} />}
                      {o.status === "ready" && <Package className={`w-5 h-5 ${meta.color}`} />}
                      {o.status === "completed" && <PackageCheck className={`w-5 h-5 ${meta.color}`} />}
                      {o.status === "cancelled" && <XCircle className={`w-5 h-5 ${meta.color}`} />}
                    </div>

                    {/* Order Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-navy truncate">{o.productName}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded">×{o.quantity}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {o.customerName && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {o.customerName}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono">#{orderId}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(o.createdAt)}
                        </span>
                        <span className="text-[11px] font-bold text-navy bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">
                          {o.paymentMethod === "upi" ? "UPI" : "Cash"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Area: Price & Interaction Arrow */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-black text-navy">€{Number(o.totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-gold/10 group-hover:border-gold/20 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
