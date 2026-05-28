"use client";

import { useState } from "react";
import BeforeAfterSlider from "@/components/public/BeforeAfterSlider";
import Link from "next/link";
import BookButton from "@/components/public/BookButton";

export default function GalleryPage() {
  const [filter, setFilter] = useState("all");

  const categories = [
    { key: "all", label: "All Cases" },
    { key: "invisalign", label: "Invisalign" },
    { key: "veneers", label: "Veneers" },
    { key: "whitening", label: "Whitening" },
    { key: "bonding", label: "Bonding" },
    { key: "smile-design", label: "Smile Design" },
  ];

  const AFTER_IMG = "/image.png";

  const galleryItems = [
    {
      category: "veneers",
      treatmentName: "Porcelain Veneers",
      initials: "A.C.",
      before: "/image_copy.png",
      after: AFTER_IMG,
    },
    {
      category: "bonding",
      treatmentName: "Composite Bonding",
      initials: "M.H.",
      before: "/image_copy_5.png",
      after: AFTER_IMG,
    },
    {
      category: "invisalign",
      treatmentName: "Invisalign Clear Aligners",
      initials: "L.D.",
      before: "/image_copy_2.png",
      after: AFTER_IMG,
    },
    {
      category: "smile-design",
      treatmentName: "Digital Smile Makeover",
      initials: "J.S.",
      before: "/image_copy_3.png",
      after: AFTER_IMG,
    },
    {
      category: "whitening",
      treatmentName: "In-Clinic Laser Whitening",
      initials: "R.W.",
      before: "/image.png",
      after: AFTER_IMG,
    },
    {
      category: "bonding",
      treatmentName: "Composite Bonding",
      initials: "P.K.",
      before: "/image_copy_5.png",
      after: AFTER_IMG,
    }
  ];

  const filteredItems = filter === "all" ? galleryItems : galleryItems.filter(item => item.category === filter);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Interior Hero */}
      <section className="bg-navy text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gold/10 opacity-40" />
        <div className="relative z-10 space-y-3">
          <h1 className="font-serif text-4xl md:text-5xl font-bold">Smile Transformations</h1>
          <p className="text-gray-300 text-xs md:text-sm tracking-wide uppercase">
            Real patient before-and-after results by Dr. Roghay Alizadeh
          </p>
        </div>
      </section>

      {/* Filter pills */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-gray-100 pb-6">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`py-2 px-4 rounded-full text-xs font-semibold transition-all focus:outline-none ${
                filter === c.key ? "bg-gold text-navy" : "bg-gray-50 text-navy hover:bg-gray-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        {filteredItems.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-gray-400">
            No transformations under this category yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <BeforeAfterSlider
                  treatmentName={item.treatmentName}
                  initials={item.initials}
                  beforeImage={item.before}
                  afterImage={item.after}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Consent disclaimer */}
      <section className="max-w-xl mx-auto px-4 text-center">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          * All clinical photographs displayed in this gallery have been published with the express written consent of the patients. Individual clinical results may vary.
        </p>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-navy text-white rounded-2xl p-10 text-center space-y-4">
          <h3 className="text-2xl font-serif font-semibold">Transform Your Smile</h3>
          <p className="text-gray-300 text-xs max-w-md mx-auto">
            Book a smile design consultation today and preview your results digitally.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <BookButton
              label="Book Online"
              className="bg-gold hover:bg-gold-dark text-navy font-bold text-xs px-6 py-3 rounded-lg shadow cursor-pointer"
            />
          </div>
        </div>
      </section>

    </div>
  );
}
