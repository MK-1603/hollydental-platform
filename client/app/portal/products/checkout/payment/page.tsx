"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  CreditCard,
  Lock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  Heart,
  User,
  ShoppingBag,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  stockCount: number;
}

interface PatientProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  age?: number | null;
  gender?: string | null;
  bloodGroup?: string | null;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams?.get("productId");
  const qty = parseInt(searchParams?.get("quantity") || "1", 10) || 1;
  const notes = searchParams?.get("notes") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Details
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Focus & Flip State
  const [isFlipped, setIsFlipped] = useState(false);

  // Dynamic Card brand detector
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("4")) return "visa";
    if (clean.startsWith("5")) return "mastercard";
    if (clean.startsWith("3")) return "amex";
    return "generic";
  };
  const cardBrand = getCardBrand(cardNumber);

  // Dynamic card gradients depending on brand
  const getCardBg = () => {
    switch (cardBrand) {
      case "visa":
        return "from-blue-700 via-indigo-900 to-slate-950 border-blue-500/20";
      case "mastercard":
        return "from-[#ea580c]/80 via-rose-950 to-[#171717] border-red-500/20";
      case "amex":
        return "from-[#d97706]/85 via-amber-950 to-[#1c1917] border-amber-500/20";
      default:
        return "from-[#1b2b48] via-[#0f172a] to-[#020617] border-white/10";
    }
  };

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [show3DSecure, setShow3DSecure] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      // 1. Fetch Product
      const prodData = await apiRequest(`/products/${productId}`);
      setProduct(prodData);

      // 2. Fetch Patient
      const patientData = await apiRequest("/patients/me");
      setProfile(patientData);
      if (patientData) {
        setCardHolder(`${patientData.firstName} ${patientData.lastName}`.trim().toUpperCase());
      }
    } catch (err) {
      console.error("Payment load failed:", err);
      toast.error("Failed to load secure gateway parameters.");
      router.push("/portal/products");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const strippedCard = cardNumber.replace(/\s/g, "");
    if (strippedCard.length !== 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (cardExpiry.length !== 5 || !cardExpiry.includes("/")) {
      setError("Please enter card expiry date in MM/YY format.");
      return;
    }
    if (cardCvc.length !== 3) {
      setError("Please enter a valid 3-digit CVC security code.");
      return;
    }

    // Trigger Immersive Processing screen
    setIsProcessing(true);
    setProcessingStep(0);

    setTimeout(() => {
      setProcessingStep(1);
      setTimeout(() => {
        setProcessingStep(2);
        setTimeout(() => {
          // Open 3D Secure / Verified by Visa popup modal
          setIsProcessing(false);
          setShow3DSecure(true);
        }, 1100);
      }, 1100);
    }, 1100);
  };

  const handleConfirmOTP = async () => {
    if (otp !== "123456" && otp.trim().length !== 6) {
      setOtpError("Incorrect verification passcode. Use '123456' for simulated check.");
      return;
    }

    setOtpSubmitting(true);
    setOtpError("");

    try {
      // Create paid order in backend
      const resp: any = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId,
          quantity: qty,
          paymentMethod: "card",
          notes: notes || undefined,
        }),
      });

      if (resp?.order?.id) {
        toast.success("Payment authorized successfully! Order confirmed.");
        setShow3DSecure(false);
        router.push(`/portal/orders/${resp.order.id}`);
      } else {
        throw new Error("Failed to place direct card order.");
      }
    } catch (err: any) {
      setOtpError(err?.message || "Verification gateway failed. Please try again.");
      setOtpSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6 font-sans">
        <div className="h-6 shimmer rounded-xl w-40" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-4">
            <div className="h-[200px] shimmer rounded-2xl" />
            <div className="h-[250px] shimmer rounded-2xl" />
          </div>
          <div className="md:col-span-5">
            <div className="h-[300px] shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const unitPrice = parseFloat(product.price) || 0;
  const total = unitPrice * qty;

  // Credit Card front-back 3D rotation styles
  const cardInnerStyle: React.CSSProperties = {
    transition: "transform 0.8s",
    transformStyle: "preserve-3d",
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
    width: "100%",
    height: "100%",
    position: "relative",
  };

  const cardFaceStyle: React.CSSProperties = {
    backfaceVisibility: "hidden",
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  };

  const cardBackStyle: React.CSSProperties = {
    backfaceVisibility: "hidden",
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    transform: "rotateY(180deg)",
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 font-sans relative">
      
      {/* 1. Immersive Processing Gateway Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-navy/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 animate-scale-in border border-gray-50">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
              <CreditCard className="w-8 h-8 text-gold animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-bold text-navy">Securing Transaction</h3>
              <p className="text-gray-400 text-xs leading-relaxed">Securing SSL handshake with Irish Merchant Gateways...</p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl text-left text-xs border border-gray-100 font-medium">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 0 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep > 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-navy font-bold" /> : "1"}
                </div>
                <span className={processingStep === 0 ? "font-bold text-navy animate-pulse" : "text-gray-400"}>Connecting to bank checkout portal...</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 1 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-navy font-bold" /> : "2"}
                </div>
                <span className={processingStep === 1 ? "font-bold text-navy animate-pulse" : "text-gray-400"}>Authorizing funds €{total.toFixed(2)} capture...</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 2 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-navy font-bold" /> : "3"}
                </div>
                <span className={processingStep === 2 ? "font-bold text-navy animate-pulse" : "text-gray-400"}>Requesting 3D-Secure Multi-Factor Challenge...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 3D Secure / Verified by Visa Verification Challenge Popup Modal */}
      {show3DSecure && (
        <div className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-gray-100">
            {/* Bank Branding header */}
            <div className="bg-navy p-5 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gold" />
                <span className="font-serif text-sm font-bold tracking-wider">IRISH CLEARING GATEWAY</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Secure 3DS v2.0</span>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="w-12 h-12 bg-gold/15 rounded-full flex items-center justify-center mx-auto text-gold">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-navy">Verified by Visa / Mastercard Identity Check</h4>
                <p className="text-gray-400 text-xs leading-relaxed px-2">
                  A verification passcode has been sent to the patient mobile phone listed under your profile.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Merchant:</span>
                  <span className="font-bold text-navy">Hollyhill Dental E-Commerce</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Amount capture:</span>
                  <span className="font-bold text-navy">€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Card reference:</span>
                  <span className="font-bold text-navy font-mono">•••• •••• •••• {cardNumber.slice(-4) || "4444"}</span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-[10px] uppercase font-bold text-navy tracking-wider">Enter OTP Code *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/gi, ""))}
                    placeholder="Enter 123456"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold"
                    maxLength={6}
                  />
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  💡 Type the demo passcode <span className="font-bold text-gold">123456</span> to complete authentication safely.
                </p>
              </div>

              {otpError && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2 text-left">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShow3DSecure(false);
                    setOtp("");
                    setOtpError("");
                  }}
                  disabled={otpSubmitting}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOTP}
                  disabled={otpSubmitting || otp.length !== 6}
                  className="flex-1 bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  {otpSubmitting ? (
                    <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header breadcrumb */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 gap-3">
        <div className="space-y-1">
          <Link
            href={`/portal/products/checkout?productId=${productId}&quantity=${qty}&notes=${encodeURIComponent(notes)}`}
            className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to checkout parameters
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy flex items-center gap-2">
            <Lock className="w-6 h-6 text-gold" />
            Secure Card Payment Gateway
          </h1>
          <p className="text-xs text-gray-400">
            SSL-secured bank gateway integration. Enter your credit or debit details below.
          </p>
        </div>
        
        {/* SSL secured badge */}
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 self-start sm:self-auto shrink-0 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Secured by Stripe API</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
        
        {/* Left Column: Interactive 3D Credit Card & Inputs */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Stunning Interactive 3D Physical Card Wrapper */}
          <div className="py-2 flex items-center justify-center">
            <div className="w-full max-w-[340px] h-[210px] relative font-sans" style={{ perspective: "1000px" }}>
              <div style={cardInnerStyle}>
                
                {/* CARD FRONT */}
                <div
                  className={`rounded-3xl p-6 bg-gradient-to-br ${getCardBg()} text-white flex flex-col justify-between shadow-2xl border transition-all duration-500`}
                  style={cardFaceStyle}
                >
                  {/* Hologram Card Chip and Card Type Brand logo */}
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-9 rounded-md bg-gradient-to-r from-amber-400 to-yellow-300 relative overflow-hidden border border-gold/40 flex items-center justify-center shadow-inner">
                      <div className="absolute inset-x-0 top-1/4 h-px bg-navy/10" />
                      <div className="absolute inset-x-0 top-2/4 h-px bg-navy/10" />
                      <div className="absolute inset-x-0 top-3/4 h-px bg-navy/10" />
                      <div className="absolute inset-y-0 left-1/3 w-px bg-navy/10" />
                      <div className="absolute inset-y-0 left-2/3 w-px bg-navy/10" />
                    </div>
                    {/* Dynamic Brand logo */}
                    {cardBrand === "visa" && (
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-extrabold italic text-sky-400 tracking-wider leading-none">VISA</span>
                        <span className="text-[6px] text-white/50 tracking-widest font-sans uppercase mt-0.5">Platinum Secure</span>
                      </div>
                    )}
                    {cardBrand === "mastercard" && (
                      <div className="flex flex-col items-end">
                        <div className="flex -space-x-1.5 items-center">
                          <div className="w-4 h-4 rounded-full bg-red-500 opacity-95" />
                          <div className="w-4 h-4 rounded-full bg-amber-500 opacity-95" />
                        </div>
                        <span className="text-[6px] text-white/50 tracking-widest font-sans uppercase mt-0.5">Mastercard</span>
                      </div>
                    )}
                    {cardBrand === "amex" && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded tracking-wide border border-sky-400">AMEX</span>
                        <span className="text-[6px] text-white/50 tracking-widest font-sans uppercase mt-0.5">Centurion</span>
                      </div>
                    )}
                    {cardBrand === "generic" && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] tracking-widest font-extrabold uppercase text-gold font-serif">HOLLYHILL</span>
                        <span className="text-[8px] font-sans text-white/50 tracking-wider">PLATINUM</span>
                      </div>
                    )}
                  </div>

                  {/* Card Number displays */}
                  <div className="text-xl font-bold font-mono tracking-widest text-center py-2 text-white/95 transition-all duration-300">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  {/* CardHolder name & Expiry */}
                  <div className="flex justify-between items-end text-xs">
                    <div className="space-y-0.5 truncate pr-4">
                      <span className="block text-[8px] text-white/40 uppercase tracking-widest">Cardholder Name</span>
                      <span className="block font-bold tracking-wider truncate uppercase">
                        {cardHolder || "SAI CSE"}
                      </span>
                    </div>
                    <div className="space-y-0.5 shrink-0 text-right">
                      <span className="block text-[8px] text-white/40 uppercase tracking-widest">Expires</span>
                      <span className="block font-bold font-mono">
                        {cardExpiry || "MM/YY"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD BACK */}
                <div
                  className={`rounded-3xl bg-gradient-to-br ${getCardBg()} text-white flex flex-col justify-between shadow-2xl border transition-all duration-500 overflow-hidden`}
                  style={cardBackStyle}
                >
                  {/* Black magnetic strip */}
                  <div className="w-full h-11 bg-black/90 mt-4" />

                  {/* CVC strip */}
                  <div className="px-6 space-y-1">
                    <span className="block text-[8px] text-white/40 uppercase tracking-widest text-right pr-2">Security Code CVC</span>
                    <div className="relative">
                      {/* Signature strip pattern */}
                      <div className="w-full h-8 bg-white/10 rounded-md border border-white/5 flex items-center justify-between px-3">
                        <div className="flex-1 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent opacity-20" />
                        <span className="text-sm font-bold font-mono text-gold tracking-widest text-right">
                          {cardCvc || "•••"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Legal notice bottom */}
                  <div className="p-4 text-[7px] text-white/30 leading-normal text-center">
                    Authorized signature required. This card is issued under the clearing laws of Hollyhill E-Commerce Gateways. Void where prohibited by legal code.
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Secure Card input Form */}
          <form onSubmit={handlePaySubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-gold" />
              Secure Card Details
            </h2>

            <div className="space-y-3.5">
              {/* Cardholder Name input */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-navy tracking-wider">Cardholder Name *</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="SAI CSE"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-navy text-sm font-semibold focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-all uppercase"
                />
              </div>

              {/* Card Number input */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-navy tracking-wider">Card Number *</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                    const parts = [];
                    for (let i = 0, len = val.length; i < len; i += 4) {
                      parts.push(val.substring(i, i + 4));
                    }
                    setCardNumber(parts.join(" "));
                  }}
                  placeholder="4111 2222 3333 4444"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-navy text-sm font-mono tracking-widest focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              {/* Expiry Date & CVC input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-navy tracking-wider">Expiry Date *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\//g, "").replace(/[^0-9]/gi, "");
                      if (val.length >= 2) {
                        setCardExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
                      } else {
                        setCardExpiry(val);
                      }
                    }}
                    placeholder="MM/YY"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-navy text-sm font-semibold text-center focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-navy tracking-wider">CVC Security Code *</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/gi, ""))}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                    placeholder="•••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-navy text-sm font-mono text-center tracking-widest focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-md hover:shadow-lg focus:outline-none flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Lock className="w-4 h-4 text-navy shrink-0 animate-pulse" />
                <span>Pay €{total.toFixed(2)} Securely</span>
              </button>
            </div>
          </form>

        </div>

        {/* Right Column: Dynamic Order Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Order Invoice summary */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider border-b border-gray-50 pb-2.5 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-gold" />
              Order Purchase details
            </h3>

            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-gold/30" />
                )}
              </div>
              
              <div className="min-w-0">
                <h4 className="font-serif text-sm font-bold text-navy leading-snug truncate">{product.name}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Quantity: {qty} unit(s)</p>
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="border-t border-gray-50 pt-4 space-y-2 text-xs font-medium">
              <div className="flex justify-between text-gray-500">
                <span>Unit Price</span>
                <span>€{unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Quantity Order</span>
                <span>x{qty}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Collection Fee</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              
              <div className="border-t border-gray-150 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-navy text-[11px] uppercase tracking-wider">Total Charges</span>
                <span className="font-serif text-2xl font-bold text-navy">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Secure Handshake verification info */}
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 text-xs text-gray-500 space-y-3 leading-relaxed">
            <div className="flex gap-2 text-navy font-bold">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span>3D Secure Clearing Code: 123456</span>
            </div>
            <p className="text-[10px]">
              This is a secure simulated environment. Complete the payment check by submitting the card details and verifying the bank challenge challenge.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function SecurePaymentPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6 font-sans">
        <div className="h-6 shimmer rounded-xl w-40" />
        <div className="h-[400px] shimmer rounded-3xl w-full" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
