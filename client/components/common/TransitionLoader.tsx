"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MESSAGES = [
  "Preparing Page...",
  "Fetching Content...",
  "Loading Services...",
  "Updating Information...",
  "Preparing Your Experience...",
  "Almost Ready...",
];

export default function TransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [fadeOverlay, setFadeOverlay] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);

  // Track the timestamp when loading began to enforce 2000ms minimum
  const startTimeRef = useRef<number>(0);
  const routeFinishedRef = useRef<boolean>(false);
  const minDurationTimer = useRef<NodeJS.Timeout | null>(null);

  const startLoading = () => {
    if (isLoading) return;
    setIsLoading(true);
    setFadeOverlay(true); // Fade overlay in
    routeFinishedRef.current = false;
    startTimeRef.current = Date.now();
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

    // Start UI animations at 150ms and 300ms
    setTimeout(() => setShowUI(true), 150);

    // Enforce 2000ms duration.
    minDurationTimer.current = setTimeout(() => {
      checkCompletion();
    }, 2000);
  };

  const stopLoading = () => {
    // Begin fade out
    setFadeOverlay(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowUI(false);
    }, 300); // 300ms CSS transition
  };

  const checkCompletion = () => {
    if (routeFinishedRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= 1950) { // Using 1950 to account for JS timing slop against 2000ms
        stopLoading();
      }
    }
  };

  // 1. Detect Navigation Completion
  useEffect(() => {
    if (isLoading) {
      routeFinishedRef.current = true;
      checkCompletion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // 2. Intercept Global Link Clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;

      // Ignore modified clicks (open in new tab, etc.)
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        target.hasAttribute("download") ||
        target.target === "_blank" ||
        target.hasAttribute("data-no-loader")
      ) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(target.href);

      // Only trigger for internal routes that actually change the path/query
      if (
        currentUrl.origin === targetUrl.origin &&
        (currentUrl.pathname !== targetUrl.pathname || currentUrl.search !== targetUrl.search)
      ) {
        // Exclude hash links to same page
        if (targetUrl.hash && currentUrl.pathname === targetUrl.pathname) return;
        
        startLoading();
      }
    };

    // Use capture phase to catch clicks before React prevents defaults
    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[rgba(255,255,255,0.70)] backdrop-blur-[16px] transition-opacity duration-300 ease-in-out ${
        fadeOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ pointerEvents: fadeOverlay ? "auto" : "none" }}
    >
      {/* Soft Blue Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#90CAF9]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="internal-particle ip-1" />
        <div className="internal-particle ip-2" />
        <div className="internal-particle ip-3" />
      </div>

      {showUI && (
        <div className="relative z-10 flex flex-col items-center animate-internal-ui-in">
          
          {/* Custom Dot Ring */}
          <div className="relative w-14 h-14 mb-8">
             <div className="absolute inset-0 animate-internal-spin-slow">
               {[...Array(12)].map((_, i) => (
                 <div 
                   key={i} 
                   className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full"
                   style={{ 
                     transform: `rotate(${i * 30}deg) translateY(-22px)`,
                     backgroundColor: '#1E88E5',
                     opacity: 1 - (i * 0.075)
                   }}
                 />
               ))}
             </div>
          </div>

          {/* Thin Progress Line */}
          <div className="relative w-48 h-[2px] bg-[#E3F2FD] rounded-full overflow-hidden mb-6">
             <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-[#64B5F6] to-transparent animate-internal-line-sweep" />
          </div>

          {/* Dynamic Loading Message */}
          <div className="h-6 w-full flex items-center justify-center animate-internal-text-in">
            <p className="font-sans text-[13px] md:text-[14px] text-[#163A6B]/80 font-medium tracking-wide">
              {message}
            </p>
          </div>
          
        </div>
      )}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes internal-ui-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-internal-ui-in {
          animation: internal-ui-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes internal-text-in {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-internal-text-in {
          animation: internal-text-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
          opacity: 0;
        }

        @keyframes internal-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-internal-spin-slow {
          animation: internal-spin-slow 1.6s linear infinite;
        }

        @keyframes internal-line-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-internal-line-sweep {
          animation: internal-line-sweep 1.5s ease-in-out infinite;
        }

        /* Floating Particles */
        .internal-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #64B5F6;
          border-radius: 50%;
          filter: blur(0.5px);
          opacity: 0;
        }
        @keyframes internal-float {
          0% { transform: translateY(100vh); opacity: 0; }
          30% { opacity: 0.6; }
          70% { opacity: 0.6; }
          100% { transform: translateY(-10vh); opacity: 0; }
        }
        .ip-1 { left: 20%; animation: internal-float 8s linear infinite; }
        .ip-2 { left: 75%; animation: internal-float 12s linear infinite 2s; }
        .ip-3 { left: 45%; animation: internal-float 10s linear infinite 4s; }
      `}} />
    </div>
  );
}
