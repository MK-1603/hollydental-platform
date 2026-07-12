"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { Building2, Camera, RefreshCw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GeneralSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    clinicName: "HollyHill Dental",
    registrationNumber: "CQC-849302",
    primaryEmail: "contact@hollyhill.com",
    primaryPhone: "+44 20 7123 4567",
    timeZone: "Europe/London",
    currency: "GBP",
    language: "en",
    streetAddress: "12 HollyHill Road",
    city: "London",
    state: "Greater London",
    postalCode: "SW1A 1AA",
    googleMapsLink: "https://maps.google.com/?q=HollyHill+Dental"
  });

  useEffect(() => {
    apiRequest("/settings/general")
      .then(res => {
        if (res && Object.keys(res).length > 0) {
          setFormData(prev => ({ ...prev, ...res }));
          setInitialData({ ...formData, ...res });
        } else {
          setInitialData(formData);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!initialData) return;
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(hasChanged);
  }, [formData, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("/settings/general", {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      setInitialData(formData);
      setIsDirty(false);
      toast.success("General settings saved successfully.");
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
    <div className="flex flex-col min-h-full pb-24 relative">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-8 py-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex flex-col justify-center">
          <h2 className="text-[18px] font-semibold text-gray-900 tracking-tight leading-none mb-1.5">General Settings</h2>
          <p className="text-[13px] text-gray-500 leading-none">Manage clinic identity, localization, and physical location.</p>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-[800px] space-y-8">
          
          {/* Clinic Profile */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-[14px] font-semibold text-gray-900">Clinic Profile</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">Basic information and branding.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-[12px] flex items-center justify-center shadow-sm overflow-hidden">
                    <Building2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-sm transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h4 className="text-[13px] font-medium text-gray-900">Clinic Logo</h4>
                  <p className="text-[12px] text-gray-500 mt-1">Recommended size: 512x512px (PNG or SVG).</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Clinic Name</label>
                  <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Registration Number</label>
                  <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Primary Email</label>
                  <input type="email" name="primaryEmail" value={formData.primaryEmail} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Primary Phone</label>
                  <input type="tel" name="primaryPhone" value={formData.primaryPhone} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Localization */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-[14px] font-semibold text-gray-900">Localization</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">Time zones, currencies, and formats.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700">Time Zone</label>
                <select name="timeZone" value={formData.timeZone} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                  <option value="Europe/London">London (GMT+1)</option>
                  <option value="America/New_York">New York (EST)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                  <option value="GBP">British Pound (£)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700">Language</label>
                <select name="language" value={formData.language} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                  <option value="en">English (UK)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-[14px] font-semibold text-gray-900">Location</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">Physical address and mapping.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700">Street Address</label>
                <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">State / Region</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Postal Code</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700">Google Maps Link</label>
                <input type="text" name="googleMapsLink" value={formData.googleMapsLink} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* STICKY SAVE BANNER */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+120px)] bg-gray-900 text-white px-6 py-4 rounded-[12px] shadow-2xl flex items-center justify-between w-[90%] max-w-[600px] z-50 animate-in slide-in-from-bottom-5">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium">You have unsaved changes</span>
            <span className="text-[12px] text-gray-400">Save your changes before leaving</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setFormData(initialData); setIsDirty(false); }}
              className="text-[13px] font-medium text-gray-300 hover:text-white transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
