"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CLINIC } from "@/lib/constants";
import {
  Award,
  ShieldCheck,
  HeartHandshake,
  Smile,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Quote,
  Stethoscope,
  Users,
  Star,
} from "lucide-react";
import BookButton from "@/components/public/BookButton";

const stats = [
  { value: "20+", label: "Years in Practice" },
  { value: "5,000+", label: "Patients Cared For" },
  { value: "5.0★", label: "Google Reviewed" },
  { value: "2003", label: "Established" },
] as const;

const values = [
  {
    title: "Patient Comfort First",
    desc: "Soothing rooms, gentle numbing technique, and dedicated time for nervous patients.",
    icon: HeartHandshake,
  },
  {
    title: "Clinical Excellence",
    desc: "Two decades of advanced cosmetic and restorative training under Dr. Roghay Alizadeh.",
    icon: Award,
  },
  {
    title: "Total Transparency",
    desc: "Costed treatment plans, fixed price ranges, no surprises at checkout.",
    icon: ShieldCheck,
  },
  {
    title: "Continuous Innovation",
    desc: "Digital smile design, rotary endodontics, and modern imaging built into every visit.",
    icon: Smile,
  },
] as const;

const timeline = [
  {
    year: "2003",
    title: "Hollyhill Dental opens",
    desc: "Founded as a family-friendly general practice inside the Hollyhill Shopping Centre, Cork.",
  },
  {
    year: "2010",
    title: "Cosmetic specialty launched",
    desc: "Introduced advanced veneers, composite bonding, and full smile makeovers under Dr. Roghay's lead.",
  },
  {
    year: "2018",
    title: "Digital workflow installed",
    desc: "Adopted full digital smile design and high-resolution intraoral scanning.",
  },
  {
    year: "2026",
    title: "Patient portal goes live",
    desc: "Online booking, appointment approvals, secure messaging and digital records launched.",
  },
] as const;

const credentials = [
  "Dental Council of Ireland — Registration #4203",
  "Member of the Irish Dental Association (IDA)",
  "Diploma in Clinical Restorative Dentistry",
  "Advanced Cosmetic Dentistry Certification",
  "Nervous Patient Sedation Specialist",
] as const;

const memberships = [
  {
    title: "Dental Council of Ireland",
    line: "Statutory clinical regulator",
    note: "Reg. #4203",
  },
  {
    title: "Irish Dental Association",
    line: "Professional standards body",
    note: "Member in Good Standing",
  },
  {
    title: "GDPR Compliant",
    line: "Patient data protection",
    note: "ISO-aligned controls",
  },
] as const;

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

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,110,0.12),_transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> About the Clinic
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]">
              Premium dental care with{" "}
              <span className="text-gold italic font-medium">Cork heart</span>.
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              Hollyhill Dental has been crafting confident smiles in Cork since 2003. Today, under
              Dr. Roghay Alizadeh, we blend evidence-based clinical excellence with a calm,
              hospitality-first patient experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
              <BookButton
                label="Book a Consultation"
                showIcon
                className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors flex items-center"
              />
              <Link
                href="/services"
                className="border border-white/25 hover:border-gold hover:text-gold text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors text-center"
              >
                Explore Treatments
              </Link>
            </div>
          </div>

          {/* Crest card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[540px] aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-navy">
              <img
                src="/dentist-mirror.png"
                alt="Hollyhill Dental treatment room"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-navy via-navy/80 to-transparent">
                <span className="block text-[10px] uppercase tracking-widest text-gold font-semibold">
                  Hollyhill Shopping Centre
                </span>
                <span className="block font-serif text-base font-semibold mt-0.5">
                  Cork City Clinic
                </span>
              </div>
              <div className="absolute top-4 right-4 bg-white/95 text-navy rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-xs font-bold">5.0 Google</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <Scroll3D>
        <section className="-mt-10 relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-6 md:py-8 text-center">
                <span className="block font-serif text-3xl md:text-4xl font-bold text-navy">
                  {s.value}
                </span>
                <span className="block text-[10px] md:text-[11px] uppercase tracking-widest font-semibold text-gray-500 mt-1.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </Scroll3D>

      {/* OUR STORY */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                Our Story
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight">
                Two decades of careful, considered dentistry.
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Hollyhill Dental was founded in 2003 with a simple mission: bring high-end cosmetic
                and restorative dentistry to Cork patients without losing the warmth of a local
                practice. Two decades later, that mission still guides every appointment.
              </p>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                We&apos;ve invested steadily in modern equipment, digital workflows and continuous
                clinical training. The result is a clinic where you can expect predictable outcomes,
                transparent pricing, and a team that takes the time to listen first.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <FeaturePill icon={<Stethoscope className="w-4 h-4 text-gold" />} label="20+ years clinical" />
                <FeaturePill icon={<Users className="w-4 h-4 text-gold" />} label="5,000+ smiles cared for" />
                <FeaturePill icon={<ShieldCheck className="w-4 h-4 text-gold" />} label="Council registered" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-card aspect-[4/5]">
                  <img
                    src="/clinic-storefront.png"
                    alt="Hollyhill Dental Clinic Storefront"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-5 -left-5 sm:-left-6 bg-white border border-gray-100 rounded-2xl shadow-card px-5 py-4 max-w-[220px]">
                  <span className="block text-[10px] uppercase tracking-widest font-semibold text-gold">
                    Established
                  </span>
                  <span className="block font-serif text-2xl font-bold text-navy">2003</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    Cork, Ireland
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Scroll3D>

      {/* DR ROGHAY PROFILE */}
      <Scroll3D>
        <section className="bg-off-white py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <Link href="/dr-roghay-alizadeh" className="relative block group cursor-pointer" title="View Full Biography">
                <div className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-card aspect-[4/5]">
                  <img
                    src="/doctor.png"
                    alt={`${CLINIC.doctor} — ${CLINIC.doctorTitle}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute -bottom-5 -right-5 sm:-right-6 bg-navy text-white rounded-2xl shadow-card px-5 py-4 max-w-[220px]">
                  <span className="block text-[10px] uppercase tracking-widest font-semibold text-gold">
                    Principal Dentist
                  </span>
                  <span className="block font-serif text-base font-semibold mt-0.5 group-hover:text-gold transition-colors">
                    {CLINIC.doctor}
                  </span>
                </div>
              </Link>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                Clinical Leadership
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight">
                {CLINIC.doctor}
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-gold/10 text-gold border border-gold/30 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                <Award className="w-3.5 h-3.5" /> {CLINIC.doctorTitle}
              </span>

              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Dr. Roghay Alizadeh is recognised across Cork for her advanced aesthetic work — from
                porcelain veneers and composite bonding to complex full-mouth rehabilitation. She is
                equally known for her empathetic chair-side manner with anxious and complex patients.
              </p>

              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h4 className="font-serif text-sm font-semibold text-navy mb-3">
                  Credentials &amp; Memberships
                </h4>
                <ul className="space-y-2.5">
                  {credentials.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <blockquote className="relative rounded-2xl border border-gold/30 bg-gold/5 p-5 text-navy">
                <Quote className="absolute -top-3 -left-3 w-7 h-7 text-gold bg-white rounded-full p-1.5 shadow" />
                <p className="font-serif italic text-base md:text-lg leading-snug">
                  &ldquo;Every smile we design starts with listening. Clinical detail follows naturally
                  from understanding what the patient actually wants.&rdquo;
                </p>
                <span className="block text-[11px] uppercase tracking-widest text-gold font-semibold mt-3">
                  — Dr. Roghay Alizadeh
                </span>
              </blockquote>

              <div className="pt-2">
                <Link
                  href="/dr-roghay-alizadeh"
                  className="inline-flex items-center gap-2 bg-navy hover:bg-[#061e3d] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl shadow transition-colors"
                >
                  Read Dedicated Doctor Profile &amp; Bio <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Scroll3D>

      {/* VALUES */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              What We Believe
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              Four principles that shape every visit.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              From your first call to long-term aftercare, these values guide how we treat patients
              and how we run the clinic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <article
                  key={v.title}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-gold hover:shadow-card transition-all flex flex-col gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-navy transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-base font-semibold text-navy">
                      {v.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </Scroll3D>

      {/* TIMELINE */}
      <Scroll3D>
        <section className="bg-off-white py-20 md:py-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                Our Journey
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
                Two decades, one steady focus.
              </h2>
            </div>

            <ol className="relative border-l border-gold/30 space-y-8 pl-6 md:pl-8">
              {timeline.map((t) => (
                <li key={t.year} className="relative">
                  <span className="absolute -left-[34px] md:-left-[42px] top-1 w-4 h-4 rounded-full bg-gold border-4 border-off-white shadow" />
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                        {t.year}
                      </span>
                      <h3 className="font-serif text-lg font-semibold text-navy">
                        {t.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mt-2">{t.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Scroll3D>

      {/* MEMBERSHIPS */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              Trust &amp; Accreditation
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              Registered, regulated, accountable.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {memberships.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-base font-semibold text-navy">{m.title}</h3>
                  <p className="text-sm text-gray-500">{m.line}</p>
                </div>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-gold mt-auto">
                  {m.note}
                </span>
              </div>
            ))}
          </div>
        </section>
      </Scroll3D>

      {/* VISIT US */}
      <Scroll3D>
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
          <div className="rounded-3xl bg-navy text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12">
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
                  Visit the Clinic
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                  Come and meet the team.
                </h2>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xl">
                  We&apos;re in the Hollyhill Shopping Centre, with on-site parking and easy access
                  from across Cork City.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <BookButton
                    label="Book Appointment"
                    showIcon
                    className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors flex items-center"
                  />
                  <a
                    href={CLINIC.phoneHref}
                    className="border border-white/25 hover:border-gold hover:text-gold text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call {CLINIC.phone}
                  </a>
                  <a
                    href={CLINIC.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-emerald-500/35 hover:border-emerald-500 hover:text-emerald-400 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                <ContactRow
                  icon={<MapPin className="w-4 h-4 text-gold" />}
                  label="Address"
                  value={CLINIC.address}
                />
                <ContactRow
                  icon={<Clock className="w-4 h-4 text-gold" />}
                  label="Hours"
                  value={`${CLINIC.hours.weekdays} · ${CLINIC.hours.saturday}`}
                />
                <ContactRow
                  icon={<Phone className="w-4 h-4 text-gold" />}
                  label="Phone"
                  value={CLINIC.phone}
                  href={CLINIC.phoneHref}
                />
                <ContactRow
                  icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}
                  label="WhatsApp"
                  value={CLINIC.whatsappDisplay}
                  href={CLINIC.whatsapp}
                />
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 transition-colors"
                >
                  <span className="text-sm font-semibold">Get directions &amp; map</span>
                  <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Scroll3D>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function FeaturePill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      {icon}
      <span className="text-xs font-semibold text-navy truncate">{label}</span>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-widest text-gold font-semibold">
          {label}
        </span>
        <span className="block text-sm font-medium text-white leading-snug break-words">
          {value}
        </span>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block hover:bg-white/10 rounded-xl transition-colors">
        {content}
      </a>
    );
  }
  return content;
}
