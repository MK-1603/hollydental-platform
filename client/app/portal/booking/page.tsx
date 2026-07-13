"use client";

import React from "react";
import BookingForm from "@/components/public/BookingForm";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PortalBookingPage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto pb-12 pt-4">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-navy hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy">Book an Appointment</h1>
          <p className="text-[13px] text-gray-500 font-medium mt-1">Schedule your next visit at Hollyhill Dental Clinic</p>
        </div>
      </div>

      <div className="relative h-[750px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <BookingForm compact={true} onClose={() => router.push("/portal/dashboard")} />
      </div>
    </div>
  );
}
