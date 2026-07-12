"use client";

import Link from "next/link";
import { useLiveData } from "@/lib/useLiveData";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { PackageCheck, RefreshCw, ShoppingBag, Clock, CheckCircle2, XCircle, Package, X, ChevronRight, Activity, TrendingUp } from "lucide-react";

interface Order {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  totalAmount: string | number;
  status: string;
  paymentMethod?: string;
  createdAt?: string;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string; stripe: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: "Pending Payment",
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400", stripe: "from-amber-400 to-amber-300",
    icon: <Clock className="w-4 h-4 text-amber-500" />,
  },
  paid: {
    label: "Payment Confirmed",
    color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400", stripe: "from-blue-500 to-blue-400",
    icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  },
  ready: {
    label: "Ready for Pickup",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", stripe: "from-emerald-500 to-emerald-400",
    icon: <Package className="w-4 h-4 text-emerald-500" />,
  },
  completed: {
    label: "Collected",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", stripe: "from-emerald-600 to-emerald-500",
    icon: <PackageCheck className="w-4 h-4 text-emerald-500" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-400", stripe: "from-red-400 to-red-300",
    icon: <XCircle className="w-4 h-4 text-red-500" />,
  },
};

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
}

export default function PatientOrdersPage() {
  const { data: orders = [], loading, refetch } = useLiveData<Order[]>(
    "/orders/my",
    { intervalMs: 30000, initialData: [] }
  );

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await toast.confirm({ title: "Cancel Order?", message: "Are you sure you want to cancel this order?", confirmText: "Cancel Order", danger: true });
    if (!ok) return;
    try {
      await apiRequest(`/orders/${id}`, { method: "DELETE" });
      toast.success("Order cancelled.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order.");
    }
  };

  const active = orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const past = orders.filter((o) => ["completed", "cancelled"].includes(o.status));
  const totalSpent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Premium header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Patient Portal</span>
            </div>
            <h1 className="font-serif text-2xl font-bold">My Orders</h1>
            <p className="text-white/60 text-xs mt-1">Track your oral care product orders and pickup status.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={refetch} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/portal/products" className="bg-gold hover:bg-yellow-400 text-navy font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all hover:scale-105 shadow-lg">
              <ShoppingBag className="w-3.5 h-3.5" /> Shop
            </Link>
          </div>
        </div>
        {orders.length > 0 && (
          <div className="relative mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Total Orders", value: orders.length },
              { label: "Active", value: active.length },
              { label: "Total Spent", value: `€${totalSpent.toFixed(2)}` },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
                <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-[100px] shimmer rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl bg-white p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto">
            <PackageCheck className="w-8 h-8 text-gray-200" />
          </div>
          <h3 className="font-serif text-base font-semibold text-navy">No orders yet</h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
            Browse our oral care products and place your first order for clinic pickup.
          </p>
          <Link href="/portal/products" className="inline-flex items-center gap-1.5 bg-gold hover:bg-yellow-500 text-navy font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-colors">
            <ShoppingBag className="w-3.5 h-3.5" /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                Active Orders ({active.length})
              </h2>
              {active.map((o) => <OrderCard key={o.id} order={o} onCancel={handleCancel} />)}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Order History ({past.length})
              </h2>
              {past.map((o) => <OrderCard key={o.id} order={o} onCancel={handleCancel} />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order: o, onCancel }: { order: Order; onCancel: (e: React.MouseEvent, id: string) => void }) {
  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
  const canCancel = o.status === "pending";
  const isCancelled = o.status === "cancelled";
  const isCompleted = o.status === "completed";
  const orderId = o.id.slice(0, 8).toUpperCase();

  return (
    <Link
      href={`/portal/orders/${o.id}`}
      className={`group block rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all overflow-hidden border ${
        isCancelled ? "border-gray-100 opacity-75 hover:opacity-100" :
        isCompleted ? "border-emerald-100 hover:border-emerald-200" :
        "border-gray-100 hover:border-gold/40"
      }`}
    >
      {/* Gradient top stripe */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.stripe}`} />

      <div className="p-4 flex items-center gap-4">
        {/* Status icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
          {cfg.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-navy truncate">{o.productName}</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded">×{o.quantity}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${o.status === "ready" ? "animate-pulse" : ""}`} />
              {cfg.label}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">#{orderId}</span>
            {o.createdAt && <span className="text-[10px] text-gray-400">{fmtDate(o.createdAt)}</span>}
          </div>
        </div>

        {/* Right: price + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy">€{Number(o.totalAmount || 0).toFixed(2)}</p>
            <p className="text-[10px] text-gray-400">{o.paymentMethod === "upi" ? "UPI" : "Cash"}</p>
          </div>
          {canCancel && (
            <button onClick={(e) => onCancel(e, o.id)} className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 transition-colors" title="Cancel order">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-gold/10 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold transition-colors" />
          </div>
        </div>
      </div>

      {/* Ready for pickup banner */}
      {o.status === "ready" && (
        <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-[11px] text-emerald-700 font-semibold">Ready to collect at the clinic reception!</span>
        </div>
      )}

      {/* View details footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gold font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
          View full details <ChevronRight className="w-3 h-3" />
        </span>
        <span className="text-[10px] text-gray-400 sm:hidden font-bold">€{Number(o.totalAmount || 0).toFixed(2)}</span>
      </div>
    </Link>
  );
}
