"use client";

import { useEffect, useState } from "react";
import { CLINIC } from "@/lib/constants";
import Logo from "@/components/public/Logo";

/**
 * Premium intro splash. Shown once per browser session per intro version.
 * Bumping `INTRO_VERSION` re-triggers the splash for everyone.
 *
 * In development the gate is bypassed so designers can iterate on the
 * animation without clearing storage manually.
 */
const INTRO_VERSION = "4"; // bump to force everyone to see a refreshed intro

export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isDev = process.env.NODE_ENV !== "production";
    const seenKey = `hh-intro-seen-v${INTRO_VERSION}`;
    const seen = !isDev && window.sessionStorage.getItem(seenKey) === "1";

    if (seen) {
      setRemoved(true);
      return;
    }

    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(() => setHidden(true), 1500);
    const removeTimer = window.setTimeout(() => {
      setRemoved(true);
      document.body.style.overflow = "";
      try {
        window.sessionStorage.setItem(seenKey, "1");
      } catch {
        // sessionStorage may be unavailable in some embeds — ignore.
      }
    }, 2000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (removed) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] bg-slate-50 text-navy flex items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hidden ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Premium ambient light mesh blobs */}
      <div className="absolute top-[15%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#00ADEF]/5 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
      <div className="absolute bottom-[15%] right-[20%] w-[45vw] h-[45vw] rounded-full bg-gold/10 blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: "7s", animationDelay: "1s" }} />

      {/* Subtle grain/grid overlay for ultra-premium texture */}
      <div className="absolute inset-0 bg-white/5 opacity-[0.02] mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-10 px-6 text-center z-10 animate-in slide-in-from-bottom-4 fade-in duration-1000 ease-out w-full max-w-sm sm:max-w-md">
        {/* Full logo lockup with subtle pulse */}
        <div className="relative py-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.04)] animate-preloader-pulse">
          {/* Using dark theme logo for light background */}
          <Logo variant="full" size={80} theme="dark" asLink={false} />
        </div>

        <div className="space-y-4 flex flex-col items-center w-full">
          {/* Glassmorphism pill for light theme */}
          <span className="inline-flex items-center justify-center text-[10px] uppercase tracking-[0.35em] font-bold text-navy bg-white/70 backdrop-blur-xl px-6 py-2.5 rounded-full border border-navy/5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]">
            Premium Dental Care
          </span>
          <span className="block text-[11px] sm:text-xs text-navy/60 max-w-[280px] font-medium leading-relaxed tracking-wide">
            {CLINIC.tagline || "Creating Beautiful & Confident Smiles"}
          </span>
        </div>

        {/* Ultra-sleek glowing loading bar for light theme */}
        <div className="w-56 h-[1px] bg-navy/10 rounded-full overflow-hidden relative shadow-[0_2px_10px_rgba(0,0,0,0.05)] mt-2">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold to-transparent absolute top-0 -translate-x-[150%] animate-preloader-shimmer" style={{ animationDuration: "1.5s" }} />
        </div>
      </div>
    </div>
  );
}
