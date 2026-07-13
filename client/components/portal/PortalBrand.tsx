"use client";

import Link from "next/link";
import { CLINIC } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";

interface PortalBrandProps {
  className?: string;
  size?: number;
  asLink?: boolean;
}

export default function PortalBrand({ className = "", size = 28, asLink = true }: PortalBrandProps) {
  const { user } = useAuthStore();
  
  const inner = (
    <div className="flex items-center gap-3">
      {/* Humanized Brand Icon */}
      <div 
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-mark.png"
          alt="Hollyhill Dental"
          width={size}
          height={size}
          className="w-full h-full object-contain drop-shadow-sm"
          draggable={false}
        />
      </div>
      
      {/* Clean SaaS Wordmark */}
      <div className="flex flex-col leading-none justify-center">
        <span className="font-sans font-bold tracking-tight text-navy whitespace-nowrap" style={{ fontSize: Math.max(size * 0.55, 15) }}>
          Hollyhill <span className="text-[#009BDE]">Dental</span>
        </span>
      </div>
    </div>
  );

  const wrapperClass = `inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded-md ${className}`;

  if (!asLink) {
    return <div className={wrapperClass}>{inner}</div>;
  }

  const destination = user
    ? user.role === "admin"
      ? "/admin/dashboard"
      : "/portal/dashboard"
    : "/";

  return (
    <Link href={destination} className={wrapperClass} aria-label={CLINIC.name}>
      {inner}
    </Link>
  );
}
