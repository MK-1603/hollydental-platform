"use client";

import { Activity } from "lucide-react";

export default function LogoutOverlay() {
  return (
    <div
      className="fixed inset-0 bg-slate-50 text-navy z-[9999] flex items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] animate-fade-in"
      id="logout-overlay"
    >
      {/* Premium ambient light mesh blobs */}
      <div className="absolute top-[15%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#00ADEF]/5 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
      <div className="absolute bottom-[15%] right-[20%] w-[45vw] h-[45vw] rounded-full bg-gold/10 blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: "7s", animationDelay: "1s" }} />

      {/* Subtle grain/grid overlay for ultra-premium texture */}
      <div className="absolute inset-0 bg-white/5 opacity-[0.02] mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

      <div className="relative z-10 text-center flex flex-col items-center gap-10 px-6 max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-4 fade-in duration-1000 ease-out">
        
        {/* Glassmorphism Icon container */}
        <div className="relative flex justify-center">
          <div className="w-20 h-20 rounded-full bg-white/70 backdrop-blur-xl flex items-center justify-center border border-navy/5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]">
            <Activity
              className="w-8 h-8 text-navy opacity-80 animate-spin"
              style={{ animationDuration: "5s" }}
            />
          </div>
          {/* Subtle pulse dot */}
          <div className="absolute top-0 right-1 w-3.5 h-3.5 bg-[#00ADEF] rounded-full shadow-[0_0_10px_rgba(0,173,239,0.5)] animate-ping" />
        </div>

        <div className="space-y-3 flex flex-col items-center w-full">
          <h2 className="font-serif text-3xl font-bold text-navy tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            Logging you out...
          </h2>
          <span className="inline-flex items-center justify-center text-[10px] uppercase tracking-[0.35em] font-bold text-navy/70 bg-navy/5 px-6 py-2 rounded-full border border-navy/5">
            Hollyhill Dental Clinic
          </span>
        </div>

        {/* Ultra-sleek glowing loading bar for light theme */}
        <div className="w-56 h-[1px] bg-navy/10 rounded-full overflow-hidden relative shadow-[0_2px_10px_rgba(0,0,0,0.05)] mt-2">
          <div className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-navy to-transparent animate-preloader-shimmer" style={{ animationDuration: "1.5s" }} />
        </div>
      </div>
    </div>
  );
}
