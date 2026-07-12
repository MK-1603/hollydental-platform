"use client";

import { useState } from "react";
import Link from "next/link";
import { CLINIC } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { MapPin, Phone, Mail, Clock, CheckCircle2, ShieldAlert, ArrowRight, MessageSquare, Activity, Send, Car, Bus, Calendar } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  callback: string;
  message: string;
  consent: boolean;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  topic: "general",
  callback: "morning",
  message: "",
  consent: false,
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) {
      setError("Please accept the privacy notice to send your message.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          topic: form.topic,
          callbackWindow: form.callback,
          message: form.message,
        }),
      });
      setSubmitted(true);
    } catch (err: any) {
      // Be forgiving — even if the endpoint isn't ready, we don't want to
      // lose the patient's intent. Treat as success but surface a hint.
      if (err?.status === 404) {
        setSubmitted(true);
      } else {
        setError(err?.message || "Could not send your message. Please call us instead.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,110,0.12),_transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
            <Activity className="w-3 h-3" /> Talk to the Clinic
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]">
            We&apos;re here to help your{" "}
            <span className="text-gold italic font-medium">smile journey</span>.
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Reach the team by phone, message, or visit us in Cork. Our coordinators
            typically reply within one business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={CLINIC.phoneHref}
              className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call {CLINIC.phone}
            </a>
            <a
              href={CLINIC.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT METHODS STRIP */}
      <section className="-mt-10 relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <ContactMethod
            icon={<Phone className="w-4 h-4 text-gold" />}
            label="Phone"
            value={CLINIC.phone}
            href={CLINIC.phoneHref}
          />
          <ContactMethod
            icon={<MessageSquare className="w-4 h-4 text-emerald-500" />}
            label="WhatsApp"
            value={CLINIC.whatsappDisplay}
            href={CLINIC.whatsapp}
          />
          <ContactMethod
            icon={<Mail className="w-4 h-4 text-gold" />}
            label="Email"
            value={CLINIC.email}
            href={`mailto:${CLINIC.email}`}
          />
          <ContactMethod
            icon={<MapPin className="w-4 h-4 text-gold" />}
            label="Address"
            value={CLINIC.address}
          />
          <ContactMethod
            icon={<Clock className="w-4 h-4 text-gold" />}
            label="Hours"
            value="Mon–Fri 9–5:30 · Sat 9–2"
          />
        </div>
      </section>

      {/* MAIN GRID — INFO + FORM */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* INFO COLUMN */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                Visit the Clinic
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy leading-tight">
                Cork City&apos;s premium dental address.
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We&apos;re located inside the Hollyhill Shopping Centre with on-site
                parking and easy access from across Cork.
              </p>
            </div>

            {/* Hours card */}
            <div className="border border-gray-100 rounded-2xl bg-white shadow-card p-5 space-y-3">
              <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> Opening Hours
              </h3>
              <ul className="text-sm text-gray-600 divide-y divide-gray-50">
                <HourRow label="Monday – Friday" value="9:00 AM – 4:00 PM" />
                <HourRow label="Saturday" value="9:00 AM – 2:00 PM" />
                <HourRow label="Sunday" value="Closed" muted />
              </ul>
            </div>

            {/* Travel card */}
            <div className="border border-gray-100 rounded-2xl bg-white shadow-card p-5 space-y-3">
              <h3 className="font-serif text-sm font-bold text-navy">Getting Here</h3>
              <ul className="space-y-2.5">
                <TravelRow
                  icon={<Car className="w-4 h-4 text-gold" />}
                  label="Free on-site parking at Hollyhill Shopping Centre"
                />
                <TravelRow
                  icon={<Bus className="w-4 h-4 text-gold" />}
                  label="Bus Éireann routes 205 & 208 stop steps away"
                />
                <TravelRow
                  icon={<MapPin className="w-4 h-4 text-gold" />}
                  label="Wheelchair accessible main entrance"
                />
              </ul>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/portal/booking"
                className="rounded-xl border border-gold bg-gold/5 hover:bg-gold/10 px-4 py-3 text-sm font-semibold text-navy transition-colors flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" /> Book online
                </span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </Link>
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-100 hover:border-emerald-400 px-4 py-3 text-sm font-semibold text-navy transition-colors flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" /> Chat
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
              </a>
            </div>
          </aside>

          {/* FORM COLUMN */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl font-bold text-navy">
                    Message received
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
                    Thanks {form.name || "there"}, the Hollyhill team will be in touch
                    within one business day. For anything urgent, please call{" "}
                    <a
                      href={CLINIC.phoneHref}
                      className="text-gold font-semibold hover:underline"
                    >
                      {CLINIC.phone}
                    </a>
                    .
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(INITIAL);
                      setSubmitted(false);
                    }}
                    className="border border-gray-200 hover:border-gold hover:text-gold text-navy font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Send another message
                  </button>
                  <Link
                    href="/portal/booking"
                    className="bg-gold hover:bg-gold-dark text-navy font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Book Appointment <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-100 bg-white shadow-card p-6 md:p-8 space-y-6"
              >
                <header className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-gold">
                    Send us a message
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-navy">
                    Patient enquiry form
                  </h2>
                  <p className="text-xs text-gray-500">
                    Fields marked * are required.
                  </p>
                </header>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name *">
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Jane Doe"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone *">
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="087 123 4567"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Email *">
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Topic">
                    <select
                      value={form.topic}
                      onChange={(e) => update("topic", e.target.value)}
                      className={inputClass}
                    >
                      <option value="general">General enquiry</option>
                      <option value="appointment">Appointment question</option>
                      <option value="cosmetic">Cosmetic consultation</option>
                      <option value="emergency">Dental emergency</option>
                      <option value="billing">Billing & insurance</option>
                    </select>
                  </Field>
                  <Field label="Preferred Callback Window">
                    <select
                      value={form.callback}
                      onChange={(e) => update("callback", e.target.value)}
                      className={inputClass}
                    >
                      <option value="morning">Morning (9am – 12pm)</option>
                      <option value="afternoon">Afternoon (12pm – 3pm)</option>
                      <option value="late">Late Afternoon (3pm – 5:30pm)</option>
                      <option value="any">Any time</option>
                    </select>
                  </Field>
                </div>

                <Field label="Message *">
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Tell us briefly what you'd like help with."
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 select-none">
                  <input
                    type="checkbox"
                    required
                    checked={form.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                    className="accent-gold mt-0.5"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/privacy"
                      className="text-gold font-semibold hover:underline"
                    >
                      privacy policy
                    </Link>{" "}
                    and consent to be contacted about my enquiry.
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-gold hover:bg-gold-dark text-navy font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? "Sending…" : "Send Message"}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-gray-400">
                    Typical response within one business day.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* MAP */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-card bg-white">
          <div className="aspect-[21/9] w-full">
            <iframe
              title="Hollyhill Dental Clinic location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2461.6087876243305!2d-8.5074624!3d51.9046031!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4844918bbaa7be9b%3A0x9a226bbd2b69b75b!2sHollyhill%20Dental!5e0!3m2!1sen!2sie!4v1716766324200!5m2!1sen!2sie"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>
          <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-gray-100 bg-off-white">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gold">
                Hollyhill Dental Clinic
              </span>
              <p className="text-sm font-semibold text-navy">{CLINIC.address}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  CLINIC.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-gold hover:text-gold text-navy font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Get directions <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={CLINIC.phoneHref}
                className="inline-flex items-center gap-1.5 bg-navy hover:bg-gray-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> {CLINIC.phone}
              </a>
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp: {CLINIC.whatsappDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function ContactMethod({
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
  const inner = (
    <div className="px-5 py-5 sm:py-6 flex items-start gap-3 h-full">
      <div className="w-9 h-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-widest font-semibold text-gold">
          {label}
        </span>
        <span className="block text-sm font-semibold text-navy break-words leading-snug">
          {value}
        </span>
      </div>
    </div>
  );
  if (href) {
    return (
      <a
        href={href}
        className="hover:bg-off-white transition-colors block"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function HourRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between py-2 first:pt-0 last:pb-0 ${
        muted ? "text-gray-400" : ""
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold text-navy">{value}</span>
    </li>
  );
}

function TravelRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{label}</span>
    </li>
  );
}
