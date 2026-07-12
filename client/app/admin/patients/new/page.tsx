"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ArrowLeft, UserPlus, Phone, Mail, MapPin, HeartPulse, ShieldAlert, Save } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "Male",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    allergies: "",
    medicalConditions: "",
    medications: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields (Name, Email, Phone).");
      return;
    }

    setLoading(true);
    try {
      const response: any = await apiRequest("/patients", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast.success("Patient created successfully.");
      router.push(`/admin/patients/${response.patient.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create patient.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] overflow-hidden font-inter select-none">
      
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shrink-0 shadow-sm p-4 sm:px-6">
        <Link
          href="/admin/patients"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Patients
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 tracking-tight leading-none">
                Register New Patient
              </h1>
              <p className="text-[12px] text-gray-500 font-medium mt-1">
                Enter primary details to create a new clinical profile.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-[12px] py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {loading ? "Saving..." : "Create Patient"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Viewport ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          
          {/* General Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-500" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-500" /> Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Physical Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 custom-scrollbar" placeholder="123 Main St, City, Country" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Emergency Contact Name</label>
                <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Emergency Phone</label>
                <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="+1 (555) 999-9999" />
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-red-500" /> Medical Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Known Allergies
                </label>
                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="e.g. Penicillin, Peanuts" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Current Medications</label>
                <textarea name="medications" value={formData.medications} onChange={handleChange} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 custom-scrollbar" placeholder="List any ongoing medications..." />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase">Medical Conditions / Notes</label>
                <textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 custom-scrollbar" placeholder="Past surgeries, chronic conditions, or general clinical notes..." />
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}
