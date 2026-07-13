"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Check } from "lucide-react";
import {
  enablePushNotifications,
  disablePushNotifications,
  isPushSupported,
} from "@/lib/push";

type State = "unsupported" | "denied" | "default" | "granted" | "subscribed";

interface PushToggleProps {
  /** Compact pill button (header) vs full card layout (settings/profile). */
  variant?: "pill" | "card";
  className?: string;
}

export default function PushToggle({
  variant = "pill",
  className = "",
}: PushToggleProps) {
  const [state, setState] = useState<State>("default");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }
    const permission = Notification.permission as
      | "default"
      | "denied"
      | "granted";

    if (permission === "denied") {
      setState("denied");
      return;
    }

    if (permission === "granted") {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.pushManager.getSubscription())
        .then((sub) => {
          setState(sub ? "subscribed" : "granted");
        })
        .catch(() => setState("granted"));
      return;
    }

    setState("default");
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await enablePushNotifications();
      setState(ok ? "subscribed" : "denied");
      if (!ok) {
        setError(
          "We couldn't enable push notifications. Check your browser settings and try again."
        );
      }
    } catch (err: any) {
      setError(err?.message || "Failed to enable notifications.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      await disablePushNotifications();
      setState("granted");
    } catch (err: any) {
      setError(err?.message || "Failed to disable notifications.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "unsupported") {
    if (variant === "card") {
      return (
        <div className={`text-xs text-gray-500 ${className}`}>
          Push notifications aren&apos;t supported in this browser.
        </div>
      );
    }
    return null;
  }

  const isOn = state === "subscribed";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={isOn ? handleDisable : handleEnable}
        disabled={busy || state === "denied"}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
          isOn
            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            : "bg-gold/10 text-gold hover:bg-gold/20"
        } ${className}`}
        title={
          state === "denied"
            ? "Push notifications are blocked in your browser settings."
            : isOn
            ? "Push notifications are on. Click to disable."
            : "Enable browser push notifications."
        }
        aria-label={
          isOn
            ? "Disable browser push notifications"
            : "Enable browser push notifications"
        }
      >
        {isOn ? (
          <span className="relative flex items-center">
            <BellRing className="w-3.5 h-3.5" />
            <Check className="w-2.5 h-2.5 absolute -bottom-0.5 -right-1 text-emerald-600 bg-white rounded-full" />
          </span>
        ) : (
          <BellOff className="w-3.5 h-3.5" />
        )}
        <span className="hidden lg:inline">
          {busy
            ? "…"
            : state === "denied"
            ? "Blocked"
            : isOn
            ? "Push on"
            : "Push off"}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`border border-gray-100 bg-white rounded-2xl p-5 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isOn
                ? "bg-emerald-50 text-emerald-600"
                : "bg-gold/10 text-gold"
            }`}
          >
            {isOn ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-sm font-bold text-navy truncate">
              Push notifications
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
              Get appointment confirmations, status updates and password
              reset codes pushed to this device.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={isOn ? handleDisable : handleEnable}
          disabled={busy || state === "denied"}
          className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            isOn
              ? "bg-gray-100 text-navy hover:bg-gray-200"
              : "bg-gold text-navy hover:bg-gold-dark"
          }`}
        >
          {busy ? "…" : isOn ? "Disable" : "Enable"}
        </button>
      </div>
      {state === "denied" && (
        <p className="text-[11px] text-red-500">
          Notifications are currently blocked in your browser. Update the site
          permissions to allow them.
        </p>
      )}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
