"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, RefreshCw, ShieldCheck, Clock, Monitor } from "lucide-react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function MyAccountPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: "Roghay",
    lastName: "Alizadeh",
    email: "dr.roghay@hollyhill.com",
    phone: "+353 87 123 4567",
    qualification: "BDS, MFDS",
    specialization: "Cosmetic & Restorative Dentistry",
    registrationNumber: "IDC-123456",
    language: "en",
    timezone: "Europe/Dublin",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!initialData) return;
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(hasChanged);
  }, [formData, initialData]);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest("/settings/profile");
      if (data && Object.keys(data).length > 0) {
        setFormData(prev => ({ ...prev, ...data }));
        setInitialData({ ...formData, ...data });
      } else {
        setInitialData(formData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("/settings/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      setInitialData(formData);
      setIsDirty(false);
      toast.success("Profile updated successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8 text-[13px] text-gray-500 font-medium">Loading profile...</div>;
  }

  return (
    <div className="flex flex-col min-h-full pb-24 relative">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-8 py-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex flex-col justify-center">
          <h2 className="text-[18px] font-semibold text-gray-900 tracking-tight leading-none mb-1.5">My Account</h2>
          <p className="text-[13px] text-gray-500 leading-none">Manage your personal profile and preferences.</p>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-[800px] space-y-8">
          
          {/* Profile Info */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
               <User className="w-4 h-4 text-gray-500" />
               <h3 className="text-[14px] font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[12px] bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-[24px] font-bold shrink-0">
                     RA
                  </div>
                  <div>
                     <button className="px-4 py-1.5 border border-gray-200 rounded-[8px] text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                       Change Photo
                     </button>
                     <p className="text-[12px] text-gray-500 mt-2">JPG or PNG, max 2MB.</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">First Name</label>
                   <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Last Name</label>
                   <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Email Address</label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                   </div>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Phone Number</label>
                   <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
               <ShieldCheck className="w-4 h-4 text-gray-500" />
               <h3 className="text-[14px] font-semibold text-gray-900">Professional Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2 space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Specialization</label>
                   <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
               </div>
               <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Qualifications</label>
                   <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
               </div>
               <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Registration Number</label>
                   <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
               </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
               <Clock className="w-4 h-4 text-gray-500" />
               <h3 className="text-[14px] font-semibold text-gray-900">Preferences</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Language</label>
                   <select name="language" value={formData.language} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                      <option value="en">English (UK)</option>
                      <option value="es">Español</option>
                   </select>
               </div>
               <div className="space-y-1.5">
                   <label className="text-[12px] font-medium text-gray-700">Timezone</label>
                   <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                      <option value="Europe/Dublin">Dublin, London (GMT/IST)</option>
                      <option value="America/New_York">New York (EST)</option>
                   </select>
               </div>
            </div>
          </div>

          {/* Security & Sessions */}
          <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
               <Lock className="w-4 h-4 text-gray-500" />
               <h3 className="text-[14px] font-semibold text-gray-900">Security</h3>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                 <div>
                   <h4 className="text-[13px] font-medium text-gray-900">Change Password</h4>
                   <p className="text-[12px] text-gray-500 mt-1">Update your login password regularly.</p>
                 </div>
                 <button className="px-4 py-1.5 border border-gray-200 rounded-[8px] text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                   Update Password
                 </button>
               </div>

               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                 <div>
                   <h4 className="text-[13px] font-medium text-gray-900">Two-Factor Authentication (2FA)</h4>
                   <p className="text-[12px] text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                 </div>
                 <button className="px-4 py-1.5 border border-gray-200 rounded-[8px] text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                   Enable 2FA
                 </button>
               </div>

               <div>
                 <h4 className="text-[13px] font-medium text-gray-900 mb-3">Active Sessions</h4>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-[8px] border border-gray-100">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-white rounded-md border border-gray-200 text-gray-500">
                          <Monitor className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="text-[12px] font-medium text-gray-900">Windows 11 • Chrome <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-[4px] ml-2">Current</span></p>
                         <p className="text-[11px] text-gray-500 mt-0.5">Dublin, Ireland • 192.168.1.1</p>
                       </div>
                     </div>
                   </div>
                 </div>
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
