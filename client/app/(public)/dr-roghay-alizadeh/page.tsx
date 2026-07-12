import type { Metadata } from "next";
import Link from "next/link";
import { CLINIC } from "@/lib/constants";
import { Award, ShieldCheck, HeartHandshake, CheckCircle, Activity, ArrowLeft, Quote, Star, BookOpen, Calendar, MessageSquare } from "lucide-react";
import BookButton from "@/components/public/BookButton";

export const metadata: Metadata = {
  title: "Dr. Roghay Alizadeh | Principal Dentist Cork | Hollyhill Dental",
  description:
    "Meet Dr. Roghay Alizadeh, lead cosmetic & restorative dentist at Hollyhill Dental Cork. Over 20 years of clinical experience creating beautiful, confident smiles.",
  keywords: ["Dr Roghay Alizadeh", "dentist Cork", "cosmetic dentist Cork", "Hollyhill Dental doctor", "smile makeovers Cork"],
};

export default function DoctorBioPage() {
  const credentials = [
    "Dental Council of Ireland — Registration #4203",
    "Member of the Irish Dental Association (IDA)",
    "Diploma in Clinical Restorative Dentistry",
    "Advanced Aesthetic & Cosmetic Dentistry Certification",
    "Nervous Patient Sedation Specialist",
    "Over 20 Years of Clinical Experience in Cork City",
  ];

  return (
    <div className="bg-white">
      {/* Back button & Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <Link
          href="/about"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to About
        </Link>
      </div>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Portrait Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden border border-gray-100 shadow-card bg-white hover:scale-[1.01] transition-transform duration-500">
              <img
                src="/doctor.png"
                alt="Dr. Roghay Alizadeh — Principal Dentist"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/95 text-navy rounded-xl px-3 py-2 shadow-md flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-xs font-bold">5.0 Rated</span>
              </div>
            </div>
          </div>

          {/* Intro Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-gold/10 px-3.5 py-1.5 rounded-full border border-gold/15">
              <Activity className="w-3 h-3" /> Principal Dentist & Director
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-[1.1]">
              Dr. Roghay Alizadeh
            </h1>
            <p className="text-gold font-serif text-lg italic tracking-wide">
              {CLINIC.tagline}
            </p>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light">
              Dr. Roghay Alizadeh is one of Cork&apos;s leading practitioners in advanced aesthetic and restorative dentistry. 
              Over two decades of practice, she has established a reputation for clinical excellence, meticulous detail, 
              and a deeply empathetic approach to patient care.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
              <BookButton
                label="Request Consultation"
                showIcon
                className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all duration-150 flex items-center"
              />
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-emerald-500/35 hover:border-emerald-500 hover:text-emerald-500 text-emerald-600 font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-150 text-center flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp Direct
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED BIO & PHILOSOPHY */}
      <section className="bg-off-white py-16 md:py-24 border-y border-gold/15">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Philosophy Card */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy">
              Clinical Philosophy &amp; Story
            </h2>
            <div className="space-y-4 text-gray-600 text-sm md:text-base leading-relaxed font-light">
              <p>
                Dr. Roghay Alizadeh believes that dental care is a blend of science, engineering, and art. 
                Her journey began with a dedication to master the complex anatomy of the smile. After completing her dental qualifications, 
                she pursued extensive postgraduate training in clinical restorative dentistry and digital smile makeovers.
              </p>
              <p>
                Having run Hollyhill Dental for over 20 years, she has treated thousands of patients in Cork, building long-standing relationships 
                founded on transparency and absolute comfort. She is particularly celebrated for her work with extremely nervous patients, 
                using advanced sedation techniques and a gentle, step-by-step communication style.
              </p>
              <p>
                &ldquo;Every smile we design starts with listening. We believe that clinical execution must support 
                not only oral wellness, but the patient&apos;s personal confidence. My goal is to ensure you feel secure, informed, 
                and completely in control of your dental path.&rdquo;
              </p>
            </div>

            <blockquote className="relative rounded-2xl border border-gold/30 bg-gold/5 p-6 text-navy mt-6">
              <Quote className="absolute -top-3 -left-3 w-7 h-7 text-gold bg-white rounded-full p-1.5 shadow" />
              <p className="font-serif italic text-base leading-snug">
                &ldquo;A great smile should never be artificial. True aesthetic dentistry restores harmony, mimicking nature at its finest.&rdquo;
              </p>
              <span className="block text-[10px] uppercase tracking-widest text-gold font-bold mt-3">
                — Dr. Roghay Alizadeh
              </span>
            </blockquote>
          </div>

          {/* Credentials Sidebar */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-navy">Professional Standings</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gold mt-0.5">Accredited Practitioner</p>
                </div>
              </div>

              <ul className="space-y-4">
                {credentials.map((cred, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs md:text-sm text-gray-700 leading-normal font-light">
                    <CheckCircle className="w-4.5 h-4.5 text-gold mt-0.5 shrink-0" />
                    <span>{cred}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <div className="p-4 bg-navy text-white rounded-2xl flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gold shrink-0" />
                  <div className="text-[11px]">
                    <span className="block font-bold text-white uppercase tracking-wider text-[9px]">Continuous Education</span>
                    Completed over 500 hours of clinical hands-on aesthetic training.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-20 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-navy via-[#0c1b2e] to-[#040e1a] border border-gold/25 p-8 md:p-12 relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(201,169,110,0.15),_transparent_60%)] pointer-events-none" />
          <div className="relative space-y-4">
            <span className="inline-flex items-center gap-1 bg-white/5 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" /> Book a Consultation
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              Smile Consultation with Dr. Roghay
            </h2>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
              Discuss your aesthetic goals, check dental health metrics, and get a customized, 
              written treatment cost outline directly from Cork&apos;s premium cosmetic specialist.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <BookButton
                label="Schedule Consult"
                showIcon
                className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-8 py-4 rounded-xl shadow-lg transition-colors flex items-center gap-2"
              />
              <Link
                href="/pricing"
                className="text-white/80 hover:text-gold text-xs font-semibold underline underline-offset-4"
              >
                View Treatment Pricing Guide
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
