"use client";

import { useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { useAuthStore } from "@/store/useAuthStore";
import { ClipboardList, Calendar, Pill, RefreshCw, Download, X, Eye, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { generatePrescriptionPDF } from "@/lib/pdf";

interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
  createdAt: string;
}

function normalizePrescriptions(raw: any): Prescription[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.prescriptions)) return raw.prescriptions;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export default function PatientPrescriptionsPage() {
  const { user } = useAuthStore();
  
  const {
    data: prescriptions = [],
    loading,
    refetch,
  } = useLiveData<Prescription[]>("/prescriptions", {
    intervalMs: 20000,
    select: normalizePrescriptions,
    initialData: [],
  });

  // Modal active selection state
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  return (
    <div className="space-y-6 font-sans pb-12 max-w-5xl mx-auto px-1 select-none">
      
      {/* ── Header Bar ── */}
      <header className="flex items-center justify-between border-b border-gray-250 pb-4 gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5 text-gold" />
            </div>
            Prescription Ledger
          </h1>
          <p className="text-gray-400 text-xs mt-1 ml-10.5 hidden sm:block">
            Active medical scripts and dosage guidelines from Dr. Roghay Alizadeh.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
          
          <button
            onClick={refetch}
            className="bg-white hover:bg-gray-50 text-navy border border-gray-200 hover:border-navy font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold" : ""}`} />
            Sync Ledger
          </button>
        </div>
      </header>

      {loading && prescriptions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 shimmer rounded-3xl bg-white border border-gray-100" />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="border border-gray-250/60 rounded-3xl bg-white p-16 text-center max-w-md mx-auto mt-6 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold mx-auto flex items-center justify-center border border-gold/15 shadow-inner">
            <ClipboardList className="w-6 h-6 text-gold" />
          </div>
          <h3 className="font-serif text-base font-extrabold text-navy">
            No active scripts
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mx-auto font-medium">
            There are no medical prescriptions on file yet. Anything issued by the clinician will appear here instantly.
          </p>
        </div>
      ) : (
        /* ── Redesigned flat Cards Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((rx) => (
            <article
              key={rx.id}
              onClick={() => setSelectedRx(rx)}
              className="border border-gray-200/60 hover:border-gold bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden cursor-pointer hover:-translate-y-0.5 group"
            >
              {/* Subtle background pill decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center border border-gold/15 shrink-0 shadow-inner">
                      <Pill className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif text-base font-extrabold text-navy truncate group-hover:text-gold transition-colors duration-200">
                        {rx.drugName}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {rx.dosage} &bull; {rx.frequency}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-gold-dark bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-lg uppercase tracking-wider whitespace-nowrap">
                    {rx.duration}
                  </span>
                </div>

                <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                  {rx.instructions}
                </p>
              </div>

              {/* Card Footer metadata */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 pt-2.5 mt-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  Issued {formatDate(rx.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 text-navy group-hover:text-gold font-extrabold transition-colors">
                  View details <Eye className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Breathtaking Modal Popup details View ── */}
      {selectedRx && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedRx(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-up border border-gray-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-navy to-blue-950 p-5 text-white relative">
              <button
                onClick={() => setSelectedRx(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center font-bold text-gold shrink-0">
                  <Pill className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold">
                    {selectedRx.drugName}
                  </h4>
                  <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold mt-0.5">
                    {selectedRx.dosage} &bull; {selectedRx.frequency}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto no-scrollbar">
              
              {/* Telemetry data rows */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4.5 space-y-3 shadow-2xs">
                <DetailRow label="Drug Name" value={selectedRx.drugName} />
                <DetailRow label="Dosage Strength" value={selectedRx.dosage} />
                <DetailRow label="Intake Frequency" value={selectedRx.frequency} />
                <DetailRow label="Course Duration" value={selectedRx.duration} />
                <DetailRow label="Date Finalized" value={formatDate(selectedRx.createdAt)} />
              </div>

              {/* Instructions Box */}
              <div className="space-y-1.5">
                <span className="block text-[9px] font-extrabold uppercase tracking-widest text-gold">
                  Dosage Instructions
                </span>
                <p className="text-xs text-navy leading-relaxed bg-gold/5 border border-gold/15 rounded-2xl p-4.5 whitespace-pre-line font-semibold shadow-3xs">
                  {selectedRx.instructions}
                </p>
              </div>

              {/* Clinical notes box */}
              {selectedRx.notes && (
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-gold">
                    Doctor's Notes
                  </span>
                  <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 flex gap-2">
                    <FileText className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500 italic leading-relaxed font-semibold pl-1">
                      {selectedRx.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer download */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/20 shrink-0">
              <button
                onClick={() =>
                  generatePrescriptionPDF({
                    patientName: user?.patientProfile
                      ? `${user.patientProfile.firstName} ${user.patientProfile.lastName}`
                      : "Patient",
                    drugName: selectedRx.drugName,
                    dosage: selectedRx.dosage,
                    frequency: selectedRx.frequency,
                    duration: selectedRx.duration,
                    instructions: selectedRx.instructions,
                    notes: selectedRx.notes,
                    issuedAt: selectedRx.createdAt,
                  })
                }
                className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Certified PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400">
        {label}
      </span>
      <span className="text-navy font-bold text-right">{value}</span>
    </div>
  );
}
