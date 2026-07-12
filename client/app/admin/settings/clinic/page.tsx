"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { RefreshCw, Save, Sliders } from "lucide-react";

export default function ClinicPreferencesPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    appointmentDuration: "30",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    patientIdPrefix: "PAT-",
    invoicePrefix: "INV-",
    prescriptionFooter: "If you experience any side effects, please contact the clinic immediately.",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h"
  });

  useEffect(() => {
    apiRequest("/settings/clinic")
      .then(res => {
        if (res && Object.keys(res).length > 0) {
          setFormData(prev => ({ ...prev, ...res }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("/settings/clinic", {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      toast.success("Clinic preferences saved successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-[13px] text-gray-500 font-medium">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Clinic Preferences</h2>
          <p className="text-[14px] text-gray-500 mt-1">Configure appointment behavior, prefixes, and default templates.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* Scheduling */}
        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <Sliders className="w-5 h-5 text-gray-400" />
            <h3 className="text-[15px] font-bold text-gray-900">Scheduling</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Default Appt. Duration</label>
              <select name="appointmentDuration" value={formData.appointmentDuration} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all appearance-none">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Working Hours (Start)</label>
              <input type="time" name="workingHoursStart" value={formData.workingHoursStart} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Working Hours (End)</label>
              <input type="time" name="workingHoursEnd" value={formData.workingHoursEnd} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
            </div>
          </div>
        </div>

        {/* Identifiers & Formats */}
        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Identifiers & Formats</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Patient ID Prefix</label>
              <input type="text" name="patientIdPrefix" value={formData.patientIdPrefix} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Invoice Prefix</label>
              <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Date Format</label>
              <select name="dateFormat" value={formData.dateFormat} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all appearance-none">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Time Format</label>
              <select name="timeFormat" value={formData.timeFormat} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all appearance-none">
                <option value="12h">12-hour (1:00 PM)</option>
                <option value="24h">24-hour (13:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Templates</h3>
          </div>
          <div className="p-6">
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Prescription Footer</label>
            <textarea 
              name="prescriptionFooter" 
              value={formData.prescriptionFooter} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all resize-none" 
            />
            <p className="text-[11px] text-gray-500 mt-1.5">This text will be appended to the bottom of all printed and emailed prescriptions.</p>
          </div>
        </div>
      </div>
      
      {/* Mobile Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 transform transition-transform">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[12px] text-[14px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
