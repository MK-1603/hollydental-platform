"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CLINIC } from "@/lib/constants";
import { MapPin, Phone, Mail, Clock, ChevronDown, ChevronUp, Instagram, Facebook, MessageSquare, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/public/Logo";

export default function Footer() {
  const router = useRouter();
  const { openLoginModal, openBookingModal } = useUIStore();
  const { user } = useAuthStore();
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    quickLinks: false,
    patientLinks: false,
    contactInfo: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const goToBooking = () => {
    openBookingModal();
  };

  return (
    <footer className="bg-gradient-to-b from-navy to-[#030d1a] text-white pt-20 pb-28 xl:pb-12 border-t border-white/5 relative z-10">
      <div className="w-full px-6 lg:px-12 xl:px-16 mx-auto">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 xl:gap-12 items-start">
          
          {/* Column 1: Brand, Description & Socials */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-start items-start">
            <Logo variant="full" theme="light" size={48} />
            
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm">
              Clinical excellence meets 5-star patient luxury. Under the guidance of {CLINIC.doctor}, we provide state-of-the-art general and cosmetic dental care in Cork.
            </p>

            {/* Social Icons Row */}
            <div className="flex gap-3 pt-2">
              <a
                href={CLINIC.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/10 hover:border-gold hover:bg-gold hover:text-white text-gray-400 transition-all duration-300 flex items-center justify-center group"
              >
                <Instagram className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/10 hover:border-gold hover:bg-gold hover:text-white text-gray-400 transition-all duration-300 flex items-center justify-center group"
              >
                <Facebook className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              </a>
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/10 hover:border-gold hover:bg-gold hover:text-white text-gray-400 transition-all duration-300 flex items-center justify-center group"
              >
                <MessageSquare className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-4 w-full max-w-sm">
              {/* Google Reviews */}
              <div className="flex-1 bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Google Reviews</span>
                  <span className="block text-xs font-bold text-white mt-0.5">5.0 Rating ★★★★★</span>
                </div>
              </div>

              {/* IDC Registry */}
              <div className="flex-1 bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Irish Dental Council</span>
                  <span className="block text-xs font-bold text-white mt-0.5">Registered (#4203)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 flex flex-col justify-start">
            <div
              className="flex items-center justify-between md:block cursor-pointer md:cursor-default py-3 border-b border-white/10 md:border-0"
              onClick={() => toggleAccordion("quickLinks")}
            >
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase font-sans">Quick Links</h4>
              <span className="md:hidden text-gold">
                {openAccordions.quickLinks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>

            <ul
              className={`mt-4 space-y-3 text-sm text-gray-400 ${
                openAccordions.quickLinks ? "block animate-fade-up" : "hidden md:block"
              }`}
            >
              <li>
                <Link href="/services" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Services Overview
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Pricing Guide
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Blog CMS
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="text-red-500 font-bold hover:text-red-400 hover:translate-x-1 transition-all duration-200 inline-block">
                  Dental Emergency
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Patient Resources */}
          <div className="lg:col-span-3 flex flex-col justify-start">
            <div
              className="flex items-center justify-between md:block cursor-pointer md:cursor-default py-3 border-b border-white/10 md:border-0"
              onClick={() => toggleAccordion("patientLinks")}
            >
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase font-sans">Patient Resources</h4>
              <span className="md:hidden text-gold">
                {openAccordions.patientLinks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>

            <ul
              className={`mt-4 space-y-3 text-sm text-gray-400 ${
                openAccordions.patientLinks ? "block animate-fade-up" : "hidden md:block"
              }`}
            >
              <li>
                <button onClick={goToBooking} className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block text-left cursor-pointer border-0 bg-transparent p-0 text-sm font-sans">
                  Book Appointment
                </button>
              </li>
              <li>
                <button onClick={() => openLoginModal()} className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block text-left cursor-pointer border-0 bg-transparent p-0 text-sm font-sans">
                  Patient Portal Login
                </button>
              </li>
              <li>
                <Link href="/new-patient" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  New Patient Form
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Before/After Gallery
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="/referral" className="hover:text-gold hover:translate-x-1 transition-all duration-200 inline-block">
                  Patient Referral Scheme
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Hours */}
          <div className="lg:col-span-3 flex flex-col justify-start">
            <div
              className="flex items-center justify-between md:block cursor-pointer md:cursor-default py-3 border-b border-white/10 md:border-0"
              onClick={() => toggleAccordion("contactInfo")}
            >
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase font-sans">Contact &amp; Hours</h4>
              <span className="md:hidden text-gold">
                {openAccordions.contactInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>

            <div
              className={`mt-4 space-y-4 text-sm text-gray-400 ${
                openAccordions.contactInfo ? "block animate-fade-up" : "hidden md:block"
              }`}
            >
              <a
                href="https://maps.app.goo.gl/8LiV9dg7KN5ApjYf9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-gold transition-colors group"
              >
                <div className="w-7 h-7 rounded bg-white/[0.03] border border-white/10 flex items-center justify-center text-gold shrink-0 mt-0.5 group-hover:border-gold transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="leading-snug">{CLINIC.address}</span>
              </a>

              <a
                href={CLINIC.phoneHref}
                className="flex items-center gap-3 hover:text-gold transition-colors group"
              >
                <div className="w-7 h-7 rounded bg-white/[0.03] border border-white/10 flex items-center justify-center text-gold shrink-0 group-hover:border-gold transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-semibold">{CLINIC.phone}</span>
              </a>

              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-emerald-400 text-emerald-400/90 transition-colors group"
              >
                <div className="w-7 h-7 rounded bg-white/[0.03] border border-white/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:border-emerald-400 transition-colors">
                  <MessageCircle className="w-4 h-4 fill-emerald-400/10" />
                </div>
                <span className="font-semibold">{CLINIC.whatsappDisplay} (WhatsApp)</span>
              </a>

              <a
                href={`mailto:${CLINIC.email}`}
                className="flex items-center gap-3 hover:text-gold transition-colors group"
              >
                <div className="w-7 h-7 rounded bg-white/[0.03] border border-white/10 flex items-center justify-center text-gold shrink-0 group-hover:border-gold transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="truncate">{CLINIC.email}</span>
              </a>

              <div className="flex items-start gap-3 pt-1">
                <div className="w-7 h-7 rounded bg-white/[0.03] border border-white/10 flex items-center justify-center text-gold shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1.5 pt-0.5 leading-none">
                  <span className="block font-medium">{CLINIC.hours.weekdays}</span>
                  <span className="block font-medium">{CLINIC.hours.saturday}</span>
                  <span className="block text-red-400 font-bold">{CLINIC.hours.sunday}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <span>&copy; {new Date().getFullYear()} Hollyhill Dental Cork. All rights reserved.</span>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-end">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link href="/complaints" className="hover:text-white transition-colors">Complaints Procedure</Link>
            <Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            <span className="text-gray-600">GDPR: {CLINIC.gdprEmail}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
