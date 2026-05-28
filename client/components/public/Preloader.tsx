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
const INTRO_VERSION = "2"; // bump to force everyone to see a refreshed intro

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
      className={`fixed inset-0 z-[100] bg-navy text-white flex items-center justify-center transition-opacity duration-700 ease-out ${
        hidden ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient blur blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#00ADEF]/10 blur-[90px] animate-preloader-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-gold/10 blur-[80px] animate-preloader-blob-2" />

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />

      <div className="relative flex flex-col items-center gap-9 px-6 text-center z-10">
        {/* Full logo lockup with subtle pulse */}
        <div className="relative animate-preloader-pulse py-4">
          <Logo variant="full" size={72} theme="light" asLink={false} />
        </div>

        <div className="space-y-3">
          <span className="inline-block text-[10px] uppercase tracking-[0.4em] font-bold text-gold bg-gold/10 px-4 py-1.5 rounded-full border border-gold/20">
            Premium Dental Care
          </span>
          <span className="block text-[11px] text-gray-400 max-w-xs font-light leading-relaxed">
            {CLINIC.tagline || "Creating Beautiful & Confident Smiles"}
          </span>
        </div>

        {/* Glowing loading bar */}
        <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(201,169,110,0.1)]">
          <div className="h-full w-2/3 bg-gradient-to-r from-transparent via-gold to-transparent absolute top-0 -translate-x-[120%] animate-preloader-shimmer" />
        </div>
      </div>
    </div>
  );
}
