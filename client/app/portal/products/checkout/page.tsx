"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { CLINIC } from "@/lib/constants";
import {
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  Check,
  User,
  Heart,
  Activity,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  priceTo?: string | null;
  imageUrl?: string | null;
  stockCount: number;
}

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

interface PaymentConfig {
  cash: { enabled: boolean };
  upi: { enabled: boolean; vpa: string; name: string };
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const productId = searchParams?.get("productId");
  const initQty = parseInt(searchParams?.get("quantity") || "1", 10) || 1;

  const [product, setProduct] = useState<Product | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [quantity, setQuantity] = useState(initQty);
  
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [upiReference, setUpiReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated Card Payment details
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Simulated UPI Payment details
  const [isProcessingUpi, setIsProcessingUpi] = useState(false);
  const [upiProcessingStep, setUpiProcessingStep] = useState(0);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      // 1. Fetch Product details
      const prodData = await apiRequest(`/products/${productId}`);
      setProduct(prodData);
      
      // Clamp initial quantity within stock limits
      const stock = prodData.stockCount ?? 0;
      if (stock > 0) {
        setQuantity(Math.max(1, Math.min(stock, initQty)));
      }

      // 2. Fetch Patient Profile details
      const patientData = await apiRequest("/patients/me");
      setProfile(patientData);
      if (patientData) {
        setCardHolder(`${patientData.firstName} ${patientData.lastName}`.trim());
      }

      // 3. Fetch payment payee configuration
      const payCfg = await apiRequest("/orders/payment-config");
      setConfig(payCfg);
    } catch (err) {
      console.error("Checkout fetch failed:", err);
      toast.error("Failed to load checkout details. Returning to shop.");
      router.push("/portal/products");
    } finally {
      setLoading(false);
    }
  }, [productId, initQty, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckout = async () => {
    if (!product) return;
    setError(null);

    if (paymentMethod === "card") {
      router.push(`/portal/products/checkout/payment?productId=${product.id}&quantity=${quantity}&notes=${encodeURIComponent(notes || "")}`);
      return;
    }

    if (paymentMethod === "upi") {
      const ref = upiReference.trim();
      if (ref.length < 6) {
        setError("Please paste the 12-character UPI reference from your bank app.");
        return;
      }

      // Immersive Simulator loading sequence for UPI
      setIsProcessingUpi(true);
      setUpiProcessingStep(0);
      await new Promise((r) => setTimeout(r, 1100));
      setUpiProcessingStep(1);
      await new Promise((r) => setTimeout(r, 1100));
      setUpiProcessingStep(2);
      await new Promise((r) => setTimeout(r, 1100));
      setUpiProcessingStep(3);
      await new Promise((r) => setTimeout(r, 800));
    }

    setSubmitting(true);

    try {
      const resp: any = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity,
          paymentMethod,
          upiReference: paymentMethod === "upi" ? upiReference : undefined,
          notes: notes || undefined,
        }),
      });

      if (resp?.order?.id) {
        toast.success("Order placed. Awaiting clinic pickup verification.");
        router.push(`/portal/orders/${resp.order.id}`);
      } else {
        throw new Error("Failed to place order.");
      }
    } catch (err: any) {
      setError(err?.message || "Checkout failed. Please try again.");
    } finally {
      setIsProcessingUpi(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
        <div className="h-8 shimmer rounded-xl w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-[250px] shimmer rounded-2xl" />
            <div className="h-[150px] shimmer rounded-2xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-[350px] shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const unitPrice = parseFloat(product.price) || 0;
  const total = unitPrice * quantity;
  const outOfStock = product.stockCount !== null && product.stockCount <= 0;

  const upiUrl =
    paymentMethod === "upi" && config?.upi?.enabled
      ? `upi://pay?pa=${encodeURIComponent(
          config.upi.vpa
        )}&pn=${encodeURIComponent(
          config.upi.name
        )}&am=${total.toFixed(2)}&cu=EUR&tn=${encodeURIComponent(
          `Hollyhill Order - ${product.name}`
        )}`
      : "";

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans relative">

      {/* Immersive Processing Screen for UPI payment */}
      {isProcessingUpi && (
        <div className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6 animate-scale-in">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
              <QrCode className="w-8 h-8 text-gold animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-sans text-xl font-bold text-navy">Verifying UPI Transaction</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Please do not refresh the page or click back.</p>
            </div>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-left border border-gray-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 0 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep > 0 ? <Check className="w-3 h-3 text-navy font-bold" /> : "1"}
                </div>
                <span className={upiProcessingStep === 0 ? "font-bold text-navy" : "text-gray-400"}>Resolving clinic VPA gateway address...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 1 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep > 1 ? <Check className="w-3 h-3 text-navy font-bold" /> : "2"}
                </div>
                <span className={upiProcessingStep === 1 ? "font-bold text-navy" : "text-gray-400"}>Transmitting €{total.toFixed(2)} reference...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 2 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep > 2 ? <Check className="w-3 h-3 text-navy font-bold" /> : "3"}
                </div>
                <span className={upiProcessingStep === 2 ? "font-bold text-navy" : "text-gray-400"}>Verifying reference code: {upiReference.slice(0, 12)}...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 3 ? "bg-emerald-500 text-white animate-bounce" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep >= 3 ? <Check className="w-3 h-3 text-white font-bold" /> : "4"}
                </div>
                <span className={upiProcessingStep === 3 ? "font-bold text-emerald-600" : "text-gray-400"}>Reference Logged! Awaiting clinic approval...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header breadcrumb */}
      <header className="flex items-center justify-between border-b border-gray-100 pb-4 gap-3">
        <div className="space-y-1">
          <Link
            href="/portal/products"
            className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to shop
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy">
            1-Click Direct Purchase
          </h1>
          <p className="text-xs text-gray-400">
            Confirm your purchase parameters and checkout instantly.
          </p>
        </div>
      </header>

      {/* 12-Column Responsive checkout dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
        
        {/* LEFT COLUMN: selected product card, counters, pickup specs (Spans 7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Spacious Product Summary Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gold animate-pulse" />
              Selected Product details
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold/30 bg-gold/5">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <span className="text-[9px] font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">Direct Buy</span>
                <h3 className="font-serif text-lg font-bold text-navy leading-snug">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{product.description}</p>
                )}
              </div>
            </div>

            {/* Dynamic visual price grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Unit Price</span>
                <span className="font-bold text-navy text-sm">€{unitPrice.toFixed(2)}</span>
              </div>
              
              <div>
                <span className="text-gray-400 block mb-1">Buy Quantity</span>
                <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-2 py-1 hover:bg-gray-100 text-navy disabled:opacity-40"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2.5 text-xs font-bold text-navy">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockCount ?? 1, q + 1))}
                    disabled={quantity >= product.stockCount}
                    className="px-2 py-1 hover:bg-gray-100 text-navy disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-gold block font-bold uppercase tracking-wider text-[9px] mb-0.5">Instant Total</span>
                <span className="font-serif text-xl font-bold text-navy">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Counter Pickup info */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold animate-bounce" />
              Delivery / Collection Point
            </h2>
            <div className="flex items-start gap-3.5 text-xs leading-relaxed">
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/20">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-navy">In-Clinic Front Desk Pickup</p>
                <p className="text-gray-400 mt-0.5">{CLINIC.address}</p>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mt-1">Ready for pickup in 24 hours</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: pre-populated clinical demographics grid, payment selectors (Spans 5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Spacious Checkout summary & Payment Selectors Panel */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            
            {/* Patient Clinical Profile parameters panel */}
            {profile && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-2.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gold" />
                  Billing Recipient details
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] mb-0.5">Full Name</span>
                    <span className="font-bold text-navy">{profile.firstName} {profile.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] mb-0.5">Mobile Phone</span>
                    <span className="font-bold text-navy flex items-center gap-1"><Phone className="w-3 h-3 text-gold" /> {profile.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-[10px] mb-0.5">Email Address</span>
                    <span className="font-bold text-navy block truncate"><Mail className="w-3 h-3 text-gold inline mr-1" /> {profile.email}</span>
                  </div>
                  
                  {/* Demographics Box */}
                  <div className="col-span-2 mt-1 border-t border-gray-50 pt-2 grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[9px] mb-0.5">Age</span>
                      <span className="font-bold text-navy flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-gold" /> {profile.age || "—"} yrs</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] mb-0.5">Gender</span>
                      <span className="font-bold text-navy uppercase block truncate">{profile.gender || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] mb-0.5">Blood Group</span>
                      <span className="font-bold text-gold flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-gold shrink-0 animate-pulse" /> {profile.bloodGroup || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Option Selectors */}
            <div className="space-y-3 pt-2">
              <span className="block text-[10px] uppercase tracking-wider font-bold text-gold">
                Select Payment method
              </span>
              <div className="grid grid-cols-3 gap-2">
                <PaymentOption
                  active={paymentMethod === "cash"}
                  onClick={() => setPaymentMethod("cash")}
                  icon={<Banknote className="w-4 h-4 text-emerald-500" />}
                  label="Cash/COD"
                  hint="Active counter pay"
                />
                <PaymentOption
                  active={paymentMethod === "upi"}
                  onClick={() => {}}
                  disabled={true}
                  icon={<QrCode className="w-4 h-4 text-gray-400" />}
                  label="UPI"
                  hint="Coming soon"
                />
                <PaymentOption
                  active={paymentMethod === "card"}
                  onClick={() => {}}
                  disabled={true}
                  icon={<CreditCard className="w-4 h-4 text-gray-400" />}
                  label="Card"
                  hint="Coming soon"
                />
              </div>
            </div>

            {/* UPI reference panel */}
            {paymentMethod === "upi" && config?.upi?.enabled && (
              <div className="space-y-3 bg-gold/5 border border-gold/20 rounded-xl p-4 animate-fade-in">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-gold">
                    Pay to
                  </span>
                  <span className="block text-sm font-bold text-navy">
                    {config.upi.name}
                  </span>
                  <span className="block text-xs text-gray-500 font-mono">
                    {config.upi.vpa}
                  </span>
                </div>
                <a
                  href={upiUrl}
                  className="block w-full text-center bg-navy hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs"
                >
                  Open UPI app
                </a>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gold">
                    UPI reference *
                  </label>
                  <input
                    type="text"
                    value={upiReference}
                    onChange={(e) => setUpiReference(e.target.value)}
                    placeholder="12-character bank ref"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                  <p className="text-[10px] text-gray-500">
                    Paste the reference from your UPI app so the clinic can verify payment.
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gold">
                Notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. preferred pickup hours"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-gold resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Pay and confirm */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || outOfStock}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:outline-none"
            >
              {paymentMethod === "card" ? <CreditCard className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {submitting
                ? "Placing direct order…"
                : paymentMethod === "card"
                ? `Proceed to Secure Card Payment · €${total.toFixed(2)}`
                : `Confirm & Pay · €${total.toFixed(2)}`}
            </button>

            <p className="text-[9px] text-gray-400 text-center leading-relaxed">
              Placing this direct order skips the cart flow entirely. Your invoice receipt unlocks immediately upon card payment confirmation.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  disabled,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-2.5 rounded-xl border transition-colors flex flex-col justify-between h-[82px] ${
        active
          ? "border-gold bg-gold/10"
          : "border-gray-200 hover:border-gold/40 disabled:opacity-50 disabled:hover:border-gray-200"
      }`}
    >
      <div className="flex items-center gap-1.5 text-navy">
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
            active ? "bg-gold text-navy" : "bg-gray-100 text-navy"
          }`}
        >
          {icon}
        </span>
        <span className="text-[11px] font-bold leading-none">{label}</span>
      </div>
      <span className="block text-[9px] text-gray-500 leading-tight">
        {hint}
      </span>
    </button>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
        <div className="h-8 shimmer rounded-xl w-32" />
        <div className="h-[400px] shimmer rounded-3xl w-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
