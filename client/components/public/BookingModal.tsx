"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookingStore } from "@/store/useBookingStore";
import Logo from "@/components/public/Logo";
import BookingForm from "@/components/public/BookingForm";
import { X, MapPin, Clock, Phone, ShieldCheck, Award, Star, Stethoscope, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BookingModal() {
  const { isBookingModalOpen, closeBookingModal } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [showAbortModal, setShowAbortModal] = useState(false);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isBookingModalOpen) {
      document.body.style.overflow = "hidden";
      useBookingStore.getState().clearBookingData();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isBookingModalOpen]);

  const handleClose = () => {
    const currentStep = useBookingStore.getState().step;
    if (currentStep > 1 && currentStep < 8) {
      setShowAbortModal(true);
    } else {
      useBookingStore.getState().clearBookingData();
      closeBookingModal();
    }
  };

  const confirmAbort = () => {
    useBookingStore.getState().clearBookingData();
    setShowAbortModal(false);
    closeBookingModal();
  };

  if (!isBookingModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAFBFC] animate-fade-in">
      
      {/* Full Screen Container */}
      <div className="w-full h-full bg-[#FAFBFC] flex flex-col lg:flex-row overflow-hidden relative animate-fade-in">
        
        {/* LEFT PANEL (35%) - Informative Sidebar */}
        <aside className="hidden lg:flex w-[35%] max-w-[480px] bg-white border-r border-[#E7ECF2] flex-col overflow-y-auto custom-scrollbar relative">
          
          <div className="p-10 space-y-10">
            {/* Header / Logo */}
            <div>
              <Logo variant="full" theme="dark" size={32} />
              <p className="mt-4 text-sm text-gray-500 font-light leading-relaxed">
                Experience premium, comfortable, and highly personalized dental care in the heart of Cork.
              </p>
            </div>

            {/* Doctor Info Card */}
            <div className="bg-[#FAFBFC] rounded-[20px] p-6 border border-[#E7ECF2] shadow-sm flex gap-5 items-start">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-white shadow-sm">
                <img src="/doctor.png" alt="Dr. Roghay Alizadeh" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-navy">Dr. Roghay Alizadeh</h4>
                <p className="text-xs text-[#1E73BE] font-semibold uppercase tracking-wider mb-2">Principal Dentist</p>
                <div className="flex items-center gap-1 text-xs text-yellow-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-gray-500 ml-1">(4.9/5)</span>
                </div>
              </div>
            </div>

            {/* Clinic Details */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1E73BE]/10 flex items-center justify-center text-[#1E73BE] shrink-0 mt-0.5">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-navy">Hollyhill Dental Clinic</h5>
                  <p className="text-sm text-gray-500 mt-1 font-light leading-relaxed">
                    Unit 5, Hollyhill Knocknaheeny<br />
                    Primary Care Centre, Cork
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1E73BE]/10 flex items-center justify-center text-[#1E73BE] shrink-0 mt-0.5">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-navy">Opening Hours</h5>
                  <p className="text-sm text-gray-500 mt-1 font-light leading-relaxed">
                    Mon - Fri: 9:00 AM – 5:30 PM<br />
                    Sat - Sun: Closed
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1E73BE]/10 flex items-center justify-center text-[#1E73BE] shrink-0 mt-0.5">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-navy">Contact Us</h5>
                  <p className="text-sm text-gray-500 mt-1 font-light leading-relaxed">
                    021 430 3072<br />
                    hollyhilldental1@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-[#E7ECF2]" />

            {/* Trust Badges */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Our Commitment</h5>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" /> Secure & Encrypted Booking
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#1E73BE]" /> Instant Confirmation
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Award className="w-4.5 h-4.5 text-gold" /> PRSI & Medical Card Accepted
                </li>
              </ul>
            </div>

            <div className="bg-[#1E73BE]/5 rounded-[16px] p-4 text-xs text-navy/70 leading-relaxed font-light border border-[#1E73BE]/10">
              Your data is handled securely in compliance with GDPR and medical privacy standards.
            </div>
          </div>
        </aside>

        
      {/* Abort Modal */}
      {showAbortModal && (
        <div className="fixed inset-0 z-[110] bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="max-w-[400px] w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-scale-in">
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-navy">Cancel Booking?</h3>
              <p className="text-sm text-gray-500 leading-relaxed px-2">
                Are you sure you want to leave? All your selected dates, times, and details will be lost.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button 
                  onClick={confirmAbort}
                  className="w-full sm:flex-1 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-500 font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  Yes, Cancel
                </button>
                <button 
                  onClick={() => setShowAbortModal(false)}
                  className="w-full sm:flex-[1.5] bg-navy hover:bg-[#173B6D] text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-colors"
                >
                  Continue Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* RIGHT PANEL (65%) - Booking Wizard */}
        <main className="flex-1 flex flex-col relative h-full bg-[#FAFBFC] overflow-hidden">
          
          {/* Header (Desktop + Mobile) */}
          <header className="flex items-center justify-between lg:justify-end px-6 lg:px-10 py-5 shrink-0 bg-white lg:bg-transparent border-b border-[#E7ECF2] lg:border-none z-40">
             <div className="lg:hidden">
               <Logo variant="full" theme="dark" size={32} showTagline={false} />
             </div>
             <button 
                onClick={handleClose}
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-navy hover:bg-gray-100 h-10 px-4 lg:px-5 rounded-full transition-colors text-sm font-semibold border border-gray-200 lg:border-transparent hover:border-gray-200"
              >
                <span className="hidden sm:inline">Cancel Booking</span> <X className="w-4 h-4" />
              </button>
          </header>

          <div className="flex-1 flex flex-col px-4 sm:px-8 md:px-12 pb-4 overflow-hidden min-h-0">
             <div className="max-w-lg mx-auto w-full h-full flex flex-col">
                <BookingForm compact={true} onClose={closeBookingModal} />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
