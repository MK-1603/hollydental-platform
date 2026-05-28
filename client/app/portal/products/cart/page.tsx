"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useCartStore } from "@/store/useCartStore";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  Check,
} from "lucide-react";

interface PaymentConfig {
  cash: { enabled: boolean };
  upi: { enabled: boolean; vpa: string; name: string };
}

export default function CartCheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [upiReference, setUpiReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated Card Payment states
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Simulated UPI Payment states
  const [isProcessingUpi, setIsProcessingUpi] = useState(false);
  const [upiProcessingStep, setUpiProcessingStep] = useState(0);

  useEffect(() => {
    apiRequest("/orders/payment-config")
      .then((cfg: any) => {
        setConfig(cfg);
      })
      .catch(() => {
        setConfig({
          cash: { enabled: true },
          upi: { enabled: false, vpa: "", name: "" },
        });
      });
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setError(null);

    if (paymentMethod === "upi") {
      const ref = upiReference.trim();
      if (ref.length < 6) {
        setError(
          "Please paste the UPI reference from your bank app before placing the order."
        );
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

    if (paymentMethod === "card") {
      if (!cardHolder.trim() || cardNumber.replace(/\s/g, "").length !== 16 || cardExpiry.length < 5 || cardCvc.length !== 3) {
        setError("Please complete all credit card fields with valid information.");
        return;
      }

      // Immersive Simulator loading sequence for Card
      setIsProcessingCard(true);
      setProcessingStep(0);
      await new Promise((r) => setTimeout(r, 1100));
      setProcessingStep(1);
      await new Promise((r) => setTimeout(r, 1100));
      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 1100));
      setProcessingStep(3);
      await new Promise((r) => setTimeout(r, 800));
    }

    setSubmitting(true);

    const placedIds: string[] = [];
    const failures: { name: string; reason: string }[] = [];

    try {
      for (const item of items) {
        try {
          const resp: any = await apiRequest("/orders", {
            method: "POST",
            body: JSON.stringify({
              productId: item.productId,
              quantity: item.quantity,
              paymentMethod,
              upiReference: paymentMethod === "upi" ? upiReference : undefined,
              notes: notes || undefined,
            }),
          });
          if (resp?.order?.id) placedIds.push(resp.order.id);
        } catch (err: any) {
          failures.push({
            name: item.name,
            reason: err?.message || "Could not place this item.",
          });
        }
      }

      if (placedIds.length > 0) {
        toast.success(
          `Placed ${placedIds.length} order${placedIds.length === 1 ? "" : "s"}. ${
            paymentMethod === "card" ? "Payment received." : "The clinic will confirm shortly."
          }`
        );
        clear();
      }

      if (failures.length > 0) {
        setError(
          failures
            .map((f) => `${f.name}: ${f.reason}`)
            .join(" · ")
        );
      } else if (placedIds.length > 0) {
        router.push("/portal/orders");
      }
    } finally {
      setIsProcessingCard(false);
      setIsProcessingUpi(false);
      setSubmitting(false);
    }
  };

  const upiUrl =
    paymentMethod === "upi" && config?.upi?.enabled
      ? `upi://pay?pa=${encodeURIComponent(
          config.upi.vpa
        )}&pn=${encodeURIComponent(
          config.upi.name
        )}&am=${subtotal.toFixed(2)}&cu=EUR&tn=${encodeURIComponent(
          "Hollyhill Dental order"
        )}`
      : "";

  return (
    <div className="space-y-6 font-sans pb-12 relative">
      {/* Immersive Processing Screen for Card payment */}
      {isProcessingCard && (
        <div className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6 animate-scale-in">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
              <CreditCard className="w-8 h-8 text-gold animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-sans text-xl font-bold text-navy">Securing Card Transaction</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Please do not refresh the page or click back.</p>
            </div>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-left border border-gray-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 0 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep > 0 ? <Check className="w-3 h-3 text-navy font-bold" /> : "1"}
                </div>
                <span className={processingStep === 0 ? "font-bold text-navy" : "text-gray-400"}>Connecting to Irish banking gateway...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 1 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep > 1 ? <Check className="w-3 h-3 text-navy font-bold" /> : "2"}
                </div>
                <span className={processingStep === 1 ? "font-bold text-navy" : "text-gray-400"}>Authorizing €{subtotal.toFixed(2)} secure transfer...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 2 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep > 2 ? <Check className="w-3 h-3 text-navy font-bold" /> : "3"}
                </div>
                <span className={processingStep === 2 ? "font-bold text-navy" : "text-gray-400"}>Verifying CVC authorization & bank limits...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${processingStep >= 3 ? "bg-emerald-500 text-white animate-bounce" : "bg-gray-200 text-gray-400"}`}>
                  {processingStep >= 3 ? <Check className="w-3 h-3 text-white font-bold" /> : "4"}
                </div>
                <span className={processingStep === 3 ? "font-bold text-emerald-600" : "text-gray-400"}>Transaction Approved & Handshaked!</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <span className={upiProcessingStep === 0 ? "font-bold text-navy" : "text-gray-400"}>Resolving clinic virtual payment address...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 1 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep > 1 ? <Check className="w-3 h-3 text-navy font-bold" /> : "2"}
                </div>
                <span className={upiProcessingStep === 1 ? "font-bold text-navy" : "text-gray-400"}>Transmitting €{subtotal.toFixed(2)} reference to registry...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 2 ? "bg-gold text-navy" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep > 2 ? <Check className="w-3 h-3 text-navy font-bold" /> : "3"}
                </div>
                <span className={upiProcessingStep === 2 ? "font-bold text-navy" : "text-gray-400"}>Verifying reference format: {upiReference.slice(0, 12)}...</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${upiProcessingStep >= 3 ? "bg-emerald-500 text-white animate-bounce" : "bg-gray-200 text-gray-400"}`}>
                  {upiProcessingStep >= 3 ? <Check className="w-3 h-3 text-white font-bold" /> : "4"}
                </div>
                <span className={upiProcessingStep === 3 ? "font-bold text-emerald-600" : "text-gray-400"}>Reference Logged! Awaiting Clinic Approval...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between border-b border-gray-100 pb-4 gap-3">
        <div className="space-y-1">
          <Link
            href="/portal/products"
            className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to shop
          </Link>
          <h1 className="font-sans text-2xl md:text-3xl font-bold text-navy">
            Your cart
          </h1>
          <p className="text-sm text-gray-500">
            Review items, choose a payment method, and place your order.
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-4">
          <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-sans text-base font-bold text-navy">
            Your cart is empty
          </h3>
          <p className="text-gray-500 text-sm">
            Browse the shop and add take-home oral care to get started.
          </p>
          <Link
            href="/portal/products"
            className="inline-flex items-center gap-1.5 bg-gold hover:bg-gold-dark text-navy font-bold px-5 py-2.5 rounded-lg text-xs"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold/40">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-sans text-sm font-bold text-navy truncate">
                    {item.name}
                  </h4>
                  <span className="block text-xs text-gold font-bold mt-0.5">
                    €{item.price.toFixed(2)}
                  </span>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                        className="px-2 py-1.5 hover:bg-gray-100 text-navy"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-bold text-navy w-7 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={
                          !!item.stockCount &&
                          item.quantity >= (item.stockCount as number)
                        }
                        className="px-2 py-1.5 hover:bg-gray-100 text-navy disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      className="text-[11px] text-red-500 hover:text-red-600 font-semibold inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>

                <span className="font-sans text-base font-bold text-navy shrink-0">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary + Payment */}
          <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-5 lg:sticky lg:top-24">
            <h2 className="font-sans text-base font-bold text-navy">
              Order summary
            </h2>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Pickup at clinic</span>
                <span className="text-emerald-600 font-semibold">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-navy font-bold text-base">
                <span>Total</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-[10px] uppercase tracking-wider font-bold text-gold">
                Payment method
              </span>
              <div className="grid grid-cols-3 gap-2">
                <PaymentOption
                  active={paymentMethod === "cash"}
                  onClick={() => setPaymentMethod("cash")}
                  icon={<Banknote className="w-4 h-4" />}
                  label="Cash"
                  hint="Pay on pickup"
                />
                <PaymentOption
                  active={paymentMethod === "upi"}
                  onClick={() => {
                    if (config?.upi?.enabled) setPaymentMethod("upi");
                  }}
                  disabled={!config?.upi?.enabled}
                  icon={<QrCode className="w-4 h-4" />}
                  label="UPI"
                  hint={config?.upi?.enabled ? "Simulated VPA" : "Disabled"}
                />
                <PaymentOption
                  active={paymentMethod === "card"}
                  onClick={() => setPaymentMethod("card")}
                  icon={<CreditCard className="w-4 h-4" />}
                  label="Card"
                  hint="Simulated pay"
                />
              </div>
            </div>

            {/* UPI Payment Info Block */}
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

            {/* Card Details Input Block */}
            {paymentMethod === "card" && (
              <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-navy flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-gold animate-pulse" />
                    Secure Card Details
                  </span>
                  <span className="text-[9px] font-bold bg-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Simulated Pay
                  </span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-navy focus:outline-none focus:border-gold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Card Number</label>
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
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-navy font-mono tracking-wider focus:outline-none focus:border-gold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expiry Date</label>
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
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-navy text-center focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">CVC</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/gi, ""))}
                        placeholder="•••"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-navy text-center font-mono focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gold">
                Notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. preferred pickup window"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-gold resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || items.length === 0}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? "Placing order…" : `Place order · €${subtotal.toFixed(2)}`}
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Orders go to the clinic for confirmation. You'll get a notification when items are ready for pickup.
            </p>
          </aside>
        </div>
      )}
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
