"use client";

import { useEffect, useState, use } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import DentalChart from "@/components/admin/DentalChart";
import {
  User,
  HeartPulse,
  CalendarDays,
  FileText,
  FolderOpen,
  MessageSquare,
  Cpu,
  RefreshCw,
  Activity,
  ShieldAlert,
  Lock,
  ArrowLeft,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminPatientProfilePage({ params }: PageProps) {
  const { id } = use(params);

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "treatments" | "invoices" | "files" | "messages">("overview");
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
    return <div className="h-[400px] flex items-center justify-center text-xs text-gray-400">Loading patient profile files...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12 text-xs text-red-500">Patient profile not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/patients"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Patients
      </Link>
      
      {/* Patient header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        {/* Top: Avatar + Name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gold/15 border-2 border-gold text-gold flex items-center justify-center font-bold text-base sm:text-lg shadow-inner shrink-0">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-navy">
                {patient.firstName} {patient.lastName}
              </h2>
              <span className="bg-navy/5 text-navy text-[9px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase shrink-0">
                ID: {patient.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">DOB: {patient.dateOfBirth} &middot; Gender: {patient.gender}</p>
          </div>
        </div>

        {/* Action buttons — full width on mobile, inline on md+ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 pt-3 border-t border-gray-50">
          <button
            onClick={handleForcePasswordReset}
            disabled={forcing}
            className="flex-1 sm:flex-none bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Force this patient to set a new password on next sign-in"
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            {forcing ? "Working…" : "Force password reset"}
          </button>

          <button
            onClick={handleGenerateAISummary}
            disabled={generatingAi}
            className="flex-1 sm:flex-none bg-navy hover:bg-gray-800 text-white font-bold text-xs py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Cpu className="w-4 h-4 text-gold animate-pulse shrink-0" />
            {generatingAi ? "Analyzing History..." : "Generate AI Summary"}
          </button>
        </div>
      </div>

      {forceFeedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs ${
            forceFeedback.kind === "success"
              ? "border-emerald-100 bg-emerald-50/60 text-emerald-700"
              : "border-red-100 bg-red-50/60 text-red-700"
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{forceFeedback.text}</span>
        </div>
      )}

      {/* AI Summary display box */}
      {aiSummary && (
        <div className="border border-gold bg-gold/5 rounded-2xl p-5 shadow-sm animate-fade-up space-y-2">
          <h4 className="font-serif text-xs font-bold text-navy flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-gold" /> Gemini Clinical Brief (Doctor Only)
          </h4>
          <p className="text-gray-600 text-xs leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto pb-1 text-xs font-semibold text-navy">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 shrink-0 transition-all ${
            activeTab === "overview" ? "border-gold text-gold" : "border-transparent text-gray-400"
          }`}
        >
          <User className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 shrink-0 transition-all ${
            activeTab === "chart" ? "border-gold text-gold" : "border-transparent text-gray-400"
          }`}
        >
          <Activity className="w-4 h-4" /> Dental Chart
        </button>
      </div>

      {/* Content panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[300px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left details */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-bold text-navy border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold" /> Contact Information
              </h3>
              <div className="text-xs text-navy space-y-2.5 font-semibold">
                <div>
                  <span className="text-gray-400 font-normal block text-[10px]">Mobile Phone</span>
                  <span>{patient.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-normal block text-[10px]">Email Address</span>
                  <span>{patient.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-normal block text-[10px]">Home Address</span>
                  <span>{patient.address || "No address logged"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-normal block text-[10px]">Emergency Contact</span>
                  <span>{patient.emergencyContact} ({patient.emergencyPhone})</span>
                </div>
              </div>
            </div>

            {/* Right medical history */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-bold text-navy border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-red-500" /> Medical & Allergy Files
              </h3>
              <div className="text-xs text-navy space-y-2.5 font-semibold">
                <div>
                  <span className="text-gray-400 font-normal block text-[10px] text-red-500">Known Allergies</span>
                  <span className="text-red-600 font-bold">{patient.allergies || "None logged"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-normal block text-[10px]">Active Medications</span>
                  <span>{patient.medications || "None"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-normal block text-[10px]">Underlying Conditions</span>
                  <span>{patient.medicalConditions || "None"}</span>
                </div>
                {patient.notes && (
                  <div>
                    <span className="text-gray-400 font-normal block text-[10px]">Dental Office Alert Notes</span>
                    <p className="bg-gray-50 p-2.5 rounded text-[11px] font-normal italic leading-relaxed text-gray-500 mt-1">
                      {patient.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DENTAL CHART TAB */}
        {activeTab === "chart" && (
          <DentalChart patientId={patient.id} />
        )}

      </div>

    </div>
  );
}
