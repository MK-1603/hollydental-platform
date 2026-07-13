"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import { useToastStore, type ToastItem } from "@/store/useToast";

const VARIANT_STYLES: Record<
  ToastItem["variant"],
  { icon: React.ReactNode; ring: string; iconBg: string; title: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    ring: "border-emerald-200",
    iconBg: "bg-emerald-50 text-emerald-600",
    title: "Success",
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    ring: "border-red-200",
    iconBg: "bg-red-50 text-red-600",
    title: "Something went wrong",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    ring: "border-amber-200",
    iconBg: "bg-amber-50 text-amber-600",
    title: "Heads up",
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    ring: "border-gray-200",
    iconBg: "bg-navy/5 text-navy",
    title: "Notice",
  },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const confirms = useToastStore((s) => s.confirms);
  const dismiss = useToastStore((s) => s.dismiss);
  const resolveConfirm = useToastStore((s) => s.resolveConfirm);

  // Lock background scroll while a confirm is open.
  useEffect(() => {
    if (confirms.length === 0) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [confirms.length]);

  return (
    <>
      {/* Toast stack — bottom-right on desktop, top-center on mobile */}
      <div className="pointer-events-none fixed top-20 sm:top-auto sm:bottom-6 inset-x-0 mx-auto sm:right-6 sm:inset-x-auto sm:mx-0 z-[9999] flex flex-col items-center sm:items-end gap-2 w-max max-w-[90vw] sm:max-w-sm">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto bg-white shadow-lg border ${style.ring} rounded-full pl-1.5 pr-2 py-1.5 flex items-center gap-2.5 animate-in slide-in-from-top-4 sm:slide-in-from-bottom-4 fade-in duration-300 w-auto`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${style.iconBg}`}
              >
                {style.icon}
              </span>
              <div className="flex-1 min-w-0 text-navy flex items-center gap-1.5 pr-1">
                <p className="text-[12px] font-bold whitespace-nowrap">
                  {t.title || style.title}
                </p>
                {t.message && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0 hidden sm:block" />
                    <p className="text-[11px] text-gray-500 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      {t.message}
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="text-gray-400 hover:text-navy transition-colors p-1 rounded-full hover:bg-gray-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialogs — only the latest is shown */}
      {confirms.map((c, idx) => {
        if (idx !== confirms.length - 1) return null;
        return (
          <div
            key={c.id}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`confirm-${c.id}-title`}
          >
            <div
              className="absolute inset-0 bg-navy/40 backdrop-blur-md transition-opacity duration-300"
              onClick={() => resolveConfirm(c.id, false)}
            />
            <div className="relative bg-white/95 backdrop-blur-lg border border-white/40 rounded-3xl shadow-[0_20px_50px_rgba(5,38,78,0.15)] max-w-sm w-full p-6 space-y-5 animate-fade-up z-10">
              <div className="flex items-start gap-4">
                <span
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    c.danger
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3
                    id={`confirm-${c.id}-title`}
                    className="font-serif text-lg font-extrabold text-navy leading-tight"
                  >
                    {c.title}
                  </h3>
                  {c.message && (
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {c.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => resolveConfirm(c.id, false)}
                  className="text-xs font-bold text-navy bg-gray-50 hover:bg-gray-100 border border-gray-200/80 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
                >
                  {c.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => resolveConfirm(c.id, true)}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95 text-white ${
                    c.danger
                      ? "bg-red-500 hover:bg-red-600 hover:shadow-red-200 shadow-md"
                      : "bg-gold hover:bg-gold-dark hover:shadow-gold/20 shadow-md"
                  }`}
                >
                  {c.confirmText}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
