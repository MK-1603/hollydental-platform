"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CLINIC } from "@/lib/constants";
import { Star, ShieldCheck, Award, HeartHandshake, HelpCircle, ArrowRight, Clock, Smile, Calendar, Users, Activity, Heart, ChevronRight, Shield, Phone, MessageSquare, CheckCircle, Quote } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import BeforeAfterSlider from "@/components/public/BeforeAfterSlider";
import Testimonials3D from "@/components/public/Testimonials3D";
import { GlowCard } from "@/components/ui/spotlight-card";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import IntroAnimation from "@/components/ui/scroll-morph-hero";
import { motion } from "framer-motion";

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
  const router = useRouter();
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
                <button
                  onClick={() => router.push("/booking")}
                  className="w-full bg-gold hover:bg-gold-dark text-navy text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  Book Free Consultation &rarr;
                </button>
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

          <button
            onClick={() => router.push("/booking")}
            className="w-full bg-gold hover:bg-gold-dark text-navy text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            Claim This Estimate &rarr;
          </button>
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
  const { openLoginModal, openBookingModal } = useUIStore();

  const goToBooking = () => {
    router.push("/booking");
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
        <div className="absolute inset-0 bg-navy/60 z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          {/* Centered Content: Headline, Subtext, CTAs, Social Proof */}
          <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
            {/* Tagline Badge */}
            <div className="flex flex-col items-center gap-3 animate-fade-up">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-[10px] font-extrabold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                <Activity className="w-3 h-3 text-gold" />
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
            <div className="flex flex-col gap-4 w-full items-center animate-fade-up">
              {/* Row 1: Core Bookings */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={goToBooking}
                  className="bg-white hover:bg-gray-50 text-navy text-sm font-semibold px-8 py-4 rounded-full shadow-[0_12px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-gold" /> Schedule Your Visit
                </button>
                <Link
                  href="/services"
                  className="bg-navy/60 hover:bg-navy/80 backdrop-blur-md border border-white/20 text-white text-sm font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1"
                >
                  View All Services
                </Link>
              </div>

              {/* Row 2: Direct Contact */}
              <div className="flex flex-row justify-center w-full mt-2">
                <a
                  href={CLINIC.phoneHref}
                  className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gold" /> Call {CLINIC.phone}
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
            <div className="h-16 flex items-center justify-center -mt-2 mb-4">
              <GooeyText
                texts={["Patient-Centered", "Excellence"]}
                morphTime={1.5}
                cooldownTime={2.5}
                textClassName="!text-4xl md:!text-5xl font-serif font-bold text-navy tracking-tight leading-tight"
                className="w-full font-serif"
              />
            </div>
            <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-light">
              We believe dental care should be more than just procedures. It's about building relationships based on trust, comfort, and exceptional results.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-12">

            {/* Card 1 */}
            <motion.div
              initial={{ x: 150, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0 }}
            >
              <GlowCard customSize className="group h-full bg-white rounded-[28px] border border-[#E7ECF2] p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col gap-5 items-start hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-[#1E73BE]/10 text-[#1E73BE] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Compassionate Care</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-light">
                  Our team is dedicated to making every clinical step easy, quiet, and pain-free for children and adults alike.
                </p>
              </GlowCard>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ x: 150, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            >
              <GlowCard customSize className="group h-full bg-white rounded-[28px] border border-[#E7ECF2] p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col gap-5 items-start hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-[#1E73BE]/10 text-[#1E73BE] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Advanced Tech</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-light">
                  From low-radiation digital x-rays to intraoral imaging, we select advanced technology to guarantee accuracy and minimize discomfort.
                </p>
              </GlowCard>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ x: 150, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
            >
              <GlowCard customSize className="group h-full bg-white rounded-[28px] border border-[#E7ECF2] p-8 shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col gap-5 items-start hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-[#1E73BE]/10 text-[#1E73BE] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Tailored Plans</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-light">
                  No two smiles are the same. We develop custom treatment plans that align with your oral health goals and budget.
                </p>
              </GlowCard>
            </motion.div>
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

          {/* Scrolling Services Animation */}
          <div className="w-full h-[500px] md:h-[600px] mt-8 relative border border-[#E7ECF2] rounded-[28px] shadow-[0_12px_40px_rgba(15,23,42,0.06)] bg-white">
            <IntroAnimation />
          </div>
        </section>
      </Scroll3D>

      {/* 4. DOCTOR PROFILE SECTION */}
      <Scroll3D>
        <section className="bg-white py-24 border-y border-[#E7ECF2]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Image (Left on desktop) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <Link
                href="/dr-roghay-alizadeh"
                className="relative w-full max-w-[400px] aspect-[4/5] rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.12)] border border-[#E7ECF2] bg-[#FAFBFC] group transition-transform duration-500 hover:-translate-y-2 block"
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
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#1E73BE] bg-[#1E73BE]/10 px-4 py-1.5 rounded-full inline-block">
                  Clinical Leadership
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy leading-tight">
                  {CLINIC.doctor}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-navy/5 text-navy border border-[#E7ECF2] text-[11px] font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full">
                    <Award className="w-3.5 h-3.5 text-[#1E73BE]" /> {CLINIC.doctorTitle}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light max-w-2xl">
                Dr. Roghay Alizadeh is recognised across Cork for her advanced aesthetic work — from
                porcelain veneers and composite bonding to complex full-mouth rehabilitation. She is
                equally known for her empathetic chair-side manner with anxious and complex patients.
              </p>

              <div className="rounded-[24px] border border-[#E7ECF2] bg-[#FAFBFC] p-8 shadow-[0_12px_40px_rgba(15,23,42,0.03)]">
                <h4 className="font-serif text-sm font-bold text-navy mb-5 uppercase tracking-widest">
                  Credentials &amp; Memberships
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                    <ShieldCheck className="w-5 h-5 text-[#1E73BE] mt-0.5 shrink-0" />
                    <span>Dental Council of Ireland (#4203)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                    <ShieldCheck className="w-5 h-5 text-[#1E73BE] mt-0.5 shrink-0" />
                    <span>Member of Irish Dental Association</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                    <ShieldCheck className="w-5 h-5 text-[#1E73BE] mt-0.5 shrink-0" />
                    <span>Advanced Cosmetic Dentistry Cert</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                    <ShieldCheck className="w-5 h-5 text-[#1E73BE] mt-0.5 shrink-0" />
                    <span>Nervous Patient Sedation Specialist</span>
                  </li>
                </ul>
              </div>

              <blockquote className="relative border-l-2 border-[#1E73BE] pl-6 py-2">
                <Quote className="absolute -top-2 -left-3 w-6 h-6 text-[#1E73BE]/20 bg-white" />
                <p className="font-serif italic text-lg text-navy/80 leading-relaxed">
                  &ldquo;Every smile we design starts with listening. Clinical detail follows naturally
                  from understanding what the patient actually wants.&rdquo;
                </p>
              </blockquote>

              <div className="pt-4">
                <Link
                  href="/dr-roghay-alizadeh"
                  className="inline-flex items-center gap-2 bg-white border border-[#E7ECF2] hover:bg-gray-50 text-navy text-sm font-semibold uppercase tracking-wider px-8 py-4 rounded-full shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-300"
                >
                  Read Full Bio &amp; Story <ArrowRight className="w-4 h-4 text-[#1E73BE]" />
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
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#1E73BE] bg-[#1E73BE]/10 px-4 py-1.5 rounded-full inline-block">
                Smile Gallery
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy tracking-tight leading-tight">
                Real Smile Transformations
              </h2>
              <p className="text-gray-500 text-sm font-light">
                See the results of our precision cosmetic dentistry. Drag the slider to compare before &amp; after.
              </p>
            </div>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 border border-[#E7ECF2] bg-white hover:bg-gray-50 text-navy text-xs font-semibold tracking-widest uppercase px-6 py-3 rounded-full shadow-[0_12px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-300 shrink-0 self-start md:self-auto"
            >
              Visit Smile Gallery
              <ArrowRight className="w-4 h-4 text-[#1E73BE]" />
            </Link>
          </div>

          {/* Grid of Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4 max-w-[360px] md:max-w-[480px] mx-auto w-full">
              <div className="rounded-[28px] overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.06)] border border-[#E7ECF2]">
                <BeforeAfterSlider
                  treatmentName="General Dentistry"
                  initials="M.H."
                  beforeImage="/before & after/General Dentistry_Before.jpg"
                  afterImage="/before & after/General Dentistry_After.jpg"
                />
              </div>
              <p className="text-xs text-gray-500 font-light text-center px-4">
                * Complete dental checkup and restoration.
              </p>
            </div>

            <div className="space-y-4 max-w-[360px] md:max-w-[480px] mx-auto w-full">
              <div className="rounded-[28px] overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.06)] border border-[#E7ECF2]">
                <BeforeAfterSlider
                  treatmentName="Composite Bonding"
                  initials="P.K."
                  beforeImage="/before & after/Composite Bonding_before.jpg"
                  afterImage="/before & after/Composite Bonding_after.jpg"
                />
              </div>
              <p className="text-xs text-gray-500 font-light text-center px-4">
                * Quick, non-invasive composite restoration for chipped or spaced teeth.
              </p>
            </div>
          </div>
        </section>
      </Scroll3D>

      {/* 6. MODERN TECH SHOWCASE (Wrapped in Scroll3D) */}
      <Scroll3D>
        <section className="bg-navy text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-navy z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">

            {/* Tech List */}
            <div className="lg:col-span-6 space-y-8">
              <h2 className="font-serif text-4xl font-bold text-white tracking-tight">
                Modern Tech for Comfortable Care
              </h2>
              <p className="text-white/80 text-sm font-light leading-relaxed">
                We invest in the future of dental care so every visit is faster, more precise, and entirely pain-free.
              </p>

              <div className="space-y-8 pt-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0 }}
                  className="flex items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1E73BE]/20 border border-[#1E73BE]/30 flex items-center justify-center text-[#1E73BE] shrink-0">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white leading-none">Digital Low-Radiation X-Rays</h4>
                    <p className="text-sm text-white/70 mt-2 leading-relaxed font-light">Safe and detailed view that exposes a tiny fraction of standard x-ray radiation.</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className="flex items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1E73BE]/20 border border-[#1E73BE]/30 flex items-center justify-center text-[#1E73BE] shrink-0">
                    <Smile className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white leading-none">Advanced Laser Therapy</h4>
                    <p className="text-sm text-white/70 mt-2 leading-relaxed font-light">Painless gum treatment and cavity preparation without the drill.</p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
                  className="flex items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1E73BE]/20 border border-[#1E73BE]/30 flex items-center justify-center text-[#1E73BE] shrink-0">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white leading-none">Intraoral 3D Scanning</h4>
                    <p className="text-sm text-white/70 mt-2 leading-relaxed font-light">Say goodbye to messy impressions. High-speed 3D digital smile mapping.</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Tech Photo */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[400px] aspect-[4/3] rounded-[28px]">

                <div className="w-full h-full rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.4)] border border-white/10 relative z-10 bg-gray-900 group">
                  <img
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=500"
                    alt="Modern dental scanner and therapy device"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 group-hover:opacity-100"
                  />
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-[#1E73BE] text-white font-bold py-3 px-6 rounded-full shadow-lg border border-[#1E73BE]/30 z-20 text-[10px] uppercase tracking-wider">
                  100% Pain Free
                </div>

              </div>
            </div>

          </div>
        </section>
      </Scroll3D>

      {/* 7. PREMIUM PRODUCTS & TREATMENTS (Wrapped in Scroll3D) */}
      <Scroll3D>
        <section className="bg-[#FAFBFC] py-24 border-y border-[#E7ECF2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#1E73BE] bg-[#1E73BE]/10 px-4 py-1.5 rounded-full inline-block">
                Clinic Shop &amp; Treatments
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy tracking-tight leading-tight">
                Featured Products &amp; Premium Services
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed font-light">
                Elevate your home care routine and explore our top-tier cosmetic dental treatments recommended by our clinical team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {/* Product Card 1: Dental Bonding */}
              <div className="group bg-white rounded-[28px] border border-[#E7ECF2] overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.03)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col h-full hover:-translate-y-2">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 border-b border-[#E7ECF2]">
                  <img
                    src="/products/image.png"
                    alt="Dental Bonding Treatment"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-[#E7ECF2] text-navy font-bold text-xs px-4 py-2 rounded-full shadow-sm">
                    €120.00 – €180.00
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">Cosmetic Procedure</span>
                    <h3 className="font-serif text-xl font-bold text-navy group-hover:text-[#1E73BE] transition-colors">
                      Dental Bonding
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-light">
                      With dental bonding we can repair chips, stains and fluorosis as well as change the shape and size of the tooth to improve your smile. We do this by adding composite carefully to the teeth.
                    </p>
                  </div>
                  <div className="pt-4 mt-auto">
                    <button
                      onClick={goToBooking}
                      className="w-full bg-navy hover:bg-[#173B6D] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" /> Book Treatment
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Card 2: Black Is White Teeth Whitening Toothpaste */}
              <div className="group bg-white rounded-[28px] border border-[#E7ECF2] overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.03)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col h-full hover:-translate-y-2">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 border-b border-[#E7ECF2]">
                  <img
                    src="/products/image copy.png"
                    alt="Black Is White Teeth Whitening Toothpaste"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-[#E7ECF2] text-navy font-bold text-xs px-4 py-2 rounded-full shadow-sm">
                    €30.00
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">Daily Care</span>
                    <h3 className="font-serif text-xl font-bold text-navy group-hover:text-[#1E73BE] transition-colors">
                      Black Is White Whitening Toothpaste
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-light">
                      Fresh lime mint toothpaste from Curaprox with activated carbon to gently lift surface stains and brighten the natural whiteness of teeth. Daily use, fluoride formula, suitable for sensitive teeth.
                    </p>
                  </div>
                  <div className="pt-4 mt-auto">
                    <a
                      href="tel:0214303072"
                      className="w-full border border-[#E7ECF2] hover:bg-gray-50 text-navy text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-sm hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-[#1E73BE]" /> Purchase at Clinic
                    </a>
                  </div>
                </div>
              </div>

              {/* Product Card 3: Pola Light Teeth Whitening Kits */}
              <div className="group bg-white rounded-[28px] border border-[#E7ECF2] overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.03)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col h-full hover:-translate-y-2">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 border-b border-[#E7ECF2]">
                  <img
                    src="/products/image copy 2.png"
                    alt="Pola Light Teeth Whitening Kits"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-[#E7ECF2] text-navy font-bold text-xs px-4 py-2 rounded-full shadow-sm">
                    €250.00
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">Whitening Kit</span>
                    <h3 className="font-serif text-xl font-bold text-navy group-hover:text-[#1E73BE] transition-colors">
                      Pola Light Whitening Kits
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-light">
                      Advanced teeth whitening system. Enjoy a brighter more confident smile in 5 days. Pola Light is an advanced tooth whitening system that combines Pola's award winning whitening formula, with an LED mouthpiece.
                    </p>
                  </div>
                  <div className="pt-4 mt-auto">
                    <button
                      onClick={goToBooking}
                      className="w-full bg-[#1E73BE] hover:bg-[#175A96] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Buy Now
                    </button>
                  </div>
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
        <section className="max-w-4xl mx-auto px-4 space-y-12 py-24">
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#1E73BE] bg-[#1E73BE]/10 px-4 py-1.5 rounded-full inline-block">
              Knowledge Base
            </span>
            <h2 className="font-serif text-4xl font-bold text-navy">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm font-light">Got questions about our clinical care? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;

              return (
                <div
                  key={index}
                  className={`border rounded-[24px] overflow-hidden bg-white transition-all duration-300 transform ${isOpen
                    ? "border-[#E7ECF2] shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
                    : "border-[#E7ECF2] shadow-sm hover:shadow-md hover:-translate-y-1"
                    }`}
                >
                  <div
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-[#FAFBFC] transition-colors select-none"
                  >
                    <span className={`text-sm md:text-base font-semibold leading-snug transition-colors ${isOpen ? "text-[#1E73BE]" : "text-navy"}`}>{faq.q}</span>
                    <span className={`font-bold text-2xl transition-transform duration-300 ${isOpen ? "text-[#1E73BE] rotate-180" : "text-gray-300"}`}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="p-6 bg-[#FAFBFC] border-t border-[#E7ECF2] text-sm text-gray-600 leading-relaxed font-light animate-fade-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </Scroll3D>

      {/* 10. READY FOR HEALTHIER, BRIGHTER SMILE? (Final CTA Block) */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-navy rounded-[40px] py-20 px-6 md:p-24 text-center text-white space-y-10 relative overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            
            <div className="absolute inset-0 bg-navy z-0" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay z-0 pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 bg-[#1E73BE]/20 text-white border border-[#1E73BE]/30 text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full select-none">
                <Activity className="w-4 h-4 text-[#1E73BE]" />
                <span>Begin Your Journey Today</span>
              </span>

              <h2 className="font-serif text-4xl md:text-6xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                Ready for a Healthier, <span className="text-[#1E73BE] italic font-medium">Brighter Smile</span>?
              </h2>

              <p className="text-white/80 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto font-light">
                Join thousands of happy Cork patients and experience the future of premium dental care today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 relative z-10 w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
              <button
                onClick={goToBooking}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-navy font-semibold py-4 px-10 rounded-full text-sm shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-5 h-5 text-[#1E73BE] shrink-0" /> Book Appointment Now
              </button>

              <a
                href={CLINIC.phoneHref}
                className="w-full sm:w-auto border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-10 rounded-full text-sm transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap hover:-translate-y-1"
              >
                <Phone className="w-5 h-5 text-white/70 shrink-0" /> Call Clinic: {CLINIC.phone}
              </a>
            </div>
          </div>
        </section>
      </Scroll3D>

    </div>
  );
}
