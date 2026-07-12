"use client";

import { Activity } from "lucide-react";

interface LoginOverlayProps {
  message?: string;
}

export default function LoginOverlay({
  message = "Signing you in...",
}: LoginOverlayProps = {}) {
  return (
    <div
      className="fixed inset-0 bg-navy z-50 flex items-center justify-center animate-fade-in"
      id="login-overlay"
    >
      {/* Radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-navy/5 to-navy opacity-80" />

      <div className="relative z-10 text-center space-y-6 max-w-sm px-6">
        <div className="relative flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20 animate-pulse">
            <Activity
              className="w-8 h-8 text-gold animate-spin"
              style={{ animationDuration: "5s" }}
            />
          </div>
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-gold rounded-full animate-ping" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            {message}
          </h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Hollyhill Dental Clinic
          </p>
        </div>

        {/* Shimmer loading bar */}
        <div className="w-24 h-0.5 bg-white/10 mx-auto rounded-full overflow-hidden relative">
          <div className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-gold to-transparent animate-preloader-shimmer" />
        </div>
      </div>
    </div>
  );
}
