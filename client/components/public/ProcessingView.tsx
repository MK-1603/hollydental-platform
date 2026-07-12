"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";

const processingMessages = [
  "Encrypting your credentials...",
  "Verifying account information...",
  "Preparing your patient portal...",
  "Connecting to HollyHill Dental...",
  "Finalising secure access..."
];

export default function ProcessingView({ type, status }: { type: 'register' | 'login', status: 'processing' | 'success' }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (status === 'success') return;
    const interval = setInterval(() => setMsgIdx(prev => (prev + 1) % processingMessages.length), 1800);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="w-full h-[600px] md:h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden bg-white md:rounded-[24px]">
      <style>{`
        @keyframes custom-scale-up { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes progress-slide { 0% { left: -40%; } 100% { left: 100%; } }
      `}</style>
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC] to-white pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#2563EB] rounded-full blur-[140px] opacity-[0.04] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-[400px] mx-auto">
        {status === 'processing' ? (
          <div className="relative flex items-center justify-center w-[84px] h-[84px] mb-[32px]">
            <div className="absolute inset-0 border-[3px] border-[#EEF6FF] rounded-full animate-pulse" />
            <div className="absolute inset-0 border-[3px] border-t-[#2563EB] border-r-[#2563EB]/30 border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.2s' }} />
            <ShieldCheck className="w-8 h-8 text-[#2563EB]" />
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-[84px] h-[84px] mb-[32px] animate-[custom-scale-up_0.5s_ease-out_forwards]">
            <div className="absolute inset-0 bg-[#10B981]/10 rounded-full animate-pulse" />
            <CheckCircle2 className="w-[52px] h-[52px] text-[#10B981]" />
          </div>
        )}

        <h2 className="text-[26px] md:text-[30px] font-bold text-[#0F172A] mb-[12px] leading-[1.2]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {status === 'processing' ? (type === 'register' ? 'Creating Your Secure Account' : 'Signing You In Securely') : (type === 'register' ? 'Account Created Successfully' : 'Welcome Back')}
        </h2>
        
        <div className="h-[24px] mb-[40px] flex items-center justify-center overflow-hidden w-full">
          <p key={status === 'success' ? 'success' : msgIdx} className="text-[15px] font-medium text-[#64748B] animate-fade-in m-0">
            {status === 'processing' ? processingMessages[msgIdx] : "Redirecting to your secure dashboard..."}
          </p>
        </div>

        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-[16px]">
            HollyHill Dental • Premium Platform
          </div>
          
          <div className="w-[280px] h-[4px] bg-[#F1F5F9] rounded-full overflow-hidden mb-[24px] relative shadow-inner">
             {status === 'processing' ? (
                <div className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-[#2563EB] to-[#06B6D4] rounded-full animate-[progress-slide_1.8s_ease-in-out_infinite]" />
             ) : (
                <div className="absolute top-0 left-0 h-full w-full bg-[#10B981] rounded-full transition-all duration-500" />
             )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-[#64748B]">
            <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
            Secured using enterprise-grade encryption
          </div>
        </div>
      </div>
    </div>
  );
}
