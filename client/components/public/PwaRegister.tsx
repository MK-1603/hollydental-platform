"use client";

import { useEffect } from "react";

/**
 * Register the service worker on first mount so the browser learns the
 * app is installable and surfaces the OS-level install prompt. The SW
 * itself is a no-op for fetches and only handles push notifications +
 * install eligibility.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      // Service workers require a secure context. Skip on plain http hosts
      // other than localhost (which the spec treats as secure).
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          // Non-fatal — push notifications and install prompt won't work,
          // but the rest of the app is unaffected.
          // eslint-disable-next-line no-console
          console.warn("[pwa] service worker registration failed", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
