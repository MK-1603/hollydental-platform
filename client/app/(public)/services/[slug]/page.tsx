import { SERVICES, CLINIC, ServiceType } from "@/lib/constants";
import BeforeAfterSlider from "@/components/public/BeforeAfterSlider";
import Link from "next/link";
import BookButton from "@/components/public/BookButton";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, HelpCircle, Phone, MessageSquare, Activity, ShieldCheck, Smile } from "lucide-react";

export async function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return { title: "Treatment | Hollyhill Dental" };
  return {
    title: `${service.name} | Hollyhill Dental Cork`,
    description: service.description,
  };
}

const PROCESS_STEPS = [
  {
    name: "Consultation",
    desc: "Detailed exam and digital photography. Goals, history, and constraints captured.",
  },
  {
    name: "Planning",
    desc: "Costed treatment plan with materials, timing, and visit count laid out clearly.",
  },
  {
    name: "Procedure",
    desc: "Clinical execution by Dr. Roghay using modern, gentle techniques.",
  },
  {
    name: "Aftercare",
    desc: "Comfort monitoring and home-care guidance tailored to your case.",
  },
  {
    name: "Follow-up",
    desc: "Maintenance check-in to confirm clinical success and longevity.",
  },
];

const BENEFITS = [
  "Long-term enamel protection",
  "Restored bite alignment & chewing comfort",
  "Improved aesthetic balance and brightness",
  "Relief from chronic sensitivity",
  "Reduced risk of future fractures or decay",
];

const FAQS = [
  {
    q: "Is this treatment painful?",
    a: "We prioritise comfort with local anaesthetic and gentle modern techniques. Most procedures are virtually pain-free.",
  },
  {
    q: "How long do the results last?",
    a: "It depends on the procedure. Cleanings: 6 months. Whitening: 1–2 years. Bonding: 5–8 years. Porcelain veneers: 15+ years with care.",
  },
  {
    q: "Is this covered by PRSI or insurance?",
    a: "Basic exams, cleanings, and extractions are subsidised under PRSI. Cosmetic work is private; 0% instalment plans are available.",
  },
  {
    q: "How many visits will I need?",
    a: "Cleanings and exams take a single visit. Veneers, crowns, and Invisalign typically span 2–4 appointments.",
  },
];

function clinicalImageFor(slug: string) {
  switch (slug) {
    case "emergency-dentistry":
      return {
        before: "/before & after/Emergency Dentistry_before.jpg",
        after: "/before & after/Emergency Dentistry_after.jpg",
        initials: "E.D.",
      };
    case "tooth-extractions":
      return {
        before: "/before & after/Tooth Extraction_before.jpg",
        after: "/before & after/Tooth Extraction_after.jpg",
        initials: "T.E.",
      };
    case "surgical-extractions":
      return {
        before: "/before & after/Surgical Extractions_before.png",
        after: "/before & after/Surgical Extractions.png",
        initials: "S.E.",
      };
    case "composite-fillings":
    case "silver-fillings":
    case "temporary-fillings":
      return {
        before: "/before & after/White Filling_before.jpg",
        after: "/before & after/White Filling_after.jpg",
        initials: "W.F.",
      };
    case "teeth-cleaning":
      return {
        before: "/before & after/Hygiene & Teeth Cleaning_before.png",
        after: "/before & after/Hygiene & Teeth Cleaning_after.png",
        initials: "H.C.",
      };
    case "teeth-whitening":
      return {
        before: "/before & after/Teeth Whitening_before.jpg",
        after: "/before & after/Teeth Whitening_after.jpg",
        initials: "T.W.",
      };
    case "composite-bonding":
    case "composite-veneers":
      return {
        before: "/before & after/Composite Bonding_before.jpg",
        after: "/before & after/Composite Bonding_after.jpg",
        initials: "P.K.",
      };
    case "veneers":
      return {
        before: "/before & after/Veneers_before.jpg",
        after: "/before & after/Veneers_after.jpg",
        initials: "A.C.",
      };
    case "invisalign":
    case "invisalign-go-single":
      return {
        before: "/before & after/Invansion Go_before.png",
        after: "/before & after/Invansion Go_after.png",
        initials: "I.G.",
      };
    case "invisalign-go-double":
      return {
        before: "/before & after/Invisalign Go - Double_before.png",
        after: "/before & after/Invisalign Go - Double_after.png",
        initials: "I.D.",
      };
    case "invisalign-full":
      return {
        before: "/before & after/Invisalign Full_before.png",
        after: "/before & after/Invisalign Full_after.png",
        initials: "I.F.",
      };
    case "full-smile-makeovers":
    case "smile-design":
    case "digital-smile-consultation":
      return {
        before: "/before & after/Smile Design_before.png",
        after: "/before & after/Smile Design_after.png",
        initials: "S.D.",
      };
    case "dental-crowns":
      return {
        before: "/before & after/Dental Crowns_before.png",
        after: "/before & after/Dental Crowns_after.png",
        initials: "D.C.",
      };
    case "dental-bridges":
      return {
        before: "/before & after/Bridges_before.png",
        after: "/before & after/Bridges_after.png",
        initials: "D.B.",
      };
    case "gum-treatment":
    case "periodontal-care":
      return {
        before: "/before & after/Gum Treatment_before.png",
        after: "/before & after/Gum Treatment_after.png",
        initials: "G.T.",
      };
    case "dentures":
      return {
        before: "/before & after/Dentures_before.png",
        after: "/before & after/Dentures_after.png",
        initials: "D.T.",
      };
    case "general-dentistry":
    case "dental-checkups":
    case "root-canal":
    case "root-canal-canine":
    case "root-canal-premolar":
    case "root-canal-molar":
    default:
      return {
        before: "/before & after/General Dentistry_Before.jpg",
        after: "/before & after/General Dentistry_After.jpg",
        initials: "M.H.",
      };
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const photo = clinicalImageFor(slug);
  const related = SERVICES.filter(
    (s) => s.category === service.category && s.slug !== service.slug
  ).slice(0, 3);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,110,0.12),_transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All treatments
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
              {service.category === "cosmetic" ? (
                <Smile className="w-3.5 h-3.5" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              {service.category} Dentistry
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05]">
              {service.name}
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {service.description}
            </p>

            <ul className="flex flex-wrap items-center gap-3 pt-1 justify-center lg:justify-start">
              <Pill icon={<Clock className="w-3.5 h-3.5" />} label={`${service.duration} mins`} />
              <Pill
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label={
                  service.priceFrom === 0
                    ? "Free consult"
                    : `From €${service.priceFrom}`
                }
              />
              <Pill icon={<Smile className="w-3.5 h-3.5" />} label="Dr. Roghay Alizadeh" />
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 justify-center lg:justify-start">
              <BookButton
                serviceSlug={service.slug}
                label="Book Consultation"
                showIcon
                className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors flex items-center"
              />
              <a
                href={CLINIC.phoneHref}
                className="border border-white/25 hover:border-gold hover:text-gold text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Call {CLINIC.phone}
              </a>
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-emerald-500/25 hover:border-emerald-500 hover:text-emerald-400 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[440px] aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-navy/40">
              <img
                src={photo.after}
                alt={`${service.name} clinical example`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-navy via-navy/80 to-transparent">
                <span className="block text-[10px] uppercase tracking-widest text-gold font-semibold">
                  Clinical case
                </span>
                <span className="block font-serif text-base font-semibold mt-0.5">
                  Patient {photo.initials}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW + BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              About this treatment
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight">
              Understanding {service.name.toLowerCase()}.
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              At Hollyhill Dental Cork, we believe understanding your procedure is
              essential to a comfortable clinical experience. {service.name} is
              designed to optimise your oral health and deliver precise, predictable
              results. Dr. Roghay Alizadeh tailors every step to your jaw anatomy and
              comfort boundaries.
            </p>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-5 md:p-6">
              <h3 className="font-serif text-sm font-semibold text-navy mb-3">
                Key benefits
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {BENEFITS.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="space-y-4 max-w-[420px] md:max-w-[500px] mx-auto w-full">
              <span className="block text-[10px] uppercase tracking-widest font-semibold text-gold text-center">
                Procedural transformation
              </span>
              <BeforeAfterSlider
                beforeImage={photo.before}
                afterImage={photo.after}
                treatmentName={service.name}
                initials={photo.initials}
              />
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-off-white py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              Your Treatment Journey
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              From consultation to follow-up.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              A clear, five-step path. No surprises, no rush, no pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {PROCESS_STEPS.map((step, idx) => (
              <article
                key={step.name}
                className="relative bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-2"
              >
                <span className="absolute top-3 right-3 font-serif text-2xl font-bold text-gold/20">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-gold">
                  Step {idx + 1}
                </span>
                <h3 className="font-serif text-sm font-semibold text-navy">
                  {step.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 py-20 md:py-24 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
            Indicative Pricing
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
            What you can expect to pay.
          </h2>
        </div>

        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-navy text-white text-xs uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4 text-right">Fee Range</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-5 py-4 font-semibold text-navy">{service.name}</td>
                <td className="px-5 py-4 text-right text-navy font-bold whitespace-nowrap">
                  {service.priceFrom === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : service.priceFrom === service.priceTo ? (
                    <>&euro;{service.priceFrom}</>
                  ) : (
                    <>&euro;{service.priceFrom} – &euro;{service.priceTo}</>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
            * Final fees vary with case complexity, materials, and lab work. A fully
            costed plan is provided after consultation.
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <Link
            href="/pricing"
            className="text-xs font-semibold text-gold hover:text-gold-dark inline-flex items-center gap-1.5"
          >
            See full price catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-off-white py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              Common Questions
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              Things patients ask us.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f) => (
              <article
                key={f.q}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 md:p-6"
              >
                <h3 className="flex items-center gap-2 font-serif text-sm md:text-base font-semibold text-navy mb-2">
                  <HelpCircle className="w-4 h-4 text-gold shrink-0" />
                  {f.q}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed pl-6">{f.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              You may also like
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              Related treatments
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {related.map((r) => (
              <RelatedCard key={r.slug} service={r} />
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
        <div className="rounded-3xl bg-navy text-white px-6 py-12 md:px-12 md:py-16 text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(201,169,110,0.18),_transparent_55%)]" />
          <div className="relative space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold/90 bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
              <Activity className="w-3 h-3" /> Ready when you are
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              Have questions about {service.name.toLowerCase()}?
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Book a consultation or speak with one of our patient coordinators today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <BookButton
                serviceSlug={service.slug}
                label="Book Consultation"
                showIcon
                className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-7 py-3 rounded-lg shadow-md transition-colors flex items-center"
              />
              <a
                href={CLINIC.phoneHref}
                className="border border-white/25 hover:border-gold hover:text-gold text-white font-semibold text-sm px-7 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Call {CLINIC.phone}
              </a>
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-emerald-500/25 hover:border-emerald-500 hover:text-emerald-400 text-white font-semibold text-sm px-7 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white">
      <span className="text-gold">{icon}</span>
      {label}
    </li>
  );
}

function RelatedCard({ service }: { service: ServiceType }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-gold hover:shadow-card transition-all p-6 flex flex-col gap-3"
    >
      <span className="text-[10px] uppercase tracking-widest font-semibold text-gold">
        {service.category}
      </span>
      <h3 className="font-serif text-lg font-semibold text-navy leading-tight">
        {service.name}
      </h3>
      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
        {service.description}
      </p>
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="font-serif text-base font-bold text-navy">
          {service.priceFrom === 0 ? (
            <span className="text-emerald-600">Free</span>
          ) : (
            <>From &euro;{service.priceFrom}</>
          )}
        </span>
        <span className="text-xs font-bold text-gold inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
          Learn more <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
