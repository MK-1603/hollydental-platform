"use client";

import { useUIStore } from "@/store/useUIStore";
import { ArrowRight } from "lucide-react";

interface BookButtonProps {
  className?: string;
  label?: string;
  /** Optional service slug to pre-select on the booking page. */
  serviceSlug?: string;
  showIcon?: boolean;
}

export default function BookButton({
  className = "bg-gold hover:bg-gold-dark text-navy font-bold text-xs px-6 py-3 rounded-lg shadow-md transition-colors",
  label = "Book Appointment",
  serviceSlug,
  showIcon = false,
}: BookButtonProps) {
  const { openBookingModal, setBookingServiceSlug } = useUIStore();
  const handleClick = () => {
    if (serviceSlug) {
      setBookingServiceSlug(serviceSlug);
    }
    openBookingModal();
  };

  return (
    <button onClick={handleClick} className={`${className} cursor-pointer border-0`}>
      {label}
      {showIcon && <ArrowRight className="w-4 h-4 ml-1.5 inline-block" />}
    </button>
  );
}
