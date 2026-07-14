"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/public/Logo";

const INTRO_VERSION = "7";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing HollyHill Dental...");
  const [success, setSuccess] = useState(false);
  const [fadeMsg, setFadeMsg] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seenKey = `hh-intro-seen-v${INTRO_VERSION}`;
    const seen = window.sessionStorage.getItem(seenKey) === "1";

    if (seen) {
      setRemoved(true);
      return;
    }

    // Immediately mark as seen so a quick page refresh doesn't trigger it again
    try {
      window.sessionStorage.setItem(seenKey, "1");
    } catch {}

    document.body.style.overflow = "hidden";

    const updateStage = (p: number, m: string) => {
      setFadeMsg(true);
      setTimeout(() => {
        setMessage(m);
        setProgress(p);
        setFadeMsg(false);
      }, 300); // 300ms for text fade out
    };

    // Staged Timings
    const t1 = setTimeout(() => updateStage(15, "Loading Premium Experience..."), 800);
    const t2 = setTimeout(() => updateStage(35, "Preparing Patient Services..."), 2000);
    const t3 = setTimeout(() => updateStage(55, "Connecting Secure Systems..."), 3200);
    const t4 = setTimeout(() => updateStage(75, "Almost Ready..."), 4400);
    const t5 = setTimeout(() => updateStage(90, "Welcome to HollyHill Dental"), 5400);
    
    // Reach 100% and show success
    const t6 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setSuccess(true);
      }, 400); // wait for the bar to finish filling visually before swapping
    }, 6400);

    // Fade out preloader entirely after holding success state for 1.5s
    const t7 = setTimeout(() => {
      setHidden(true);
    }, 8300);

    const t8 = setTimeout(() => {
      setRemoved(true);
      document.body.style.overflow = "";
    }, 9100);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); 
      clearTimeout(t7); clearTimeout(t8);
      document.body.style.overflow = "";
    };
  }, []);

  if (removed) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-white overflow-hidden select-none transition-opacity duration-[800ms] ease-in-out pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] ${
        hidden ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#E3F2FD_0%,_#FFFFFF_70%)] opacity-80" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] md:w-[1200px] md:h-[1200px] bg-[#90CAF9]/15 rounded-full blur-[100px] md:blur-[150px] animate-desktop-glow pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="desktop-particle dp-1" />
        <div className="desktop-particle dp-2" />
        <div className="desktop-particle dp-3" />
        <div className="desktop-particle dp-4" />
        <div className="desktop-particle dp-5" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.25] pointer-events-none overflow-hidden mix-blend-multiply">
        <svg viewBox="0 0 1920 1080" className="w-full h-[150vh] md:h-full object-cover animate-desktop-wave" preserveAspectRatio="none">
           <path d="M0,540 C480,440 960,640 1440,540 C1920,440 1920,540 1920,540 L1920,1080 L0,1080 Z" fill="url(#wave-grad-1)" filter="blur(40px)" opacity="0.6"/>
           <path d="M0,640 C480,740 960,340 1440,540 C1920,740 1920,640 1920,640 L1920,1080 L0,1080 Z" fill="url(#wave-grad-2)" filter="blur(60px)" opacity="0.4"/>
           <path d="M-100,540 C380,440 860,640 1440,340 C1920,140 2020,440 2020,440 L2020,1080 L-100,1080 Z" fill="none" stroke="url(#wave-stroke)" strokeWidth="6" filter="blur(8px)" opacity="0.5"/>
           <defs>
             <linearGradient id="wave-grad-1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#90CAF9" />
                <stop offset="50%" stopColor="#64B5F6" />
                <stop offset="100%" stopColor="#1E88E5" />
             </linearGradient>
             <linearGradient id="wave-grad-2" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#E3F2FD" />
                <stop offset="50%" stopColor="#90CAF9" />
                <stop offset="100%" stopColor="#FFFFFF" />
             </linearGradient>
             <linearGradient id="wave-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#90CAF9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" />
             </linearGradient>
           </defs>
        </svg>
      </div>

      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.2]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} 
      />

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col items-center w-[85vw] max-w-[420px] md:max-w-none md:w-[540px] rounded-[32px] bg-[rgba(255,255,255,0.72)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.45)] shadow-[0_16px_60px_rgba(30,136,229,0.10)] px-6 py-10 md:px-14 md:py-16 animate-desktop-panel">
        
        {/* Logo Section */}
        <div className="mb-4 md:mb-5 flex items-center justify-center animate-desktop-logo">
           <Logo variant="full" size={64} theme="dark" asLink={false} />
           <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
             <div className="w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-[30deg] -translate-x-[200%] -translate-y-[50%] animate-desktop-sweep" style={{ animationDelay: '2.5s' }} />
           </div>
        </div>

        {/* Tagline */}
        <div className="text-center w-full mb-8 md:mb-10 animate-desktop-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          <p className="font-sans text-[11px] md:text-[13px] tracking-[0.25em] text-[#163A6B] uppercase font-bold opacity-75">
            Smile With Confidence
          </p>
        </div>

        {/* Elegant Divider */}
        <div className="w-full flex items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12 animate-desktop-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
           <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent to-[#163A6B]/20" />
           <span className="inline-flex items-center gap-2 md:gap-3 text-[9px] md:text-[11px] font-semibold text-[#163A6B]/80 uppercase tracking-[0.15em]">
             <span className="text-[#64B5F6] opacity-80">✦</span>
             Premium Dental Care
             <span className="text-[#64B5F6] opacity-80">✦</span>
           </span>
           <div className="h-[1px] w-8 md:w-12 bg-gradient-to-l from-transparent to-[#163A6B]/20" />
        </div>

        {/* Dynamic Loading / Success State */}
        <div className="w-full flex flex-col items-center justify-center min-h-[140px] animate-desktop-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'both' }}>
          
          {success ? (
            // SUCCESS STATE
            <div className="flex flex-col items-center text-center animate-fade-in-up">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                   <polyline points="22 4 12 14.01 9 11.01"></polyline>
                 </svg>
              </div>
              <p className="font-serif text-[18px] text-[#163A6B] font-medium mb-1">
                Welcome to HollyHill Dental
              </p>
              <p className="font-sans text-[12px] text-[#163A6B]/60 tracking-wide">
                Creating Beautiful & Confident Smiles
              </p>
            </div>
          ) : (
            // LOADING STATE
            <div className="w-full flex flex-col items-center animate-fade-in">
              {/* Desktop Bar */}
              <div className="hidden md:flex w-full items-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#E3F2FD] border border-[#90CAF9]/40 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M8 12c0 2.5 1.5 4 4 4s4-1.5 4-4-1-3-1-5c0-1.5-1.5-2-3-2s-3 .5-3 2c0 2-1 3-1 5z"></path>
                  </svg>
                </div>
                <div className="relative flex-1 h-[4px] bg-[#E3F2FD]/50 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#90CAF9] via-[#64B5F6] to-[#1E88E5] rounded-full transition-all duration-[1200ms] ease-out shadow-[0_0_8px_rgba(100,181,246,0.6)]"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="w-10 text-right shrink-0">
                  <span className="font-sans text-[12px] font-bold text-[#1E88E5]">
                    {Math.floor(progress)}%
                  </span>
                </div>
              </div>

              {/* Mobile Orbit Loader */}
              <div className="flex md:hidden relative w-12 h-12 mb-6">
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full"
                      style={{ 
                        transform: `rotate(${i * 36}deg) translateY(-20px)`,
                        backgroundColor: i < 3 ? '#1E88E5' : i < 6 ? '#64B5F6' : '#EAF5FF',
                        opacity: 1 - (i * 0.08)
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Tightly grouped text for mobile and desktop */}
              <div className="flex flex-col items-center gap-3">
                <p 
                  className={`font-sans text-[13px] md:text-[14px] text-[#163A6B]/80 font-medium tracking-wide text-center transition-opacity duration-300 ${fadeMsg ? "opacity-0" : "opacity-100"}`}
                >
                  {message}
                </p>
                <span className="flex md:hidden font-serif text-[22px] font-bold text-[#163A6B] tracking-wide">
                  {Math.floor(progress)}%
                </span>
              </div>
              
              {/* Pagination Dots (Desktop Only) */}
              <div className="hidden md:flex flex-col items-center gap-3 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1E88E5]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#90CAF9]/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#90CAF9]/40" />
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes desktop-glow {
          0%, 100% { opacity: 0.5; transform: scale(0.95) translate(-50%, -50%); }
          50% { opacity: 0.8; transform: scale(1.05) translate(-48%, -48%); }
        }
        .animate-desktop-glow {
          animation: desktop-glow 8s ease-in-out infinite;
          transform-origin: top left;
        }

        @keyframes desktop-wave {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(20px) scaleY(1.05); }
        }
        .animate-desktop-wave {
          animation: desktop-wave 12s ease-in-out infinite;
        }

        @keyframes desktop-panel {
          0% { opacity: 0; transform: translateY(30px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-desktop-panel {
          animation: desktop-panel 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes desktop-logo {
          0% { opacity: 0; transform: scale(0.95); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-desktop-logo {
          animation: desktop-logo 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          opacity: 0;
        }

        @keyframes desktop-sweep {
          0% { transform: translate(-200%, -50%) rotate(30deg); }
          100% { transform: translate(300%, -50%) rotate(30deg); }
        }
        .animate-desktop-sweep {
          animation: desktop-sweep 1.2s ease-out forwards;
        }

        @keyframes desktop-fade-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-desktop-fade-in {
          animation: desktop-fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.5s linear infinite;
        }

        .desktop-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #64B5F6;
          border-radius: 50%;
          filter: blur(0.5px);
          opacity: 0;
        }
        @keyframes desktop-float {
          0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
        }
        .dp-1 { left: 15%; animation: desktop-float 15s linear infinite; }
        .dp-2 { left: 80%; animation: desktop-float 22s linear infinite 4s; }
        .dp-3 { left: 35%; animation: desktop-float 18s linear infinite 8s; }
        .dp-4 { left: 65%; animation: desktop-float 25s linear infinite 2s; }
        .dp-5 { left: 25%; animation: desktop-float 20s linear infinite 12s; }
      `}} />
    </div>
  );
}
