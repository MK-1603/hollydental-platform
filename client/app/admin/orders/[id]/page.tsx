"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  ArrowLeft, Package, PackageCheck, Clock, CheckCircle2,
  XCircle, ShoppingBag, User, Phone, Mail,
  CreditCard, Calendar, RefreshCw, Sparkles, Printer, ArrowUpRight, StickyNote
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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
  status: "pending" | "paid" | "ready" | "completed" | "cancelled";
  paymentMethod: "cash" | "upi";
  upiReference?: string | null;
  notes?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  createdAt: string;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  updatedAt: string;
  patientProfile?: PatientProfile | null;
}

const STATUS_META: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string; stripe: string;
  icon: React.ReactNode; desc: string; step: number;
}> = {
  pending: {
    label: "Pending Payment", step: 1, stripe: "from-amber-400 to-amber-300",
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400",
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    desc: "Order placed. Awaiting patient payment at reception or UPI confirmation.",
  },
  paid: {
    label: "Payment Confirmed", step: 2, stripe: "from-blue-500 to-blue-400",
    color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500",
    icon: <CreditCard className="w-5 h-5 text-blue-500 animate-pulse" />,
    desc: "Payment verified. Clinic staff is preparing the package for collection.",
  },
  ready: {
    label: "Ready for Pickup", step: 3, stripe: "from-emerald-500 to-emerald-400",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500 animate-pulse",
    icon: <Package className="w-5 h-5 text-emerald-500" />,
    desc: "Product package is ready at the clinic reception desk for the patient to collect.",
  },
  completed: {
    label: "Completed", step: 4, stripe: "from-emerald-600 to-emerald-500",
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-600",
    icon: <PackageCheck className="w-5 h-5 text-emerald-600" />,
    desc: "Package collected by the customer. Transaction closed.",
  },
  cancelled: {
    label: "Cancelled", step: 0, stripe: "from-red-400 to-red-300",
    color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-400",
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    desc: "This order has been cancelled and products restocked.",
  },
};

const STEPS = [
  { key: "pending",   label: "Order Placed",       icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "paid",      label: "Payment Confirmed",   icon: <CreditCard className="w-4 h-4" /> },
  { key: "ready",     label: "Ready for Pickup",    icon: <Package className="w-4 h-4" /> },
  { key: "completed", label: "Collected",           icon: <PackageCheck className="w-4 h-4" /> },
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
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
          router.replace("/admin/orders");
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatus = async (status: Order["status"]) => {
    if (!order) return;
    setActing(true);
    try {
      await apiRequest(`/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      toast.success(`Order marked as ${status}.`);
      fetchOrder(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    const ok = await toast.confirm({
      title: "Cancel Order?",
      message: "Are you sure you want to cancel this order? This will restore the product stock count.",
      confirmText: "Cancel Order",
      danger: true
    });
    if (!ok) return;
    setActing(true);
    try {
      await apiRequest(`/orders/${order.id}`, { method: "DELETE" });
      toast.success("Order cancelled and stock restocked.");
      fetchOrder(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order.");
    } finally {
      setActing(false);
    }
  };

  const handlePrint = () => {
    if (!order) return;
    try {
      generateOrderReceiptPDF({
        orderId: order.id,
        productName: order.productName,
        quantity: order.quantity,
        unitPrice: order.unitPrice ?? order.totalAmount,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        upiReference: order.upiReference,
        status: order.status,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        notes: order.notes,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        patientProfile: order.patientProfile,
      });
      toast.success("Order receipt PDF generated.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate PDF receipt.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <div className="h-8 w-40 shimmer rounded-lg" />
        <div className="h-44 shimmer rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 shimmer rounded-3xl" />
          <div className="h-96 shimmer rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-navy">Order Not Found</h2>
        <p className="text-gray-400 text-xs">The order ticket you are looking for does not exist or has been deleted.</p>
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 bg-navy text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-navy/90 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const orderId = order.id.slice(0, 8).toUpperCase();
  const currentStep = meta.step;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Back to list & title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold font-bold transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-bold text-navy">Order Ticket</h1>
            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">#{orderId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrder()}
            disabled={acting}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${acting ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handlePrint}
            className="bg-gold hover:bg-yellow-400 text-navy font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Ticket Core */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Order Details & Summary Card */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-navy/5 relative">
            <div className={`h-2 w-full bg-gradient-to-r ${meta.stripe}`} />
            
            <div className="p-6 space-y-6">
              
              {/* Receipt Header styling */}
              <div className="flex justify-between items-start gap-4 border-b border-gray-100 pb-5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gold">Hollyhill Dental Clinic</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Official Statement of Purchase</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${order.status === "ready" ? "animate-pulse" : ""}`} />
                    {meta.label}
                  </span>
                </div>
              </div>

              {/* Items details block */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Summary</p>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-navy truncate">{order.productName}</p>
                    <p className="text-xs text-gray-400 mt-1 font-semibold">
                      Unit price: <span className="text-navy font-bold">€{Number(order.unitPrice || 0).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 font-bold bg-white border border-gray-200 px-2 py-0.5 rounded-md inline-block">
                      ×{order.quantity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Invoice amount box */}
              <div className="bg-navy text-white rounded-2xl p-4 flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Total Amount Due</p>
                  <p className="text-xs text-gold font-bold mt-0.5">Method: {order.paymentMethod === "upi" ? "UPI QR Scan" : "Cash on Pickup"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-gold">€{Number(order.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* UPI references */}
              {order.upiReference && (
                <div className="border border-blue-100 bg-blue-50/30 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    UPI Proof of Payment
                  </p>
                  {order.upiReference.startsWith("http") ? (
                    <div className="space-y-2">
                      <div
                        className="relative w-full h-48 border border-blue-200 rounded-xl overflow-hidden shadow-xs hover:border-gold hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => window.open(order.upiReference!, "_blank")}
                      >
                        <img src={order.upiReference} alt="Payment Receipt" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-all">
                          Open Full Image <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block">Patient Attached Photo Proof</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">Transaction Code Reference</p>
                      <p className="font-mono text-sm text-blue-800 font-bold mt-1 bg-white border border-blue-100 px-3 py-2 rounded-xl inline-block shadow-xs">
                        {order.upiReference}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Request Notes</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                    <StickyNote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed font-semibold">{order.notes}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Stepper progress tracker */}
          {order.status !== "cancelled" && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm shadow-navy/5">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-5">Order Tracking Journey</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                {STEPS.map((step, idx) => {
                  const stepNum = idx + 1;
                  const done = stepNum < currentStep;
                  const active = stepNum === currentStep;

                  return (
                    <div key={step.key} className="flex sm:flex-col items-center text-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                        done ? "bg-emerald-500 border-emerald-500 text-white" :
                        active ? "bg-gold border-gold text-navy shadow-md shadow-gold/30 scale-105" :
                        "bg-gray-50 border-gray-200 text-gray-400"
                      }`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${done ? "text-emerald-600" : active ? "text-navy" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {active && <span className="text-[8px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider block mt-0.5 w-max mx-auto">Active</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right column: Patient Details & Administrative Operations */}
        <div className="space-y-6">
          
          {/* Patient demographics */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm shadow-navy/5 space-y-4">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Patient Demographics</h3>
            
            <div className="border border-gray-50 rounded-2xl p-4 bg-gray-50/50 space-y-4">
              {order.customerName && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-xs border border-gray-100">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Patient Name</p>
                    <p className="text-xs font-bold text-navy">{order.customerName}</p>
                  </div>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-xs border border-gray-100">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                    <a href={`tel:${order.customerPhone}`} className="text-xs font-bold text-navy hover:underline hover:text-gold transition-all">
                      {order.customerPhone}
                    </a>
                  </div>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-xs border border-gray-100">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                    <a href={`mailto:${order.customerEmail}`} className="text-xs font-bold text-navy hover:underline hover:text-gold transition-all break-all">
                      {order.customerEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* If patient profile has additional medical/demographics values, show them! */}
            {order.patientProfile && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Medical Portal Attributes</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  {order.patientProfile.bloodGroup && (
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-2">
                      <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider">Blood Group</p>
                      <p className="text-sm font-extrabold text-red-700 mt-0.5">{order.patientProfile.bloodGroup}</p>
                    </div>
                  )}
                  {order.patientProfile.gender && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2">
                      <p className="text-[8px] text-blue-500 font-bold uppercase tracking-wider">Gender</p>
                      <p className="text-xs font-extrabold text-blue-700 mt-0.5 truncate">{order.patientProfile.gender}</p>
                    </div>
                  )}
                  {order.patientProfile.age && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 col-span-2">
                      <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Age Group</p>
                      <p className="text-xs font-extrabold text-emerald-800 mt-0.5">{order.patientProfile.age} Years Old</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin control panel */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm shadow-navy/5 space-y-4">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Administrative Desk</h3>
            
            <div className="flex flex-col gap-2.5">
              {order.status === "pending" && (
                <button
                  disabled={acting}
                  onClick={() => handleStatus("paid")}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verify & Mark Paid
                </button>
              )}
              {(order.status === "pending" || order.status === "paid") && (
                <button
                  disabled={acting}
                  onClick={() => handleStatus("ready")}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Package className="w-4 h-4" /> Package Ready for Pickup
                </button>
              )}
              {order.status === "ready" && (
                <button
                  disabled={acting}
                  onClick={() => handleStatus("completed")}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" /> Confirm Order Collected
                </button>
              )}
              {!["completed", "cancelled"].includes(order.status) && (
                <button
                  disabled={acting}
                  onClick={handleCancel}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 px-4 rounded-xl text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Cancel & Restock Item
                </button>
              )}
            </div>

            {acting && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-bold py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Performing database operation...
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
