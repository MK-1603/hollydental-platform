"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GripVertical, Sparkles } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage?: string;
  afterImage?: string;
  treatmentName?: string;
  initials?: string;
  /** Optional sub-line shown under the treatment chip (e.g. "Single visit"). */
  detail?: string;
}

/**
 * Premium before/after image comparison slider.
 *
 * Two layers, the "after" image clipped to the right of the divider. The
 * handle is keyboard accessible (←/→ to nudge, Home/End to jump) and the
 * whole component falls back gracefully when an image fails to load.
 */
export default function BeforeAfterSlider({
  beforeImage = "/image_copy.png",
  afterImage = "/image.png",
  treatmentName = "Smile Makeover",
  initials = "J.S.",
  detail,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [beforeFailed, setBeforeFailed] = useState(false);
  const [afterFailed, setAfterFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const next = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(next);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateFromClientX(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
  };

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setPosition((p) => Math.max(0, p - 4));
    } else if (e.key === "ArrowRight") {
      setPosition((p) => Math.min(100, p + 4));
    } else if (e.key === "Home") {
      setPosition(0);
    } else if (e.key === "End") {
      setPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{ touchAction: "pan-y" }}
      className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-3xl overflow-hidden select-none border border-gray-100 shadow-[0_20px_60px_-20px_rgba(10,22,40,0.35)] bg-navy/5 group"
    >
      {/* Before image — base layer */}
      <ImagePane
        src={beforeImage}
        alt="Before treatment"
        failed={beforeFailed}
        onError={() => setBeforeFailed(true)}
        fallbackLabel="Before"
      />

      {/* After image — clipped to the right of the handle */}
      <div
        className="absolute inset-0 z-10 will-change-[clip-path] transition-[clip-path] duration-75"
        style={{
          clipPath: `polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%)`,
        }}
      >
        <ImagePane
          src={afterImage}
          alt="After treatment"
          failed={afterFailed}
          onError={() => setAfterFailed(true)}
          fallbackLabel="After"
          tone="gold"
        />
      </div>

      {/* Subtle vignette + scrim for chip readability */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/35 via-transparent to-black/25" />

      {/* Top labels */}
      <span
        className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-navy text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 rounded-full uppercase shadow-sm border border-white/60"
        aria-hidden
      >
        <span className="w-1.5 h-1.5 rounded-full bg-navy" />
        Before
      </span>
      <span
        className="absolute top-4 right-4 z-30 inline-flex items-center gap-1.5 bg-gold text-navy text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 rounded-full uppercase shadow-sm"
        aria-hidden
      >
        <Sparkles className="w-3 h-3" />
        After
      </span>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-30 -translate-x-1/2 pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <span className="block w-[2px] h-full bg-white/85 shadow-[0_0_24px_rgba(201,169,110,0.45)]" />
      </div>

      {/* Handle — interactive */}
      <button
        type="button"
        role="slider"
        aria-label="Drag to compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onKeyDown={handleKey}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          updateFromClientX(e.clientX);
        }}
        onTouchStart={(e) => {
          if (e.touches[0]) {
            setIsDragging(true);
            updateFromClientX(e.touches[0].clientX);
          }
        }}
        className="absolute top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-2 border-gold/80 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(10,22,40,0.4)] cursor-ew-resize active:scale-95 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        style={{ left: `${position}%` }}
      >
        <GripVertical className="w-4 h-4 text-navy" />
        <span className="sr-only">Drag to compare before and after</span>
      </button>

      {/* Bottom chip row */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-end justify-between gap-3">
        <div className="bg-navy/85 backdrop-blur text-white rounded-xl px-3 py-2 shadow-md max-w-[60%]">
          <span className="block text-[9px] uppercase tracking-[0.2em] text-gold font-bold">
            Treatment
          </span>
          <span className="block text-xs font-semibold leading-tight truncate">
            {treatmentName}
          </span>
          {detail && (
            <span className="block text-[10px] text-gray-300 mt-0.5 truncate">
              {detail}
            </span>
          )}
        </div>
        <div className="bg-gold text-navy rounded-xl px-3 py-2 shadow-md text-right">
          <span className="block text-[9px] uppercase tracking-[0.2em] font-bold opacity-80">
            Patient
          </span>
          <span className="block text-xs font-bold leading-tight">
            {initials}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Image pane with fallback -------------------- */

function ImagePane({
  src,
  alt,
  failed,
  onError,
  fallbackLabel,
  tone = "navy",
}: {
  src: string;
  alt: string;
  failed: boolean;
  onError: () => void;
  fallbackLabel: string;
  tone?: "navy" | "gold";
}) {
  if (failed) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          tone === "gold"
            ? "bg-gradient-to-br from-gold/20 via-gold/10 to-gold/30"
            : "bg-gradient-to-br from-navy/10 via-navy/5 to-navy/20"
        }`}
      >
        <div className="text-center space-y-2">
          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
              tone === "gold"
                ? "bg-gold/20 text-gold"
                : "bg-navy/10 text-navy"
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-navy/60">
            {fallbackLabel}
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={onError}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
