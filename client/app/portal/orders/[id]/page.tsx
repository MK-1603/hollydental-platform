"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, apiUpload } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ArrowLeft, Package, PackageCheck, Clock, CheckCircle2, XCircle, ShoppingBag, AlertCircle, X, Phone, MapPin, CreditCard, Hash, Calendar, FileText, RefreshCw, Activity, Upload, Camera, Download, Lock } from "lucide-react";
import { CLINIC } from "@/lib/constants";
import { generateOrderReceiptPDF } from "@/lib/pdf";

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  age?: number | null;
  address?: string | null;
}

interface Order {
  id: string;
  productName: string;
  productId?: string | null;
  quantity: number;
  unitPrice: string | number;
  totalAmount: string | number;
  status: string;
  paymentMethod?: string;
  upiReference?: string | null;
  notes?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  createdAt?: string;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string;
  patientProfile?: PatientProfile | null;
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; stripe: string;
  icon: React.ReactNode; step: number; desc: string;
}> = {
  pending: {
    label: "Pending Payment", step: 1, stripe: "from-amber-400 to-amber-300",
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    desc: "Your order has been placed. Please pay at the clinic reception or upload UPI proof.",
  },
  paid: {
    label: "Payment Confirmed", step: 2, stripe: "from-blue-500 to-blue-400",
    color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200",
    icon: <CheckCircle2 className="w-5 h-5 text-blue-500 animate-pulse" />,
    desc: "Payment received. The clinic is preparing your oral care items.",
  },
  ready: {
    label: "Ready for Pickup", step: 3, stripe: "from-emerald-500 to-emerald-400",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
    icon: <Package className="w-5 h-5 text-emerald-500 animate-bounce" />,
    desc: "Your order is ready! Please collect it at the clinic desk.",
  },
  completed: {
    label: "Collected", step: 4, stripe: "from-emerald-600 to-emerald-500",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
    icon: <PackageCheck className="w-5 h-5 text-emerald-500" />,
    desc: "Order collected. Thank you for your purchase!",
  },
  cancelled: {
    label: "Cancelled", step: 0, stripe: "from-red-400 to-red-300",
    color: "text-red-700", bg: "bg-red-50", border: "border-red-200",
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    desc: "This order has been cancelled.",
  },
};

const STEPS = [
  { key: "pending",   label: "Order Placed",       icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "paid",      label: "Payment Confirmed",   icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: "ready",     label: "Ready for Pickup",    icon: <Package className="w-4 h-4" /> },
  { key: "completed", label: "Collected",           icon: <PackageCheck className="w-4 h-4" /> },
];

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function fmtShort(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
}

function DetailTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled") return null;
  const currentStep = STATUS_CONFIG[order.status]?.step ?? 1;
  const timestamps: Record<string, string | null | undefined> = {
    pending: order.createdAt, paid: order.paidAt,
    ready: order.paidAt ? order.updatedAt : null, completed: order.fulfilledAt,
  };
  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const ts = timestamps[step.key];
        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                done ? "bg-emerald-500 border-emerald-500 text-white" :
                active ? "bg-gold border-gold text-navy shadow-lg shadow-gold/30 scale-105" :
                "bg-white border-gray-200 text-gray-300"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 rounded-full min-h-[36px] ${done ? "bg-emerald-400" : "bg-gray-100"}`} />
              )}
            </div>
            <div className={`pb-6 flex-1 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
              <p className={`text-sm font-bold ${done ? "text-emerald-700" : active ? "text-navy text-base" : "text-gray-300"}`}>
                {step.label}
                {active && <span className="ml-2 text-[9px] font-bold bg-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
              </p>
              {(done || active) && ts ? (
                <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(ts)}</p>
              ) : (
                <p className="text-[11px] text-gray-300 mt-0.5">{active ? "In progress" : "Pending"}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-navy mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) {
      setLoading(true);
    }
    setNotFound(false);
    try {
      const data = await apiRequest(`/orders/${id}`);
      if (!data || !data.id) throw new Error("Order not found");
      setOrder(data);
    } catch (err: any) {
      if (!silent) {
        if (err?.status === 404 || err?.message?.toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          toast.error(err?.message || "Failed to load order.");
          router.replace("/portal/orders");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [id, router]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadResp = await apiUpload("/orders/upload-receipt", { file });
      if (!uploadResp?.imageUrl) throw new Error("Upload failed");

      await apiRequest(`/orders/${id}/submit-receipt`, {
        method: "PATCH",
        body: JSON.stringify({ upiReference: uploadResp.imageUrl }),
      });

      toast.success("Receipt photo uploaded successfully!");
      fetchOrder(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload receipt.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder(false);
    }
  }, [id, fetchOrder]);

  // Real-time status background polling every 5 seconds if order is pending
  useEffect(() => {
    if (!id || !order || order.status !== "pending") return;

    const intervalId = setInterval(() => {
      fetchOrder(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [id, order?.status, fetchOrder]);

  const handleCancel = async () => {
    const ok = await toast.confirm({
      title: "Cancel Order?",
      message: "Are you sure you want to cancel this order?",
      confirmText: "Cancel Order",
      danger: true,
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await apiRequest(`/orders/${id}`, { method: "DELETE" });
      toast.success("Order cancelled.");
      fetchOrder(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
        <div className="h-8 shimmer rounded-xl w-48" />
        <div className="h-[120px] shimmer rounded-2xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-[220px] shimmer rounded-2xl" />
            <div className="h-[300px] shimmer rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-[200px] shimmer rounded-2xl" />
            <div className="h-[250px] shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
        <Link href="/portal/orders" className="inline-flex items-center gap-2 text-xs text-navy hover:text-gold font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 text-gold" /> Back to My Orders
        </Link>
        <div className="border border-gray-100 rounded-3xl bg-white p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="font-serif text-xl font-bold text-navy">Order Not Found</h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
            This order reference ID does not exist in the database, likely due to a recent system seed refresh.
          </p>
          <Link href="/portal/orders" className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy-light text-white font-bold px-5 py-3 rounded-xl text-xs shadow transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const canCancel = order.status === "pending";
  const isCancelled = order.status === "cancelled";
  const isPaid = order.status !== "pending" && order.status !== "cancelled";
  const orderId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Visual Breadcrumb Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/portal/orders" className="p-2.5 rounded-xl border border-gray-200 hover:border-gold hover:text-gold text-navy transition-colors bg-white shadow-xs">
            <ArrowLeft className="w-4 h-4 text-gold" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy">Order #{orderId}</h1>
            <p className="text-xs text-gray-400 mt-1">Placed {fmtShort(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => fetchOrder(false)} className="p-2.5 rounded-xl border border-gray-200 hover:border-gold hover:text-gold text-navy transition-colors bg-white shadow-xs" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Modern Split 12-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
        
        {/* LEFT COLUMN: timeline, purchased item, and alerts (Spans 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Status banner */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm bg-white">
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cfg.stripe}`} />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100">
              {cfg.icon}
            </div>
            <div className="flex-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color} bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 inline-block mb-1.5`}>
                {cfg.label}
              </span>
              <p className="text-sm font-semibold text-navy leading-relaxed">{cfg.desc}</p>
              
              {order.status === "ready" && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                  <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <a href={CLINIC.phoneHref} className="hover:underline flex items-center gap-1"><Phone className="w-3 h-3 text-gold" /> {CLINIC.phone}</a>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" /> {CLINIC.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product list summary card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-3 font-sans">
              <Package className="w-4 h-4 text-gold animate-pulse" />
              Purchased Product Details
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy/5 to-navy/10 flex items-center justify-center shrink-0 border border-navy/5">
                <ShoppingBag className="w-8 h-8 text-navy/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy text-base leading-snug">{order.productName}</p>
                <p className="text-xs text-gray-400 mt-1">Quantity: <span className="font-bold text-navy bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{order.quantity} unit{order.quantity > 1 ? "s" : ""}</span></p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4 text-xs font-sans">
              <div>
                <span className="text-gray-400 block mb-0.5">Unit price</span>
                <span className="font-bold text-navy text-sm">€{Number(order.unitPrice || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Quantity</span>
                <span className="font-bold text-navy text-sm">× {order.quantity}</span>
              </div>
              <div className="text-right">
                <span className="text-gold block font-bold uppercase tracking-wider text-[10px] mb-0.5">Total Amount</span>
                <span className="font-serif text-lg font-bold text-navy">€{Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline progress card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-3 font-sans">
              <Clock className="w-4 h-4 text-gold animate-pulse" />
              Order Progress Timeline
            </h2>
            {isCancelled ? (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Order Cancelled</p>
                  <p className="text-xs text-red-500 mt-0.5">{order.cancelledAt ? `Cancelled on ${fmtDate(order.cancelledAt)}` : "This order was cancelled."}</p>
                </div>
              </div>
            ) : (
              <DetailTimeline order={order} />
            )}
          </div>

          {/* UPI Upload proof screenshot card */}
          {order.paymentMethod === "upi" && order.status === "pending" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-3 font-sans">
                <Upload className="w-4 h-4 text-gold animate-bounce" />
                Upload Payment Screenshot Receipt
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload a screenshot photo of your successful bank transfer receipt to confirm your payment with the clinic desk.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={uploading}
                  className="hidden"
                  id="order-receipt-file"
                />
                <label
                  htmlFor="order-receipt-file"
                  className={`flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gold hover:bg-gold/5 text-navy font-bold px-4 py-3.5 rounded-2xl text-xs cursor-pointer transition-all flex-1 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <Camera className="w-4 h-4 text-gold shrink-0" />
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  ) : order.upiReference?.startsWith("http") ? (
                    "Change Receipt Screenshot"
                  ) : (
                    "Upload Receipt Screenshot"
                  )}
                </label>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR COLUMN: actions, clinical parameters, counter details (Spans 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-2.5 font-sans">
              Invoice Receipt Actions
            </h2>
            
            {/* ENABLE DOWNLOAD ONLY IF PAID */}
            {isPaid ? (
              <button
                onClick={() => generateOrderReceiptPDF({
                  orderId:       order.id,
                  productName:   order.productName,
                  quantity:      order.quantity,
                  unitPrice:     order.unitPrice,
                  totalAmount:   order.totalAmount,
                  paymentMethod: order.paymentMethod || "cash",
                  upiReference:  typeof order.upiReference === "string" && !order.upiReference.startsWith("http") ? order.upiReference : null,
                  status:        order.status,
                  customerName:  order.customerName,
                  customerEmail: order.customerEmail,
                  customerPhone: order.customerPhone,
                  notes:         order.notes,
                  createdAt:     order.createdAt || new Date().toISOString(),
                  paidAt:        order.paidAt,
                  patientProfile: order.patientProfile,
                })}
                className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy-light text-white font-bold py-3 rounded-xl text-xs transition-all shadow hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-gold animate-bounce" />
                <span>Download Invoice PDF</span>
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-400 font-bold py-3 rounded-xl text-xs cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 text-gray-300" />
                  <span>Download Invoice PDF</span>
                </button>
                <p className="text-[9px] text-amber-600 font-bold text-center mt-1 animate-pulse">
                  ⚠️ Invoice unlocked after payment confirmation
                </p>
              </div>
            )}

            <Link href="/portal/products" className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gold hover:text-gold text-navy font-semibold py-2.5 rounded-xl text-xs transition-colors bg-white">
              <ShoppingBag className="w-3.5 h-3.5 text-gold" /> Browse Products
            </Link>

            {canCancel && (
              <button onClick={handleCancel} disabled={cancelling} className="w-full flex items-center justify-center gap-2 border border-red-100 hover:bg-red-50 text-red-600 font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50">
                <X className="w-3.5 h-3.5" />
                {cancelling ? "Cancelling…" : "Cancel This Order"}
              </button>
            )}
          </div>

          {/* Reference Info & Patient Demographics Overview */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-2.5 font-sans">
              Clinical Parameter Overview
            </h2>
            
            <DetailRow icon={<Hash className="w-4 h-4 text-gold" />} label="Order Reference" value={<span className="font-mono text-xs break-all block">{order.id}</span>} />
            <DetailRow icon={<Calendar className="w-4 h-4 text-gold" />} label="Placed On" value={fmtDate(order.createdAt)} />
            <DetailRow icon={<CreditCard className="w-4 h-4 text-gold" />} label="Payment method" value={
              order.paymentMethod === "card" ? "Credit/Debit Card" :
              order.paymentMethod === "upi" ? "UPI Bank Transfer" : "Cash on Pickup"
            } />

            {/* Display Patient Profile details if present */}
            {order.patientProfile && (
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2 text-xs">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-gold mb-1">Registered Patient Parameters</span>
                <div className="grid grid-cols-2 gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Age</span>
                    <span className="font-bold text-navy">{order.patientProfile.age || "—"} yrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Gender</span>
                    <span className="font-bold text-navy uppercase">{order.patientProfile.gender || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Blood Group</span>
                    <span className="font-bold text-gold">{order.patientProfile.bloodGroup || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Birth Date</span>
                    <span className="font-bold text-navy">{fmtShort(order.patientProfile.dateOfBirth)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {order.upiReference && (
              <DetailRow
                icon={<Hash className="w-4 h-4 text-gold" />}
                label="UPI Payment Proof"
                value={
                  order.upiReference.startsWith("http") ? (
                    <div className="mt-1 space-y-1">
                      <div className="relative w-28 h-20 border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:border-gold hover:shadow transition-all group cursor-pointer" onClick={() => window.open(order.upiReference!, "_blank")}>
                        <img src={order.upiReference} alt="Payment Proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all">
                          View Receipt
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block">Screenshot Attached</span>
                    </div>
                  ) : (
                    <span className="font-mono text-xs">{order.upiReference}</span>
                  )
                }
              />
            )}
            {order.paidAt && <DetailRow icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} label="Paid On" value={fmtDate(order.paidAt)} />}
            {order.fulfilledAt && <DetailRow icon={<PackageCheck className="w-4 h-4 text-emerald-500" />} label="Collected On" value={fmtDate(order.fulfilledAt)} />}
            {order.cancelledAt && <DetailRow icon={<XCircle className="w-4 h-4 text-red-500" />} label="Cancelled On" value={fmtDate(order.cancelledAt)} />}
            {order.notes && <DetailRow icon={<FileText className="w-4 h-4 text-gold" />} label="Notes" value={order.notes} />}
          </div>

          {/* Location info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-2.5 font-sans">
              Clinic Location Pickup
            </h2>
            <DetailRow icon={<MapPin className="w-4 h-4 text-gold" />} label="Address" value={CLINIC.address} />
            <DetailRow icon={<Phone className="w-4 h-4 text-gold" />} label="Phone Support" value={<a href={CLINIC.phoneHref} className="text-gold hover:underline font-bold">{CLINIC.phone}</a>} />
          </div>

          {/* Help box */}
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 space-y-2">
            <p className="text-xs font-bold text-navy flex items-center gap-2 font-sans">
              <AlertCircle className="w-3.5 h-3.5 text-gold" /> Need help?
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">Contact the front desk and quote your Order Reference ID.</p>
            <a href={CLINIC.phoneHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:underline">
              <Phone className="w-3.5 h-3.5" /> {CLINIC.phone}
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
