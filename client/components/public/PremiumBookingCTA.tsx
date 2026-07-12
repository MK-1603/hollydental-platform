"use client";

import React from "react";
import BookButton from "./BookButton";
import { CLINIC } from "@/lib/constants";
import { Activity, PhoneCall, CalendarRange } from "lucide-react";

interface PremiumBookingCTAProps {
  title?: string;
  description?: string;
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  serviceSlug?: string;
}

export default function PremiumBookingCTA({
  title = "Ready to Smile with Confidence?",
  description = "Book a cosmetic dental consultation or secure an examination slot with Dr. Roghay Alizadeh today. Experience Cork's luxury dental experience.",
  primaryBtnLabel = "Book Appointment Online",
  secondaryBtnLabel = "Call Clinic",
  serviceSlug,
}: PremiumBookingCTAProps) {
  return (
    <div className="relative bg-gradient-to-br from-navy via-[#0A1828] to-[#030914] text-white rounded-3xl p-10 md:p-16 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden group w-full">
      {/* Modern radial glow effects */}
      <div className="absolute -left-1/4 -top-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/15 transition-all duration-700" />
      <div className="absolute -right-1/4 -bottom-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/15 transition-all duration-700" />
      
      {/* Subtle top light overlay */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
        {/* Sparkle Header Icon */}
        <div className="inline-flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full select-none">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Cork's Luxury Dental Care</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold font-serif leading-tight tracking-tight text-white drop-shadow-md">
          {title}
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <BookButton
            serviceSlug={serviceSlug}
            label={primaryBtnLabel}
            className="w-full sm:w-auto bg-gradient-to-r from-gold to-[#D6B47C] hover:from-gold-dark hover:to-gold text-navy font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          />
          
          <a
            href={CLINIC.phoneHref}
            className="w-full sm:w-auto border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="whitespace-nowrap">
              {secondaryBtnLabel}: {CLINIC.phone}
            </span>
          </a>

          <a
            href={CLINIC.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto border border-emerald-500/35 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-emerald-400 shrink-0"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 2.11.55 4.08 1.51 5.82L.5 23.5l5.9-1.55A11.45 11.45 0 0012 23.5C18.35 23.5 23.5 18.35 23.5 12S18.35.5 12 .5zm0 20c-1.88 0-3.66-.5-5.2-1.4L4 20l.97-2.3A8.5 8.5 0 013.5 12 8.5 8.5 0 0120.5 12 8.5 8.5 0 0112 20.5z" />
              <path d="M17.6 14.2c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.17.2-.34.22-.63.075-.3-.15-1.27-.47-2.42-1.48-.9-.8-1.5-1.8-1.68-2.1-.17-.28-.018-.43.12-.57.12-.12.28-.3.42-.45.14-.15.18-.25.28-.42.1-.17.05-.32-.025-.47-.075-.15-.66-1.6-.9-2.2-.24-.57-.48-.5-.66-.5-.17 0-.37-.025-.57-.025-.2 0-.52.075-.8.35-.28.28-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.25 5.14 4.55 3.02 1.3 3.02.87 3.57.82.55-.05 1.78-.73 2.03-1.44.25-.7.25-1.3.175-1.44-.075-.15-.28-.23-.58-.38z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
