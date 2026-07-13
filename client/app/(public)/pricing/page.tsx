"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SERVICES, ServiceType } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { ArrowRight, BadgeHelp, Landmark, Search, ShieldCheck, Activity, CheckCircle2, Clock, Lock, ChevronDown, Star } from "lucide-react";

const CATEGORY_ORDER = ["All", "general", "cosmetic", "orthodontics", "advanced"] as const;
type CategoryKey = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  All: "All",
  general: "General",
  cosmetic: "Cosmetic",
  orthodontics: "Orthodontics",
  advanced: "Advanced",
};

const FEATURED_SLUGS = [
  "teeth-cleaning",
  "teeth-whitening",
  "invisalign",
] as const;

const FAQS = [
  {
    q: "Are these prices fixed?",
    a: "These are guide ranges. After a 30-minute consultation, you receive a fully costed treatment plan in writing — no surprises at checkout.",
  },
  {
    q: "Do you accept dental insurance?",
    a: "We work with VHI, Laya Healthcare, and Irish Life Health. Bring your details and we'll handle the claim paperwork on your behalf.",
  },
  {
    q: "Can I pay in instalments?",
    a: "Yes — Invisalign and full smile makeovers can be spread over 6–18 months at 0% interest. The exact schedule is agreed once your plan is finalised.",
  },
  {
    q: "What about the PRSI dental benefit?",
    a: "If you're eligible under PRSI, you can claim a free annual exam plus a subsidised cleaning. We'll confirm your eligibility at booking.",
  },
] as const;

export default function PricingPage() {
  const router = useRouter();
  const { user, isInitialized, initialize } = useAuthStore();
  const { openLoginModal } = useUIStore();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  const visibleServices = useMemo(() => {
    const term = search.toLowerCase().trim();
    return SERVICES.filter((s) => {
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term);
      const matchesCategory =
        activeCategory === "All" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const featured = useMemo(
    () =>
      FEATURED_SLUGS.map((slug) => SERVICES.find((s) => s.slug === slug)).filter(
        Boolean
      ) as ServiceType[],
    []
  );

  const handleBookNow = (slug?: string) => {
    const target = slug
      ? `/portal/booking?service=${encodeURIComponent(slug)}`
      : "/portal/booking";
    if (user) {
      router.push(target);
      return;
    }
    openLoginModal(() => router.push(target));
  };

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,110,0.12),_transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Transparent Fees
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]">
            Premium dental care,{" "}
            <span className="text-gold italic font-medium">fairly priced</span>.
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Clear treatment ranges, no hidden fees, and a written cost plan after every
            consultation. Sign in to your patient portal to confirm a slot — no card
            required to book.
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-3 justify-center pt-2 max-w-sm mx-auto sm:max-w-none">
            <button
              onClick={() => handleBookNow()}
              className="bg-gold hover:bg-gold-dark text-navy font-bold px-3 sm:px-6 py-3 rounded-lg text-sm shadow-md transition-colors flex items-center justify-center gap-2 w-full"
            >
              Book Appointment <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="#fees"
              className="border border-white/25 hover:border-gold hover:text-gold text-white font-semibold text-sm px-3 sm:px-6 py-3 rounded-lg transition-colors flex items-center justify-center text-center w-full"
            >
              Skip to full price list
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="-mt-10 relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          <TrustItem
            icon={<ShieldCheck className="w-4 h-4 text-gold" />}
            label="Written cost plans"
          />
          <TrustItem
            icon={<Landmark className="w-4 h-4 text-gold" />}
            label="0% Instalment plans"
          />
          <TrustItem
            icon={<BadgeHelp className="w-4 h-4 text-gold" />}
            label="Insurance coordinated"
          />
          <TrustItem
            icon={<Lock className="w-4 h-4 text-gold" />}
            label="No card to book"
          />
        </div>
      </section>

      {/* FEATURED PRICING */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
            Most-Booked Treatments
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
            Popular treatments at a glance
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Three of our most requested visits with indicative pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {featured.map((s, i) => (
            <FeaturedCard
              key={s.slug}
              service={s}
              highlight={i === 1}
              onBook={() => handleBookNow(s.slug)}
            />
          ))}
        </div>
      </section>

      {/* FILTER + FEE TABLE */}
      <section id="fees" className="max-w-6xl mx-auto px-4 md:px-8 space-y-6 pb-20 md:pb-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
            Full Fee Catalog
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
            Search every treatment we offer
          </h2>
        </div>

        {/* Filter strip */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search treatments…"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  activeCategory === c
                    ? "bg-navy text-white border-navy"
                    : "border-gray-200 text-navy hover:border-gold hover:text-gold"
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog table */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-navy text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4 hidden md:table-cell">Category</th>
                  <th className="px-5 py-4 hidden md:table-cell">Duration</th>
                  <th className="px-5 py-4 text-right">Fee Range</th>
                  <th className="px-5 py-4 text-right" />
                </tr>
              </thead>
              <tbody>
                {visibleServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-xs text-gray-400 py-12"
                    >
                      No services match your filters.
                    </td>
                  </tr>
                ) : (
                  visibleServices.map((s, idx) => (
                    <tr
                      key={s.slug}
                      className={`border-b border-gray-50 hover:bg-gold/5 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-off-white"
                      }`}
                    >
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={`/services/${s.slug}`}
                          className="block font-semibold text-navy hover:text-gold transition-colors"
                        >
                          {s.name}
                        </Link>
                        <span className="text-gray-500 text-xs line-clamp-1 mt-0.5">
                          {s.description}
                        </span>
                        <div className="md:hidden flex items-center gap-2 mt-2 text-[10px] uppercase tracking-widest text-gold">
                          <span>{s.category}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-500 normal-case tracking-normal">
                            {s.duration} mins
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[10px] uppercase font-bold text-gold tracking-widest hidden md:table-cell align-top">
                        {s.category}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs hidden md:table-cell align-top">
                        {s.duration} mins
                      </td>
                      <td className="px-5 py-4 text-right text-navy font-bold whitespace-nowrap align-top">
                        {s.priceFrom === 0 ? (
                          <span className="text-emerald-600">Free</span>
                        ) : s.priceFrom === s.priceTo ? (
                          <>&euro;{s.priceFrom}</>
                        ) : (
                          <>&euro;{s.priceFrom} – &euro;{s.priceTo}</>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                        <button
                          onClick={() => handleBookNow(s.slug)}
                          className="text-xs font-bold text-gold hover:text-gold-dark inline-flex items-center gap-1"
                        >
                          Book <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
            * Final fees vary with case complexity, materials, and lab work. The
            ranges above are for guidance only. A written treatment plan is provided
            after consultation.
          </div>
        </div>
      </section>

      {/* TAX & PLANS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 pb-20 md:pb-24">
        <PerkCard
          icon={<BadgeHelp className="w-5 h-5 text-gold" />}
          title="Tax relief & insurance"
          body="Claim 20% Med 2 tax relief on advanced treatments (crowns, bridges, root canal, veneers). We coordinate directly with VHI, Laya Healthcare, and Irish Life Health."
        />
        <PerkCard
          icon={<Landmark className="w-5 h-5 text-gold" />}
          title="0% instalment plans"
          body="Spread Invisalign or full smile redesigns across 6–18 months at 0% interest. The exact schedule is agreed once your plan is finalised."
        />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
            Pricing FAQ
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
            Common questions, straight answers.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, idx) => {
            const isOpen = openFaq === idx;
            return (
              <article
                key={f.q}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-colors ${
                  isOpen ? "border-gold" : "border-gray-100 hover:border-gold/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-sm md:text-base font-semibold text-navy">
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gold transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                    {f.a}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
        <div className="rounded-3xl bg-navy text-white px-6 py-12 md:px-12 md:py-16 text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(201,169,110,0.18),_transparent_55%)]" />
          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold/90 bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
              <Activity className="w-3 h-3" /> Ready when you are
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Reserve your slot in under a minute.
            </h2>
            <p className="text-gray-300 text-sm max-w-xl mx-auto leading-relaxed">
              Sign in to your patient portal to submit a booking request. The clinic
              team will approve and confirm by email — no payment needed today.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
              <button
                onClick={() => handleBookNow()}
                className="bg-gold hover:bg-gold-dark text-navy font-bold px-7 py-3 rounded-lg text-sm shadow-md flex items-center gap-2 transition-colors"
              >
                {user ? "Continue to booking" : "Sign in to book"}
                <ArrowRight className="w-4 h-4" />
              </button>
              {!user && (
                <Link
                  href="/portal/register"
                  className="text-white/80 hover:text-gold text-sm font-medium underline-offset-4 hover:underline"
                >
                  New patient? Create an account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function TrustItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-5 md:py-6 justify-center">
      {icon}
      <span className="text-xs md:text-sm font-semibold text-navy text-center">
        {label}
      </span>
    </div>
  );
}

function FeaturedCard({
  service,
  highlight,
  onBook,
}: {
  service: ServiceType;
  highlight?: boolean;
  onBook: () => void;
}) {
  return (
    <article
      className={`relative rounded-2xl border p-6 md:p-7 flex flex-col gap-5 transition-all ${
        highlight
          ? "bg-navy text-white border-navy shadow-2xl md:scale-[1.02]"
          : "bg-white border-gray-100 shadow-card"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow flex items-center gap-1">
          <Star className="w-3 h-3 fill-navy" /> Most Popular
        </span>
      )}

      <header className="space-y-2">
        <span
          className={`text-[10px] uppercase font-semibold tracking-widest ${
            highlight ? "text-gold" : "text-gold"
          }`}
        >
          {service.category}
        </span>
        <h3
          className={`font-serif text-xl font-semibold ${
            highlight ? "text-white" : "text-navy"
          }`}
        >
          {service.name}
        </h3>
        <p
          className={`text-sm leading-relaxed ${
            highlight ? "text-gray-300" : "text-gray-500"
          }`}
        >
          {service.description}
        </p>
      </header>

      <ul className="space-y-2 text-sm">
        <FeatureLine
          highlight={highlight}
          label={`Approx. ${service.duration} mins`}
          icon={<Clock className="w-4 h-4 text-gold" />}
        />
        <FeatureLine
          highlight={highlight}
          label="Written cost plan after consult"
          icon={<CheckCircle2 className="w-4 h-4 text-gold" />}
        />
        <FeatureLine
          highlight={highlight}
          label="No card required to book"
          icon={<Lock className="w-4 h-4 text-gold" />}
        />
      </ul>

      <div
        className={`mt-auto pt-5 border-t flex items-center justify-between ${
          highlight ? "border-white/10" : "border-gray-100"
        }`}
      >
        <div>
          <span
            className={`block text-[10px] uppercase tracking-widest font-semibold ${
              highlight ? "text-gold" : "text-gray-400"
            }`}
          >
            From
          </span>
          <span className="font-serif text-2xl font-bold">
            &euro;{service.priceFrom}
          </span>
        </div>
        <button
          onClick={onBook}
          className={`text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-colors flex items-center gap-1.5 ${
            highlight
              ? "bg-gold hover:bg-gold-dark text-navy"
              : "bg-navy hover:bg-gray-800 text-white"
          }`}
        >
          Book <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}

function FeatureLine({
  icon,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2 ${
        highlight ? "text-gray-300" : "text-gray-600"
      }`}
    >
      {icon}
      <span>{label}</span>
    </li>
  );
}

function PerkCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-serif text-base font-semibold text-navy">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
    </article>
  );
}
