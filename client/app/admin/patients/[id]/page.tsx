"use client";

import { useEffect, useState, use } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import DentalChart from "@/components/admin/DentalChart";
import { User, HeartPulse, Cpu, Activity, ShieldAlert, Lock, ArrowLeft, Phone, Mail, MapPin, AlertTriangle, FileText, UserCheck, Calendar, Activity as DiagnosticIcon, CalendarDays, Pill, CreditCard, FolderOpen, Clock, Zap } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabKey = "overview" | "medical-history" | "appointments" | "prescriptions" | "invoices" | "documents" | "timeline" | "quick-actions";

export default function AdminPatientProfilePage({ params }: PageProps) {
  const { id } = use(params);

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
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
    if (id === "new") return;
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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Syncing clinical files...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px] text-red-500">
        <ShieldAlert className="w-10 h-10 mx-auto" />
        <p className="text-sm font-semibold">Patient Profile Not Found</p>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "medical-history", label: "Medical History", icon: HeartPulse },
    { key: "appointments", label: "Appointments", icon: CalendarDays },
    { key: "prescriptions", label: "Prescriptions", icon: Pill },
    { key: "invoices", label: "Invoices", icon: CreditCard },
    { key: "documents", label: "Documents", icon: FolderOpen },
    { key: "timeline", label: "Timeline", icon: Clock },
    { key: "quick-actions", label: "Quick Actions", icon: Zap },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-inter select-none">
      
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shrink-0 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <Link
            href="/admin/patients"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Patients
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100 shrink-0">
                    Active
                  </span>
                </div>
                <div className="text-gray-500 text-[12px] font-medium flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 font-mono text-[11px]">ID: {patient.id.substring(0, 8).toUpperCase()}</span>
                  <span>&bull;</span>
                  <span>{patient.dateOfBirth} ({patient.age || "?"}y)</span>
                  <span>&bull;</span>
                  <span>{patient.gender}</span>
                  {patient.bloodGroup && (
                    <>
                      <span>&bull;</span>
                      <span className="text-red-500 font-semibold flex items-center gap-1">
                        <HeartPulse className="w-3 h-3" /> {patient.bloodGroup}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <button
                onClick={handleForcePasswordReset}
                disabled={forcing}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-[12px] py-2 px-3 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                {forcing ? "Working…" : "Reset Password"}
              </button>
              <button
                onClick={handleGenerateAISummary}
                disabled={generatingAi}
                className="bg-[#0F172A] hover:bg-gray-800 text-white font-semibold text-[12px] py-2 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <Cpu className={`w-3.5 h-3.5 ${generatingAi ? "animate-spin text-blue-400" : "text-white"}`} />
                {generatingAi ? "Generating..." : "Clinical Summary"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable Tab Bar ── */}
        <div className="px-4 sm:px-6 flex gap-1 overflow-x-auto custom-scrollbar border-t border-gray-100 pt-2 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Viewport ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar pb-safe">
        
        {forceFeedback && (
          <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium shadow-sm animate-fade-in ${
              forceFeedback.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{forceFeedback.text}</span>
          </div>
        )}

        {aiSummary && (
          <div className="mb-6 border border-blue-200 bg-blue-50/50 rounded-xl p-4 shadow-sm animate-fade-up">
            <h4 className="font-semibold text-[13px] text-blue-900 flex items-center gap-1.5 mb-2">
              <Cpu className="w-4 h-4 text-blue-600" /> Auto-Generated Clinical Brief
            </h4>
            <div className="bg-white border border-blue-100 rounded-lg p-3 text-[12px] text-gray-700 leading-relaxed">
              {aiSummary}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6 min-h-[400px]">
          
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Demographics & Contact */}
              <div className="space-y-4">
                <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Contact & Demographics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0"><Phone className="w-3.5 h-3.5 text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Mobile</p>
                      <p className="text-[13px] font-medium text-gray-900">{patient.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0"><Mail className="w-3.5 h-3.5 text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Email</p>
                      <p className="text-[13px] font-medium text-gray-900">{patient.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0"><MapPin className="w-3.5 h-3.5 text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Address</p>
                      <p className="text-[13px] font-medium text-gray-900">{patient.address || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0"><UserCheck className="w-3.5 h-3.5 text-gray-500" /></div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Emergency Contact</p>
                      <p className="text-[13px] font-medium text-gray-900">{patient.emergencyContact || "—"} ({patient.emergencyPhone || "—"})</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Health Summary */}
              <div className="space-y-4">
                <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Health Summary
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${patient.allergies ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" /> Allergies
                    </p>
                    <p className={`text-[12px] font-medium ${patient.allergies ? 'text-red-700' : 'text-gray-900'}`}>
                      {patient.allergies || "No known allergies."}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gray-50 border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Active Medications</p>
                    <p className="text-[12px] font-medium text-gray-900">{patient.medications || "None reported."}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gray-50 border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Medical Conditions</p>
                    <p className="text-[12px] font-medium text-gray-900">{patient.medicalConditions || "None reported."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "medical-history" && (
            <div className="animate-fade-in space-y-6">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Dental Diagnostics Chart</h3>
              <DentalChart patientId={patient.id} />
            </div>
          )}

          {activeTab !== "overview" && activeTab !== "medical-history" && (
            <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 mb-3">
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <h4 className="text-[14px] font-semibold text-gray-900 mb-1">
                {tabs.find(t => t.key === activeTab)?.label}
              </h4>
              <p className="text-[12px] text-gray-500">
                This module is currently under development.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
