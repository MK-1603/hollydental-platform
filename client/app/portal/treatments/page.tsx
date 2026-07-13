"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { History, CheckCircle2, Circle, Clock, ChevronRight, Search, Smile, Stethoscope, Crown, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

/* ─────────────────────────────────────────────
   CARE JOURNEY TIMELINE
───────────────────────────────────────────── */
const JOURNEY_STEPS = [
  { id: "consultation", label: "Consultation & Scan", icon: <Search className="w-5 h-5" />, keywords: ["consultation", "exam", "check", "scan", "x-ray", "xray"] },
  { id: "cleaning", label: "Plaque Removal & Cleaning", icon: <Smile className="w-5 h-5" />, keywords: ["clean", "hygiene", "scale", "polish", "plaque", "tartar"] },
  { id: "active", label: "Active Care / Filling", icon: <Stethoscope className="w-5 h-5" />, keywords: ["fill", "cavity", "restoration", "composite", "amalgam", "root canal", "extraction"] },
  { id: "crown", label: "Crown / Alignment", icon: <Crown className="w-5 h-5" />, keywords: ["crown", "veneer", "bridge", "implant", "invisalign", "brace", "align", "orthodon"] },
  { id: "maintenance", label: "Maintenance", icon: <Shield className="w-5 h-5" />, keywords: ["maintenance", "review", "recall", "follow", "check-up", "checkup"] },
];

function matchStep(appt: any): string | null {
  const text = [appt.serviceId, appt.notes, appt.type].join(" ").toLowerCase();
  for (const step of JOURNEY_STEPS) {
    if (step.keywords.some((kw) => text.includes(kw))) return step.id;
  }
  return null;
}

function CareJourneyTimeline({ appointments }: { appointments: any[] }) {
  // Determine which steps are completed/active based on appointment history
  const completedStepIds = new Set<string>();
  for (const appt of appointments) {
    const sid = matchStep(appt);
    if (sid && appt.status === "completed") completedStepIds.add(sid);
  }

  // Find the first non-completed step as "active" (in-progress)
  let activeIdx = -1;
  for (let i = 0; i < JOURNEY_STEPS.length; i++) {
    if (!completedStepIds.has(JOURNEY_STEPS[i].id)) {
      activeIdx = i;
      break;
    }
  }
  // If all completed, no active
  const allDone = completedStepIds.size === JOURNEY_STEPS.length;

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="font-serif text-base font-bold text-navy">Your Care Journey</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          A visual roadmap of your dental treatment progress at Hollyhill Dental Clinic.
        </p>
      </div>

      {/* Desktop horizontal timeline */}
      <div className="hidden sm:flex items-start relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />

        {JOURNEY_STEPS.map((step, i) => {
          const done = completedStepIds.has(step.id);
          const active = i === activeIdx && !allDone;
          const upcoming = !done && !active;

          return (
            <div key={step.id} className="flex-1 flex flex-col items-center gap-2 relative z-10">
              {/* Node */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                done ? "bg-emerald-500 border-emerald-500 shadow-md" :
                active ? "bg-gold border-gold shadow-md animate-pulse" :
                "bg-white border-gray-200"
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5 text-white" /> : step.icon}
              </div>

              {/* Label */}
              <div className="text-center px-1">
                <span className={`block text-[10px] font-bold leading-tight ${
                  done ? "text-emerald-600" : active ? "text-gold" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
                <span className={`block text-[9px] mt-0.5 font-semibold uppercase tracking-wider ${
                  done ? "text-emerald-400" : active ? "text-gold/70" : "text-gray-300"
                }`}>
                  {done ? "Completed" : active ? "Active" : "Upcoming"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="sm:hidden space-y-3">
        {JOURNEY_STEPS.map((step, i) => {
          const done = completedStepIds.has(step.id);
          const active = i === activeIdx && !allDone;

          return (
            <div key={step.id} className="flex items-center gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 shrink-0 ${
                done ? "bg-emerald-500 border-emerald-500" :
                active ? "bg-gold border-gold animate-pulse" :
                "bg-white border-gray-200"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : step.icon}
              </div>
              <div className="flex-1">
                <span className={`block text-xs font-bold ${done ? "text-emerald-600" : active ? "text-gold" : "text-gray-400"}`}>
                  {step.label}
                </span>
                <span className={`block text-[10px] font-semibold uppercase tracking-wider ${
                  done ? "text-emerald-400" : active ? "text-gold/70" : "text-gray-300"
                }`}>
                  {done ? "Completed" : active ? "Active" : "Upcoming"}
                </span>
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-200 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Congratulations — you&apos;ve completed your full care journey! Book a maintenance visit to keep your smile healthy.
        </div>
      )}

      {appointments.length === 0 && (
        <p className="text-[11px] text-gray-400 text-center py-2">
          Your journey steps will be marked as you complete appointments at the clinic.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function PortalTreatmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/appointments/my")
      .then((data) => {
        setAppointments(
          data.filter(
            (a: any) =>
              a.status === "completed" ||
              a.appointmentDate < new Date().toISOString()
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="font-serif text-2xl font-bold text-navy">Treatment History</h1>
        <p className="text-gray-500 text-xs mt-1">
          Review complete medical logs and your dental care roadmap.
        </p>
      </div>

      {/* Care Journey Timeline */}
      {loading ? (
        <div className="h-[180px] shimmer rounded-2xl" />
      ) : (
        <CareJourneyTimeline appointments={appointments} />
      )}

      {/* History list */}
      {loading ? (
        <div className="h-[200px] shimmer rounded-xl" />
      ) : appointments.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl bg-white p-12 text-center space-y-3 max-w-md mx-auto">
          <History className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-serif text-base font-semibold text-navy">No Treatments Logged</h3>
          <p className="text-gray-500 text-xs leading-relaxed">
            There are no completed medical procedures registered in your patient file yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((item, idx) => (
            <div key={item.id} className="relative flex gap-6 pl-4 md:pl-8 group">
              {idx < appointments.length - 1 && (
                <div className="absolute top-8 bottom-0 left-[27px] md:left-[43px] w-0.5 bg-gray-200" />
              )}
              <div className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-xs shrink-0 mt-1 relative z-10">
                &bull;
              </div>
              <div className="border border-gray-100 bg-white rounded-xl p-5 shadow-sm hover:border-gold transition-colors flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                      {formatDate(item.appointmentDate)}
                    </span>
                    <h3 className="font-serif text-base font-bold text-navy mt-1 capitalize">
                      {String(item.serviceId || "Appointment").replace(/-/g, " ")}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-navy bg-gold/10 px-2 py-0.5 rounded">
                    Dr. Roghay
                  </span>
                </div>
                {item.notes && (
                  <p className="text-gray-500 text-xs leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
