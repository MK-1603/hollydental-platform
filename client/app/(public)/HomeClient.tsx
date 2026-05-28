"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CLINIC } from "@/lib/constants";
import {
  Star,
  ShieldCheck,
  Award,
  HeartHandshake,
  HelpCircle,
  ArrowRight,
  Clock,
  Smile,
  Calendar,
  Users,
  Activity,
  Heart,
  Sparkles,
  ChevronRight,
  Shield,
  Phone,
  MessageSquare,
  CheckCircle,
  Quote
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import BeforeAfterSlider from "@/components/public/BeforeAfterSlider";
import Testimonials3D from "@/components/public/Testimonials3D";

/* -------------------- 3D Scroll Animation Wrapper -------------------- */
function Scroll3D({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.05, // triggers when at least 5% of the element is visible
        rootMargin: "0px 0px -80px 0px"
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const outOfViewTransform = isMobile
    ? "translateY(20px) scale(0.99)" // Soft slide & scale on mobile to prevent layout issues
    : "translateY(50px) rotateX(6deg) scale(0.98)"; // Premium 3D perspective rotation on desktop

  const inViewTransform = isMobile
    ? "translateY(0px) scale(1)"
    : "translateY(0px) rotateX(0deg) scale(1)";

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] transform ${className}`}
      style={{
        opacity: isIntersecting ? 1 : 0,
        transform: isIntersecting ? inViewTransform : outOfViewTransform,
        perspective: isMobile ? undefined : "1000px",
        transformStyle: isMobile ? undefined : "preserve-3d",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

function SmileEstimator() {
  const [tab, setTab] = useState<"quiz" | "calculator">("quiz");

  // Quiz states
  const [quizStep, setQuizStep] = useState(1);
  const [concern, setConcern] = useState("");
  const [preference, setPreference] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // Calculator states
  const [treatment, setTreatment] = useState("cleaning");
  const [hasPrsi, setHasPrsi] = useState(false);

  const startAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      if (concern === "stained") {
        setRecommendation("We recommend Professional Teeth Whitening or Composite Veneers for a bright, stainless smile.");
      } else if (concern === "crooked") {
        setRecommendation("Invisalign Clear Aligners would be the perfect fit for virtually invisible teeth straightening.");
      } else if (concern === "missing") {
        setRecommendation("Dental Implants or Porcelain Bridges will restore your bite strength and aesthetic appeal permanently.");
      } else if (concern === "pain") {
        setRecommendation("Please schedule an Emergency Exam. You might require a gentle Root Canal or filling.");
      } else {
        setRecommendation("A routine check-up & scale and polish is perfect for maintaining your healthy gums and teeth.");
      }
      setQuizStep(3);
    }, 1500);
  };

  const getCalculatorDetails = () => {
    let basePrice = 95; // cleaning default
    let prsiSubsidy = 0;

    if (treatment === "cleaning") {
      basePrice = 95;
      if (hasPrsi) prsiSubsidy = 80; // pay €15
    } else if (treatment === "whitening") {
      basePrice = 199;
    } else if (treatment === "bonding") {
      basePrice = 150;
    } else if (treatment === "veneers") {
      basePrice = 600;
    } else if (treatment === "invisalign") {
      basePrice = 3200;
    }

    const finalPrice = Math.max(15, basePrice - prsiSubsidy);
    const monthlyInstallment = finalPrice > 300 ? (finalPrice / 12).toFixed(2) : null;

    return { basePrice, prsiSubsidy, finalPrice, monthlyInstallment };
  };

  const calc = getCalculatorDetails();

  return (
    <div className="space-y-4 text-white w-full">
      {/* Tabs */}
      <div className="flex bg-white/10 rounded-xl p-1 text-xs">
        <button
          onClick={() => { setTab("quiz"); setQuizStep(1); setRecommendation(null); }}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${tab === "quiz" ? "bg-gold text-navy" : "text-gray-300 hover:text-white"}`}
        >
          Smile Assessment
        </button>
        <button
          onClick={() => setTab("calculator")}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${tab === "calculator" ? "bg-gold text-navy" : "text-gray-300 hover:text-white"}`}
        >
          Cost Estimator
        </button>
      </div>

      {/* QUIZ TAB */}
      {tab === "quiz" && (
        <div className="space-y-4 min-h-[220px] flex flex-col justify-between">
          {quizStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-gold/90 font-bold uppercase tracking-wider">Step 1 of 2: Main Concern</p>
              <h4 className="font-serif text-sm font-bold text-white">What would you like to improve about your smile?</h4>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {[
                  { key: "stained", label: "Brighten stained/yellow teeth" },
                  { key: "crooked", label: "Straighten crooked teeth" },
                  { key: "missing", label: "Replace missing teeth" },
                  { key: "pain", label: "Resolve sensitivity or pain" },
                  { key: "routine", label: "Routine cleaning & checkup" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setConcern(opt.key); setQuizStep(2); }}
                    className="w-full text-left text-xs bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-gold/50 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {quizStep === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-gold/90 font-bold uppercase tracking-wider">Step 2 of 2: Preference</p>
              <h4 className="font-serif text-sm font-bold text-white">What is your primary treatment preference?</h4>
              <div className="grid grid-cols-1 gap-2 pt-2">
                {[
                  { key: "fast", label: "Fastest possible results" },
                  { key: "natural", label: "Most natural-looking outcome" },
                  { key: "budget", label: "Most budget-friendly approach" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setPreference(opt.key); startAnalysis(); }}
                    className="w-full text-left text-xs bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-gold/50 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setQuizStep(1)}
                className="text-[10px] text-gray-400 hover:text-gold block pt-2 text-left"
              >
                &larr; Back to Step 1
              </button>
            </div>
          )}

          {analyzing && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-10">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-300 animate-pulse font-medium">Analyzing your answers...</p>
            </div>
          )}

          {quizStep === 3 && !analyzing && (
            <div className="space-y-4">
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold block">Our Recommendation</span>
                <p className="text-xs text-gray-200 leading-relaxed font-light">{recommendation}</p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/portal/booking"
                  className="w-full bg-gold hover:bg-gold-dark text-navy text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  Book Free Consultation &rarr;
                </Link>
                <button
                  onClick={() => { setQuizStep(1); setRecommendation(null); }}
                  className="w-full text-[10px] text-gray-400 hover:text-gold py-1 text-center"
                >
                  Restart Assessment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CALCULATOR TAB */}
      {tab === "calculator" && (
        <div className="space-y-4 min-h-[220px] flex flex-col justify-between">
          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-gold text-left">Select Treatment</label>
            <select
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-gold/50 cursor-pointer"
            >
              <option value="cleaning" className="bg-[#0c1b2f]">Routine Exam & Cleaning</option>
              <option value="whitening" className="bg-[#0c1b2f]">Professional Whitening Kit</option>
              <option value="bonding" className="bg-[#0c1b2f]">Composite Bonding (per tooth)</option>
              <option value="veneers" className="bg-[#0c1b2f]">Porcelain Veneers (per tooth)</option>
              <option value="invisalign" className="bg-[#0c1b2f]">Invisalign Full Alignment</option>
            </select>

            {treatment === "cleaning" && (
              <label className="flex items-center gap-2.5 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={hasPrsi}
                  onChange={(e) => setHasPrsi(e.target.checked)}
                  className="accent-gold h-4 w-4 rounded"
                />
                <div className="text-left">
                  <span className="block text-xs font-bold text-white">I qualify for PRSI Dental Benefit</span>
                  <span className="block text-[9px] text-gray-400 font-normal">Subsidizes exam & cleaning once yearly</span>
                </div>
              </label>
            )}
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2 text-left">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Standard Cost</span>
              <span className="font-semibold text-white">€{calc.basePrice.toFixed(2)}</span>
            </div>
            {calc.prsiSubsidy > 0 && (
              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                <span>PRSI Coverage</span>
                <span className="font-semibold">-€{calc.prsiSubsidy.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Your Estimate</span>
              <span className="text-lg font-bold text-gold">€{calc.finalPrice.toFixed(2)}</span>
            </div>
            {calc.monthlyInstallment && (
              <div className="bg-gold/15 border border-gold/25 rounded-xl p-2.5 text-center text-[10px] text-gold/90 font-medium">
                0% Interest Plan: <strong className="text-white">€{calc.monthlyInstallment}/mo</strong> (12 months)
              </div>
            )}
          </div>

          <Link
            href="/portal/booking"
            className="w-full bg-gold hover:bg-gold-dark text-navy text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            Claim This Estimate &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export default function HomeClient() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const { openLoginModal } = useUIStore();

  const goToBooking = () => {
    const target = "/portal/booking";
    if (user) {
      router.push(target);
      return;
    }
    openLoginModal(() => {
      router.push(target);
    });
  };

  const faqs = [
    {
      q: "Do you offer same-day appointments for dental emergencies?",
      a: "Yes! We reserve dedicated emergency slots daily. If you have severe toothache, bleeding, or a broken tooth, call us immediately at +353 21 430 3072 so we can schedule you today.",
    },
    {
      q: "Can I pay for my dental treatments in instalments?",
      a: "Absolutely. We offer tailored, interest-free payment plans for major treatments like Invisalign and Porcelain Veneers. Speak to our team to arrange monthly instalments.",
    },
    {
      q: "How does the PRSI dental benefit work?",
      a: "If you qualify under PRSI, you are entitled to one free dental exam and a subsidized teeth cleaning (€15 charge instead of the standard rate) once per calendar year.",
    },
    {
      q: "Is parking available at the clinic?",
      a: "Yes, we are located in Unit 6 of the Hollyhill Shopping Centre in Cork, which offers extensive free parking directly in front of the clinic.",
    },
  ];

  return (
    <div className="space-y-24 pb-32 md:pb-16 bg-white overflow-hidden font-sans">

      {/* 1. HERO SECTION (Preloaded background video + grid layout matching single page) */}
      <section className="relative pt-10 pb-16 md:py-20 lg:py-28 overflow-hidden bg-navy min-h-[calc(100dvh-144px)] md:min-h-[650px] lg:min-h-[750px] flex items-center justify-center">
        {/* Background Video (Desktop) */}
        <video
          src="/hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="hidden md:block absolute inset-0 w-full h-full object-cover z-0 opacity-100"
        />

        {/* Background Video (Mobile) */}
        <video
          src="/hero-mobile.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="block md:hidden absolute inset-0 w-full h-full object-cover z-0 opacity-100"
        />

        {/* Dark Navy Overlay to keep video visible and crisp */}
        <div className="absolute inset-0 bg-navy/45 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,173,239,0.18),transparent_60%)] z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          {/* Centered Content: Headline, Subtext, CTAs, Social Proof */}
          <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
            {/* Tagline Badge */}
            <div className="flex flex-col items-center gap-3 animate-fade-up">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-[10px] font-extrabold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-gold" />
                Smile with Confidence
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6.5xl font-bold leading-[1.1] !text-white tracking-tight animate-fade-up">
              Complete Dental Care <br />
              <span className="text-gold">For Every Smile</span>
            </h1>

            {/* Subtext */}
            <p className="text-gray-200 text-sm md:text-base leading-relaxed max-w-2xl font-normal animate-fade-up">
              Experience dental precision paired with a gentle touch. Our expert team utilizes state-of-the-art technology to ensure your smile remains your most confident asset.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3.5 w-full items-center animate-fade-up">
              {/* Row 1: Core Bookings */}
              <div className="flex flex-row gap-3 sm:gap-4 justify-center w-full">
                <button
                  onClick={goToBooking}
                  className="bg-gold hover:bg-gold-dark text-navy text-[10px] sm:text-xs font-bold uppercase tracking-wider px-5 py-3 sm:px-8 sm:py-4 rounded-full shadow-[0_4px_0_0_#987943] hover:shadow-[0_5px_0_0_#987943] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none transition-all duration-75 cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" /> Schedule Your Visit
                </button>
                <Link
                  href="/services"
                  className="border border-white/20 hover:border-gold hover:text-gold text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-5 py-3 sm:px-8 sm:py-4 rounded-full shadow-[0_4px_0_0_rgba(255,255,255,0.08)] hover:shadow-[0_5px_0_0_rgba(255,255,255,0.12)] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none transition-all duration-75 flex items-center gap-1 sm:gap-1.5 bg-white/5 hover:bg-white/10 backdrop-blur-md whitespace-nowrap"
                >
                  View All Services
                </Link>
              </div>

              {/* Row 2: Direct Contact */}
              <div className="flex flex-row gap-3 sm:gap-4 justify-center w-full">
                <a
                  href={CLINIC.phoneHref}
                  className="border border-white/15 hover:border-white/40 hover:text-gold text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-5 py-3 sm:px-8 sm:py-4 rounded-full shadow-[0_4px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_5px_0_0_rgba(255,255,255,0.08)] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none transition-all duration-75 flex items-center gap-1.5 sm:gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5 text-gold shrink-0" /> {CLINIC.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 2. PATIENT-CENTERED EXCELLENCE (Features strip wrapped in Scroll3D) */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-navy tracking-tight leading-tight">
              Patient-Centered Excellence
            </h2>
            <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-light">
              We believe dental care should be more than just procedures. It's about building relationships based on trust, comfort, and exceptional results.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

            {/* Card 1 */}
            <div className="group bg-gradient-to-b from-white to-[#fdfcf9] rounded-3xl border border-gold/15 hover:border-gold/45 p-8 shadow-[0_15px_40px_rgba(10,22,40,0.03)] hover:shadow-[0_25px_50px_rgba(10,22,40,0.08)] transition-all duration-300 flex flex-col gap-5 items-start hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-navy text-gold flex items-center justify-center shrink-0 border border-gold/20 shadow-md group-hover:scale-105 transition-transform duration-300">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Compassionate Care</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                Our team is dedicated to making every clinical step easy, quiet, and pain-free for children and adults alike.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-gradient-to-b from-white to-[#fdfcf9] rounded-3xl border border-gold/15 hover:border-gold/45 p-8 shadow-[0_15px_40px_rgba(10,22,40,0.03)] hover:shadow-[0_25px_50px_rgba(10,22,40,0.08)] transition-all duration-300 flex flex-col gap-5 items-start hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-navy text-gold flex items-center justify-center shrink-0 border border-gold/20 shadow-md group-hover:scale-105 transition-transform duration-300">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Advanced Tech</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                From low-radiation digital x-rays to intraoral imaging, we select advanced technology to guarantee accuracy and minimize discomfort.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-gradient-to-b from-white to-[#fdfcf9] rounded-3xl border border-gold/15 hover:border-gold/45 p-8 shadow-[0_15px_40px_rgba(10,22,40,0.03)] hover:shadow-[0_25px_50px_rgba(10,22,40,0.08)] transition-all duration-300 flex flex-col gap-5 items-start hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-navy text-gold flex items-center justify-center shrink-0 border border-gold/20 shadow-md group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Tailored Plans</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                No two smiles are the same. We develop custom treatment plans that align with your oral health goals and budget.
              </p>
            </div>
          </div>
        </section>
      </Scroll3D>

      {/* 3. COMPLETE DENTAL SERVICES (Grid Masonry wrapped in Scroll3D) */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold text-navy tracking-tight leading-tight">
                Complete Dental Services
              </h2>
              <p className="text-gray-400 text-xs md:text-sm font-light">
                Comprehensive solutions for your family's oral health.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 border border-navy/10 hover:border-gold hover:text-gold text-navy text-[11px] font-bold tracking-widest uppercase px-6 py-3 rounded-full shadow-[0_3px_0_0_rgba(10,22,40,0.06)] hover:shadow-[0_4px_0_0_rgba(10,22,40,0.1)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all duration-75 shrink-0 self-start md:self-auto bg-white cursor-pointer"
            >
              View More Services
              <ArrowRight className="w-3.5 h-3.5 text-gold" />
            </Link>
          </div>

          {/* Masonry Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

            {/* Card 1: General Dentistry (Landscape 2/3 width) */}
            <div
              onClick={() => router.push("/services/general-dentistry")}
              className="lg:col-span-2 group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 h-[300px] cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=600"
                alt="General Dentistry Room"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3 text-white">
                <span className="text-[9px] uppercase tracking-wider font-bold text-gold bg-gold/10 border border-gold/25 px-2.5 py-0.5 rounded-full inline-block">
                  PREVENTATIVE
                </span>
                <h3 className="font-serif text-xl font-bold">General Dentistry</h3>
                <p className="text-gray-300 text-xs leading-relaxed max-w-lg font-light line-clamp-2">
                  Routine check-ups, fillings, and cleanings to maintain your healthy smile.
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold group-hover:underline">
                  Learn More <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 2: Cosmetic Dentistry (Tall 1/3 width with real photo bg) */}
            <div
              onClick={() => router.push("/services/teeth-whitening")}
              className="lg:col-span-1 group relative rounded-3xl overflow-hidden cursor-pointer h-[300px] shadow-sm hover:shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=600"
                alt="Cosmetic Dentistry"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#009bde]/95 via-[#009bde]/55 to-[#009bde]/15" />

              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-3">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                  <Smile className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold">Cosmetic Dentistry</h3>
                <p className="text-white/90 text-xs leading-relaxed font-light">
                  Transform your smile with veneers, whitening, and bonding for a radiant appearance.
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                  View Transformations <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Card 3: Dental Implants (Short 1/3 width) */}
            <div
              onClick={() => router.push("/services/dental-crowns")}
              className="lg:col-span-1 group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 h-[260px] cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600"
                alt="Dental Implants"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3 text-white">
                <h3 className="font-serif text-2xl md:text-3xl font-bold">
                  Dental Implants
                </h3>
                <p className="text-gray-200 text-sm md:text-base leading-relaxed font-light">
                  Permanent, natural-looking replacements for missing teeth.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gold">
                  Learn More <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Card 4: Pediatric & Kids Dentistry (Landscape 2/3 width, light blue bg) */}
            <div
              onClick={() => router.push("/childrens-dentistry")}
              className="lg:col-span-2 group rounded-3xl p-8 bg-[#E8F5FF] grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-[260px] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="md:col-span-8 space-y-4">
                <h3 className="font-serif text-xl font-bold text-navy">Pediatric &amp; Kids Dentistry</h3>
                <p className="text-gray-600 text-xs leading-relaxed font-light">
                  A fun, fear-free environment specialized for the littlest smiles in your family. We make dental care fun and simple.
                </p>
                <button className="bg-gold hover:bg-[#009bde] text-white font-bold py-2.5 px-6 rounded-full text-xs uppercase tracking-wider shadow-[0_3px_0_0_#008BCC] hover:shadow-[0_4px_0_0_#008BCC] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all duration-75 cursor-pointer">
                  Schedule Child's Program
                </button>
              </div>

              <div className="md:col-span-4 flex justify-center">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-white shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400"
                    alt="Child patient smiling"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

          </div>
        </section>
      </Scroll3D>

      {/* 4. DOCTOR PROFILE SECTION */}
      <Scroll3D>
        <section className="bg-gradient-to-b from-[#fdfcf9] to-white py-20 md:py-24 border-y border-gold/15">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Image (Left on desktop) - Wrapped in Link to bio, name overlay removed */}
            <div className="lg:col-span-5 relative flex justify-center">
              <Link
                href="/dr-roghay-alizadeh"
                className="relative w-full max-w-[360px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/5 bg-white group hover:scale-[1.03] transition-all duration-500 cursor-pointer block"
                title="Read Dr. Roghay Alizadeh's Full Bio"
              >
                <img
                  src="/doctor.png"
                  alt={`${CLINIC.doctor} — ${CLINIC.doctorTitle}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </Link>
            </div>

            {/* Content (Right on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gold bg-gold/10 px-3.5 py-1.5 rounded-full border border-gold/15 inline-block">
                Clinical Leadership
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight">
                {CLINIC.doctor}
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/30 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                <Award className="w-3.5 h-3.5" /> {CLINIC.doctorTitle}
              </span>

              <p className="text-gray-600 text-xs md:text-sm leading-relaxed font-light">
                Dr. Roghay Alizadeh is recognised across Cork for her advanced aesthetic work — from
                porcelain veneers and composite bonding to complex full-mouth rehabilitation. She is
                equally known for her empathetic chair-side manner with anxious and complex patients.
              </p>

              <div className="rounded-2xl border border-gold/10 bg-white p-5 shadow-sm">
                <h4 className="font-serif text-xs font-bold text-navy mb-3 uppercase tracking-wider">
                  Credentials &amp; Memberships
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                  <li className="flex items-start gap-2.5 text-xs text-gray-700 font-light">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                    <span>Dental Council of Ireland (#4203)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-gray-700 font-light">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                    <span>Member of Irish Dental Association</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-gray-700 font-light">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                    <span>Advanced Cosmetic Dentistry Cert</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-gray-700 font-light">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                    <span>Nervous Patient Sedation Specialist</span>
                  </li>
                </ul>
              </div>

              <blockquote className="relative rounded-2xl border border-gold/30 bg-gold/5 p-5 text-navy">
                <Quote className="absolute -top-3 -left-3 w-7 h-7 text-gold bg-white rounded-full p-1.5 shadow" />
                <p className="font-serif italic text-sm md:text-base leading-snug">
                  &ldquo;Every smile we design starts with listening. Clinical detail follows naturally
                  from understanding what the patient actually wants.&rdquo;
                </p>
              </blockquote>

              <div className="pt-2">
                <Link
                  href="/dr-roghay-alizadeh"
                  className="inline-flex items-center gap-2 bg-navy hover:bg-[#061e3d] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full shadow-[0_4px_0_0_#031833] hover:shadow-[0_5px_0_0_#031833] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none transition-all duration-75 cursor-pointer"
                >
                  Read Full Bio &amp; Story <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>
            </div>

          </div>
        </section>
      </Scroll3D>

      {/* 5. REAL SMILE TRANSFORMATIONS */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-[0.25em] text-gold uppercase bg-gold/10 px-3.5 py-1.5 rounded-full border border-gold/15 inline-block">
                Smile Gallery
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy tracking-tight leading-tight">
                Real Smile Transformations
              </h2>
              <p className="text-gray-500 text-xs md:text-sm font-light">
                See the results of our precision cosmetic dentistry. Drag the slider to compare before &amp; after.
              </p>
            </div>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 border border-navy/10 hover:border-gold hover:text-gold text-navy text-[11px] font-bold tracking-widest uppercase px-6 py-3 rounded-full shadow-[0_3px_0_0_rgba(10,22,40,0.06)] hover:shadow-[0_4px_0_0_rgba(10,22,40,0.1)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all duration-75 shrink-0 self-start md:self-auto bg-white cursor-pointer"
            >
              Visit Smile Gallery
              <ArrowRight className="w-3.5 h-3.5 text-gold" />
            </Link>
          </div>

          {/* Grid of Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 max-w-[360px] md:max-w-[480px] mx-auto w-full">
              <BeforeAfterSlider
                treatmentName="General Dentistry"
                initials="M.H."
                beforeImage="/before & after/General Dentistry_Before.jpg"
                afterImage="/before & after/General Dentistry_After.jpg"
              />
              <p className="text-[11px] text-gray-400 font-light text-center">
                * Complete dental checkup and restoration.
              </p>
            </div>

            <div className="space-y-3 max-w-[360px] md:max-w-[480px] mx-auto w-full">
              <BeforeAfterSlider
                treatmentName="Composite Bonding"
                initials="P.K."
                beforeImage="/before & after/Composite Bonding_before.jpg"
                afterImage="/before & after/Composite Bonding_after.jpg"
              />
              <p className="text-[11px] text-gray-400 font-light text-center">
                * Quick, non-invasive composite restoration for chipped or spaced teeth.
              </p>
            </div>
          </div>
        </section>
      </Scroll3D>

      {/* 6. MODERN TECH SHOWCASE (Wrapped in Scroll3D) */}
      <Scroll3D>
        <section className="bg-navy text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,173,239,0.06),transparent_50%)]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

            {/* Tech List */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">
                Modern Tech for Comfortable Care
              </h2>
              <p className="text-gray-300 text-xs md:text-sm font-light">
                We invest in the future of dental care so every visit is faster, more precise, and entirely pain-free.
              </p>

              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-none">Digital Low-Radiation X-Rays</h4>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed font-light">Safe and detailed view that exposes a tiny fraction of standard x-ray radiation.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
                    <Smile className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-none">Advanced Laser Therapy</h4>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed font-light">Painless gum treatment and cavity preparation without the drill.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-none">Intraoral 3D Scanning</h4>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed font-light">Say goodbye to messy impressions. High-speed 3D digital smile mapping.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Photo */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[360px] aspect-[4/3] rounded-3xl">

                <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/5 relative z-10 bg-gray-900">
                  <img
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=500"
                    alt="Modern dental scanner and therapy device"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating 100% Badge */}
                <div className="absolute -top-4 -right-4 bg-gold text-white font-bold py-2.5 px-5 rounded-xl shadow-lg border border-gold/30 z-20 text-[10px] uppercase tracking-wider">
                  100% Pain Free
                </div>

              </div>
            </div>

          </div>
        </section>
      </Scroll3D>

      {/* 7. PREMIUM PRODUCTS & TREATMENTS (Wrapped in Scroll3D) */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[10px] font-bold tracking-[0.25em] text-gold uppercase bg-gold/10 px-3.5 py-1.5 rounded-full border border-gold/15 inline-block">
              Clinic Shop &amp; Treatments
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy tracking-tight leading-tight">
              Featured Products &amp; Premium Services
            </h2>
            <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-light">
              Elevate your home care routine and explore our top-tier cosmetic dental treatments recommended by our clinical team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Product Card 1: Dental Bonding */}
            <div className="group bg-gradient-to-b from-white via-white to-[#fefdfb] rounded-3xl border border-gold/15 hover:border-gold/45 overflow-hidden shadow-[0_12px_30px_-5px_rgba(10,22,40,0.03)] hover:shadow-[0_30px_50px_-10px_rgba(201,169,110,0.22)] transition-all duration-500 flex flex-col h-full hover:translate-y-[-8px] hover:[transform:rotateX(4deg)_rotateY(-2deg)] relative [transform-style:preserve-3d] [perspective:1000px] border-b-[3px] border-b-gold/20 hover:border-b-gold/60">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 border-b border-gold/10 [transform-style:preserve-3d]">
                <img
                  src="/products/image.png"
                  alt="Dental Bonding Treatment"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-navy/95 border border-gold/30 text-gold font-serif font-bold text-xs px-4 py-2 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.2)] [transform:translateZ(30px)]">
                  €120.00 – €180.00
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-7 flex flex-col flex-grow justify-between space-y-5 [transform-style:preserve-3d]">
                <div className="space-y-3">
                  <span className="text-[9px] font-bold tracking-widest text-gold uppercase bg-gold/10 px-2.5 py-1 rounded-full border border-gold/15 inline-block [transform:translateZ(20px)]">Cosmetic Procedure</span>
                  <h3 className="font-serif text-lg font-bold text-navy group-hover:text-gold transition-colors [transform:translateZ(25px)]">
                    Dental Bonding
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    With dental bonding we can repair chips, stains and fluorosis as well as change the shape and size of the tooth to improve your smile. We do this by adding composite (white tooth filling) carefully to the teeth. Book an appointment with us and our amazing dental team who will walk you through the process and put your mind at ease!! Contact 0214303072 for bookings
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={goToBooking}
                    className="w-full bg-gold hover:bg-gold-dark text-navy text-xs font-bold uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_0_#987943] hover:shadow-[0_5px_0_0_#987943] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" /> Book Treatment
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-3">
                    Or call <a href="tel:0214303072" className="underline hover:text-gold">021 430 3072</a> for bookings
                  </p>
                </div>
              </div>
            </div>

            {/* Product Card 2: Black Is White Teeth Whitening Toothpaste */}
            <div className="group bg-gradient-to-b from-white via-white to-[#fefdfb] rounded-3xl border border-gold/15 hover:border-gold/45 overflow-hidden shadow-[0_12px_30px_-5px_rgba(10,22,40,0.03)] hover:shadow-[0_30px_50px_-10px_rgba(201,169,110,0.22)] transition-all duration-500 flex flex-col h-full hover:translate-y-[-8px] hover:[transform:rotateX(4deg)_rotateY(-2deg)] relative [transform-style:preserve-3d] [perspective:1000px] border-b-[3px] border-b-gold/20 hover:border-b-gold/60">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 border-b border-gold/10 [transform-style:preserve-3d]">
                <img
                  src="/products/image copy.png"
                  alt="Black Is White Teeth Whitening Toothpaste"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-navy/95 border border-gold/30 text-gold font-serif font-bold text-xs px-4 py-2 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.2)] [transform:translateZ(30px)]">
                  €30.00
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-7 flex flex-col flex-grow justify-between space-y-5 [transform-style:preserve-3d]">
                <div className="space-y-3">
                  <span className="text-[9px] font-bold tracking-widest text-gold uppercase bg-gold/10 px-2.5 py-1 rounded-full border border-gold/15 inline-block [transform:translateZ(20px)]">Daily Care</span>
                  <h3 className="font-serif text-lg font-bold text-navy group-hover:text-gold transition-colors [transform:translateZ(25px)]">
                    Black Is White Whitening Toothpaste
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Fresh lime mint toothpaste from Curaprox with activated carbon to gently lift surface stains and brighten the natural whiteness of teeth. Daily use, fluoride formula, suitable for sensitive teeth.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="tel:0214303072"
                    className="w-full border border-navy/15 hover:border-gold hover:text-gold text-navy text-xs font-bold uppercase tracking-wider py-4 rounded-2xl shadow-[0_3px_0_0_rgba(10,22,40,0.06)] hover:shadow-[0_4px_0_0_rgba(10,22,40,0.1)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2 bg-white cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-gold" /> Purchase at Clinic
                  </a>
                  <p className="text-[10px] text-center text-gray-400 mt-3">
                    Available for pick up during clinic hours
                  </p>
                </div>
              </div>
            </div>

            {/* Product Card 3: Pola Light Teeth Whitening Kits */}
            <div className="group bg-gradient-to-b from-white via-white to-[#fefdfb] rounded-3xl border border-gold/15 hover:border-gold/45 overflow-hidden shadow-[0_12px_30px_-5px_rgba(10,22,40,0.03)] hover:shadow-[0_30px_50px_-10px_rgba(201,169,110,0.22)] transition-all duration-500 flex flex-col h-full hover:translate-y-[-8px] hover:[transform:rotateX(4deg)_rotateY(-2deg)] relative [transform-style:preserve-3d] [perspective:1000px] border-b-[3px] border-b-gold/20 hover:border-b-gold/60">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 border-b border-gold/10 [transform-style:preserve-3d]">
                <img
                  src="/products/image copy 2.png"
                  alt="Pola Light Teeth Whitening Kits"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-navy/95 border border-gold/30 text-gold font-serif font-bold text-xs px-4 py-2 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.2)] [transform:translateZ(30px)]">
                  €250.00
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-7 flex flex-col flex-grow justify-between space-y-5 [transform-style:preserve-3d]">
                <div className="space-y-3">
                  <span className="text-[9px] font-bold tracking-widest text-gold uppercase bg-gold/10 px-2.5 py-1 rounded-full border border-gold/15 inline-block [transform:translateZ(20px)]">Whitening Kit</span>
                  <h3 className="font-serif text-lg font-bold text-navy group-hover:text-gold transition-colors [transform:translateZ(25px)]">
                    Pola Light Whitening Kits
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Advanced teeth whitening system. Enjoy a brighter more confident smile in 5 days. Pola Light is an advanced tooth whitening system that combines Pola's award winning whitening formula, with an LED mouthpiece, for a faster whitening treatment. Buy Now
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={goToBooking}
                    className="w-full bg-navy hover:bg-[#061e3d] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_0_#031833] hover:shadow-[0_5px_0_0_#031833] hover:translate-y-[-1px] active:translate-y-[3px] active:shadow-none transition-all duration-75 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Buy Now
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-3">
                    Consultation required before product purchase
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Scroll3D>

      {/* 8. TESTIMONIALS (Dynamic premium 3D card swiping - transparent backdrop as requested) */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative flex flex-col gap-10">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-gold bg-gold/10 px-3.5 py-1.5 rounded-full border border-gold/15 inline-block">
              Patient Testimonials
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy tracking-tight">
              Smiles We've Transformed
            </h2>
            <p className="text-gray-600 text-xs md:text-sm font-light">
              Discover why over 5,000 Cork patients trust Dr. Roghay Alizadeh and the Hollyhill Dental team.
            </p>
          </div>

          {/* 3D Testimonials Stack */}
          <div className="relative z-10 w-full py-4">
            <Testimonials3D />
          </div>
        </section>
      </Scroll3D>

      {/* 9. FAQ ACCORDION (Wrapped in Scroll3D - Redesigned as 3D premium) */}
      <Scroll3D>
        <section className="max-w-3xl mx-auto px-4 space-y-8 py-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold text-navy">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-xs font-light">Got questions about our clinical care? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;

              return (
                <div
                  key={index}
                  className={`border rounded-2xl overflow-hidden bg-white transition-all duration-300 transform [perspective:1000px] ${isOpen
                    ? "border-gold/45 shadow-[0_15px_35px_-5px_rgba(201,169,110,0.18)] -translate-y-1 scale-[1.01]"
                    : "border-gray-100 shadow-[0_4px_20px_rgba(10,22,40,0.02)] hover:border-gold/25 hover:shadow-[0_12px_25px_-5px_rgba(201,169,110,0.08)] hover:-translate-y-0.5"
                    }`}
                >
                  <div
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#faf9f6]/40 transition-colors select-none"
                  >
                    <span className={`text-xs md:text-sm font-bold leading-snug transition-colors ${isOpen ? "text-gold" : "text-navy"}`}>{faq.q}</span>
                    <span className={`font-bold text-lg transition-transform duration-300 ${isOpen ? "text-gold rotate-180" : "text-gray-400"}`}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="p-6 bg-gradient-to-b from-white to-[#faf9f6]/30 border-t border-gold/10 text-xs text-gray-600 leading-relaxed font-light animate-fade-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </Scroll3D>

      {/* 10. READY FOR HEALTHIER, BRIGHTER SMILE? (Final CTA Block redesigned as 3D premium) */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-gradient-to-br from-navy via-[#0c1b2f] to-[#040c17] rounded-[2.5rem] py-12 px-6 md:p-16 text-center text-white space-y-8 relative overflow-hidden border border-gold/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] group transition-all duration-500 hover:shadow-[0_35px_80px_-10px_rgba(201,169,110,0.25)] hover:border-gold/60">
            {/* Ambient radial glow effects inside container */}
            <div className="absolute -left-1/4 -top-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/15 transition-all duration-700" />
            <div className="absolute -right-1/4 -bottom-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/15 transition-all duration-700" />

            {/* Top light line accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 bg-gold/15 text-gold border border-gold/30 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full select-none animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Begin Your Journey Today</span>
              </span>

              <h2 className="font-serif text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
                Ready for a Healthier, <span className="text-gold italic font-medium">Brighter Smile</span>?
              </h2>

              <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto font-light">
                Join thousands of happy Cork patients and experience the future of premium dental care today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 relative z-10 w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
              <button
                onClick={goToBooking}
                className="w-full sm:w-auto bg-gradient-to-r from-gold to-[#D6B47C] hover:from-gold-dark hover:to-gold text-navy font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-navy shrink-0" /> Book Appointment Now
              </button>

              <a
                href={CLINIC.phoneHref}
                className="w-full sm:w-auto border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-semibold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-gold shrink-0" /> Call Clinic: {CLINIC.phone}
              </a>

              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto border border-emerald-500/35 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400 font-semibold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" /> WhatsApp Chat
              </a>
            </div>
          </div>
        </section>
      </Scroll3D>

    </div>
  );
}
