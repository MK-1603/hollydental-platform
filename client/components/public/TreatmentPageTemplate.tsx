"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { Star, ShieldCheck, Sparkles, HelpCircle, ArrowRight, Clock, Plus, Minus } from "lucide-react";
import BeforeAfterSlider from "@/components/public/BeforeAfterSlider";
import { CLINIC } from "@/lib/constants";

interface Step {
  title: string;
  description: string;
}

interface FAQ {
  q: string;
  a: string;
}

export interface TreatmentPageTemplateProps {
  slug: string;
  treatmentName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  descriptionText: string;
  benefits: string[];
  procedureSteps: Step[];
  recoveryTime: string;
  faqs: FAQ[];
  beforeImage: string;
  afterImage: string;
  durationMins: number;
  priceFrom: number;
}

export default function TreatmentPageTemplate({
  slug,
  treatmentName,
  heroTitle,
  heroSubtitle,
  heroImage,
  descriptionText,
  benefits,
  procedureSteps,
  recoveryTime,
  faqs,
  beforeImage,
  afterImage,
  durationMins,
  priceFrom,
}: TreatmentPageTemplateProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const { openLoginModal } = useUIStore();

  const handleBook = () => {
    const target = "/portal/booking";
    if (user) {
      router.push(target);
      return;
    }
    openLoginModal(() => {
      router.push(target);
    });
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hollydental-platform.vercel.app";
  const schemaUrl = `${siteUrl}/${slug}`;

  // Structured schemas
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#clinic`,
      "name": "Hollyhill Aesthetic & Dental Clinic",
      "image": `${siteUrl}/logo.png`,
      "priceRange": "$$",
      "telephone": "+353214303072",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Unit 6, Hollyhill Shopping Centre",
        "addressLocality": "Cork",
        "addressCountry": "IE"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />

      {/* 1. HERO */}
      <section className="min-h-[75vh] bg-navy text-white flex items-center relative overflow-hidden pt-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-navy/5 to-navy opacity-80" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 py-12">
          {/* Left info */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
              <Sparkles className="w-3.5 h-3.5" /> Premium Treatment Landing Page
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-gray-300 text-sm md:text-base xl:text-lg max-w-xl font-normal leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleBook}
                className="bg-gold hover:bg-gold-dark text-navy text-center py-3.5 px-8 rounded-lg font-bold text-xs tracking-wider uppercase shadow-lg transition-all cursor-pointer"
              >
                Book Appointment &rarr;
              </button>
              <div className="text-xs text-gray-400">
                <span className="block text-white font-bold">Approx. {durationMins} mins</span>
                <span className="block">From €{priceFrom}</span>
              </div>
            </div>
          </div>
          {/* Right image */}
          <div className="lg:col-span-5 relative flex justify-center order-first lg:order-none">
            <div className="relative w-full max-w-[340px] aspect-[4/5] bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={heroImage}
                alt={`${treatmentName} treatment`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. DESCRIPTION & BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-6">
          <span className="text-[11px] uppercase tracking-widest font-bold text-gold">What to expect</span>
          <h2 className="text-3xl font-serif font-bold text-navy">About the Procedure</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {descriptionText}
          </p>
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mt-6">
            <h4 className="font-bold text-navy text-xs uppercase tracking-wider mb-2">Recovery &amp; Aftercare Guidelines</h4>
            <p className="text-gray-600 text-xs leading-relaxed">{recoveryTime}</p>
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <span className="text-[11px] uppercase tracking-widest font-bold text-gold">Why choose this</span>
          <h2 className="text-3xl font-serif font-bold text-navy">Key Benefits</h2>
          <ul className="space-y-4">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-navy bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-gold transition-colors">
                <ShieldCheck className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. STEP BY STEP PROCEDURE */}
      <section className="bg-off-white py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-bold text-gold">Step-by-step</span>
            <h2 className="text-3xl font-serif font-bold text-navy">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {procedureSteps.map((step, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                <span className="absolute -top-4 left-6 bg-gold text-navy text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border border-white shadow">
                  {i + 1}
                </span>
                <h4 className="font-serif text-base font-semibold text-navy mt-2 mb-2">{step.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BEFORE / AFTER VISUAL */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 space-y-6 text-center">
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-bold text-gold">Clinical Results</span>
          <h2 className="text-3xl font-serif font-bold text-navy">Before &amp; After Comparison</h2>
          <p className="text-gray-500 text-xs max-w-md mx-auto">
            See the transformative quality of our clinical treatments. Slide or click to compare.
          </p>
        </div>
        <div className="flex justify-center pt-4">
          <div className="w-full max-w-[500px]">
            <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} />
          </div>
        </div>
      </section>

      {/* 5. FAQs ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-bold text-gold">FAQ Desk</span>
          <h2 className="text-3xl font-serif font-bold text-navy">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
          {faqs.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div key={i} className="transition-colors">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs font-bold text-navy hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-gold shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <Minus className="w-4 h-4 text-gold shrink-0 ml-4" />
                  ) : (
                    <Plus className="w-4 h-4 text-gold shrink-0 ml-4" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-[11px] text-gray-500 leading-relaxed pl-12">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOOKING CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-gold/10 border border-gold/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white border border-gold/40 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> Booking Request
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-navy leading-tight">
              Ready to schedule your {treatmentName} consultation?
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
              Select an available time slot online. Direct confirmation by our doctor within 2 hours.
            </p>
          </div>
          <button
            onClick={handleBook}
            className="bg-navy hover:bg-gray-800 text-white text-sm font-bold px-6 py-3 rounded-lg shadow-md shrink-0 flex items-center gap-1.5 transition-colors focus:outline-none"
          >
            Book Free Consult <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
