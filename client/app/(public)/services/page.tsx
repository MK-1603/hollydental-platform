"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SERVICES, ServiceType } from "@/lib/constants";
import BookButton from "@/components/public/BookButton";
import { ArrowRight, Activity, Shield, GraduationCap, Flame, Search, Clock, Smile } from "lucide-react";

const CATEGORIES = [
  {
    key: "general",
    label: "General Dentistry",
    icon: Shield,
    desc: "Essential checkups, cleanings, extractions, and fillings.",
  },
  {
    key: "cosmetic",
    label: "Cosmetic Procedures",
    icon: Smile,
    desc: "Aesthetic bonding, whitening, veneers, and smile makeovers.",
  },
  {
    key: "orthodontics",
    label: "Orthodontics & Aligners",
    icon: GraduationCap,
    desc: "Clear aligner solutions to straighten teeth comfortably.",
  },
  {
    key: "advanced",
    label: "Advanced Restorations",
    icon: Flame,
    desc: "Crowns, bridges, dentures, and periodontal gum care.",
  },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"] | "all";

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = search.toLowerCase().trim();
    return SERVICES.filter((s) => {
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term);
      const matchesCategory =
        activeCategory === "all" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, search]);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,110,0.12),_transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
            <Activity className="w-3 h-3" /> Treatments &amp; Care
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]">
            Premium dentistry,{" "}
            <span className="text-gold italic font-medium">tailored to you</span>.
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            From routine cleanings to full smile makeovers, every treatment is delivered
            by Dr. Roghay Alizadeh and her team in Cork — with a written plan and clear
            pricing every time.
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-3 justify-center pt-2 max-w-sm mx-auto sm:max-w-none">
            <BookButton
              label="Book Consultation"
              showIcon
              className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-3 sm:px-6 py-3 rounded-lg shadow-md transition-colors flex items-center justify-center w-full"
            />
            <Link
              href="/pricing"
              className="border border-white/25 hover:border-gold hover:text-gold text-white font-semibold text-sm px-3 sm:px-6 py-3 rounded-lg transition-colors flex items-center justify-center text-center w-full"
            >
              See full pricing
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY TILES */}
      <section className="-mt-10 relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = activeCategory === c.key;
            const count = SERVICES.filter((s) => s.category === c.key).length;
            return (
              <button
                key={c.key}
                onClick={() =>
                  setActiveCategory((prev) => (prev === c.key ? "all" : c.key))
                }
                className={`text-left rounded-2xl border p-4 md:p-5 transition-all bg-white shadow-card flex flex-col gap-3 ${
                  isActive
                    ? "border-gold ring-1 ring-gold/40"
                    : "border-gray-100 hover:border-gold"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-gold text-navy"
                        : "bg-gold/10 text-gold"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                    {count} services
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-sm md:text-base font-semibold text-navy">
                    {c.label}
                  </h3>
                  <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed mt-1">
                    {c.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SEARCH + LIST */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
              Treatment Library
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              {activeCategory === "all"
                ? "All treatments"
                : CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 md:flex-none md:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search treatments…"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                activeCategory === "all"
                  ? "bg-navy text-white border-navy"
                  : "border-gray-200 text-navy hover:border-gold hover:text-gold"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  activeCategory === c.key
                    ? "bg-navy text-white border-navy"
                    : "border-gray-200 text-navy hover:border-gold hover:text-gold"
                }`}
              >
                {c.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-16 bg-off-white rounded-2xl border border-dashed border-gray-200">
            No treatments match your filters. Try clearing the search or selecting a
            different category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {visible.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        )}
      </section>

      {/* CONSULT CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
        <div className="bg-gold/10 border border-gold/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white border border-gold/40 px-2.5 py-1 rounded-full">
              <Activity className="w-3 h-3" /> Free Consultation
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-navy leading-tight">
              Not sure which treatment is right for you?
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
              Book a 30-minute consultation with Dr. Roghay Alizadeh. We&apos;ll review
              your goals, map options, and send you a written cost plan.
            </p>
          </div>
          <BookButton
            label="Book Free Consult"
            showIcon
            className="bg-navy hover:bg-gray-800 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-md shrink-0 flex items-center"
          />
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceType }) {
  return (
    <article className="border border-gray-100 bg-white rounded-2xl p-6 shadow-sm hover:border-gold hover:shadow-card transition-all flex flex-col gap-4">
      <header className="space-y-2">
        <span className="inline-block text-[10px] uppercase font-semibold tracking-widest text-gold">
          {service.category}
        </span>
        <h3 className="font-serif text-lg font-semibold text-navy leading-tight">
          {service.name}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
          {service.description}
        </p>
      </header>

      <div className="flex items-center gap-2 text-[11px] text-gray-500">
        <Clock className="w-3.5 h-3.5 text-gold" />
        <span>Approx. {service.duration} mins</span>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
            From
          </span>
          <span className="font-serif text-lg font-bold text-navy">
            {service.priceFrom === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              <>&euro;{service.priceFrom}</>
            )}
          </span>
        </div>
        <Link
          href={`/services/${service.slug}`}
          className="text-xs font-bold text-gold hover:text-gold-dark inline-flex items-center gap-1.5"
        >
          Learn More <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
