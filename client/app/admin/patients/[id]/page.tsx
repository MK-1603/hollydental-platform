"use client";

import { useEffect, useState, use } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import DentalChart from "@/components/admin/DentalChart";
import {
  User,
  HeartPulse,
  Cpu,
  Activity,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  FileText,
  UserCheck,
  Activity as DiagnosticIcon
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminPatientProfilePage({ params }: PageProps) {
  const { id } = use(params);

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chart">("overview");
  const [aiSummary, setAiSummary] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  const [forcing, setForcing] = useState(false);
  const [forceFeedback, setForceFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchPatientProfile();
  }, [id]);

  const fetchPatientProfile = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/patients/${id}`);
      setPatient(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setGeneratingAi(true);
    setAiSummary("");
    try {
      const data = await apiRequest(`/patients/${id}/summary`);
      setAiSummary(data.summary);
    } catch (error) {
      setAiSummary("Failed to generate clinical brief. Verify Gemini configuration.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleForcePasswordReset = async () => {
    if (!patient?.userId) {
      setForceFeedback({
        kind: "error",
        text: "Couldn't locate this patient's login account.",
      });
      return;
    }
    const reason = window.prompt(
      "Optional note for the audit log (why is the password being reset?)"
    );
    if (reason === null) return;
    setForcing(true);
    setForceFeedback(null);
    try {
      await apiRequest(`/admin/users/${patient.userId}/force-password-change`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
      setForceFeedback({
        kind: "success",
        text: "Patient will be required to set a new password on next sign in.",
      });
    } catch (err: any) {
      setForceFeedback({
        kind: "error",
        text: err?.message || "Failed to enforce password reset.",
      });
    } finally {
      setForcing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-semibold tracking-wider">Syncing clinical files...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px] text-red-500">
        <ShieldAlert className="w-10 h-10 mx-auto" />
        <p className="text-sm font-bold">Patient Profile Not Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      
      {/* ── Breadcrumbs ── */}
      <Link
        href="/admin/patients"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-navy transition-colors select-none group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Patients Directory
      </Link>
      
      {/* ── Patient Profile Header Card ── */}
      <div className="bg-white border border-gray-200/60 rounded-3xl p-5 md:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gold/10 border-2 border-gold/15 text-gold-dark flex items-center justify-center font-bold text-lg sm:text-xl shadow-inner shrink-0">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy leading-tight">
                  {patient.firstName} {patient.lastName}
                </h2>
                <span className="bg-navy text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border border-white/5">
                  ID: {patient.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="text-gray-400 text-xs font-semibold flex items-center gap-2 flex-wrap">
                <span>DOB: <span className="text-navy font-bold">{patient.dateOfBirth}</span></span>
                <span>&bull;</span>
                <span>Gender: <span className="text-navy font-bold">{patient.gender}</span></span>
                {patient.age && (
                  <>
                    <span>&bull;</span>
                    <span>Age: <span className="text-navy font-bold">{patient.age}</span></span>
                  </>
                )}
                {patient.bloodGroup && (
                  <>
                    <span>&bull;</span>
                    <span>Blood Group: <span className="text-red-500 font-bold">{patient.bloodGroup}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons drawer */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 border-t border-gray-50 pt-4 md:pt-0 md:border-none">
            <button
              onClick={handleForcePasswordReset}
              disabled={forcing}
              className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Force patient to change password"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              {forcing ? "Working…" : "Reset Password"}
            </button>

            <button
              onClick={handleGenerateAISummary}
              disabled={generatingAi}
              className="bg-navy hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Cpu className={`w-4 h-4 text-gold ${generatingAi ? "animate-spin" : "animate-pulse"} shrink-0`} />
              {generatingAi ? "Analyzing files..." : "Gemini AI Summary"}
            </button>
          </div>
        </div>
      </div>

      {forceFeedback && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3.5 text-xs animate-fade-in shadow-2xs ${
            forceFeedback.kind === "success"
              ? "border-emerald-100 bg-emerald-50/60 text-emerald-700"
              : "border-red-100 bg-red-50/60 text-red-700"
          }`}
        >
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-bold">{forceFeedback.text}</span>
        </div>
      )}

      {/* ── AI Summary Monospace display block ── */}
      {aiSummary && (
        <div className="border border-gold bg-gold/5 rounded-3xl p-5 shadow-xs animate-fade-up space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none" />
          <h4 className="font-serif text-xs font-bold text-navy flex items-center gap-2 relative">
            <Cpu className="w-4 h-4 text-gold" /> Gemini Clinical Telemetry Brief (Principal Dentist View)
          </h4>
          <p className="text-gray-600 text-xs leading-relaxed relative bg-white/50 border border-gold/10 p-3.5 rounded-xl">
            {aiSummary}
          </p>
        </div>
      )}

      {/* ── Custom Tab Workspace Navigation ── */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto pb-1 text-xs font-bold text-navy">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === "overview" ? "border-gold text-gold" : "border-transparent text-gray-400 hover:text-navy"
          }`}
        >
          <User className="w-4 h-4" /> Demographics & Records
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 shrink-0 transition-all cursor-pointer ${
            activeTab === "chart" ? "border-gold text-gold" : "border-transparent text-gray-400 hover:text-navy"
          }`}
        >
          <DiagnosticIcon className="w-4 h-4" /> Dental Diagnostics Chart
        </button>
      </div>

      {/* ── Workspace Content Panel ── */}
      <div className="bg-white border border-gray-200/60 rounded-3xl p-6 shadow-xs min-h-[360px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Contact Details */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-extrabold text-navy border-b border-gray-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-gold" /> Demographics & Contacts
              </h3>
              
              <div className="grid grid-cols-1 gap-3 text-xs text-navy font-semibold">
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Phone className="w-4 h-4 text-gold shrink-0" />
                  <div className="min-w-0">
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Mobile Contact</span>
                    <a href={`tel:${patient.phone}`} className="text-navy hover:text-gold transition-colors truncate block">{patient.phone}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  <div className="min-w-0">
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Email Address</span>
                    <a href={`mailto:${patient.email}`} className="text-navy hover:text-gold transition-colors truncate block">{patient.email}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <MapPin className="w-4 h-4 text-gold shrink-0" />
                  <div className="min-w-0">
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Home Address</span>
                    <span className="text-navy truncate block">{patient.address || "No address logged"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <UserCheck className="w-4 h-4 text-gold shrink-0" />
                  <div className="min-w-0">
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Emergency Contact</span>
                    <span className="text-navy truncate block">{patient.emergencyContact || "—"} ({patient.emergencyPhone || "—"})</span>
                  </div>
                </div>

                {patient.age && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                    <Calendar className="w-4 h-4 text-gold shrink-0" />
                    <div className="min-w-0">
                      <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Patient Age</span>
                      <span className="text-navy truncate block">{patient.age} years old</span>
                    </div>
                  </div>
                )}

                {patient.bloodGroup && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                    <HeartPulse className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Blood Group</span>
                      <span className="text-navy font-bold truncate block">{patient.bloodGroup}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Medical Telemetry */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-extrabold text-navy border-b border-gray-100 pb-2 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-500" /> Allergies & Medical Ledger
              </h3>
              
              <div className="space-y-3.5 text-xs text-navy font-semibold">
                {/* Allergies - warning highlight */}
                <div className={`p-3.5 rounded-xl border ${patient.allergies ? "bg-red-50/60 border-red-200 text-red-700" : "bg-gray-50/50 border-gray-100"}`}>
                  <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" /> Critical Allergies
                  </span>
                  <p className="mt-1 font-bold text-xs">{patient.allergies || "No active allergies logged."}</p>
                </div>

                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Active Medications</span>
                  <p className="mt-1 text-navy font-bold text-xs">{patient.medications || "None"}</p>
                </div>

                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Underlying Medical Conditions</span>
                  <p className="mt-1 text-navy font-bold text-xs">{patient.medicalConditions || "None logged"}</p>
                </div>

                {patient.notes && (
                  <div className="p-3.5 bg-gold/5 border border-gold/15 rounded-xl">
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase tracking-wider">Dental Alert Notes</span>
                    <p className="mt-1 italic leading-relaxed text-gray-500 font-medium text-xs">
                      "{patient.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DENTAL DIAGNOSTIC CHART TAB */}
        {activeTab === "chart" && (
          <div className="animate-fade-in">
            <DentalChart patientId={patient.id} />
          </div>
        )}

      </div>

    </div>
  );
}
