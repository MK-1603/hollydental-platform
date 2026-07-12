"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { Shield, RefreshCw, Save, MonitorSmartphone } from "lucide-react";

export default function SecuritySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    twoFactorEnabled: true,
    minPasswordLength: "12",
    sessionTimeout: "30"
  });

  useEffect(() => {
    apiRequest("/settings/security")
      .then(res => {
        if (res && Object.keys(res).length > 0) {
          setFormData(prev => ({ ...prev, ...res }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: any) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("/settings/security", {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      toast.success("Security settings saved successfully.");
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
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Security</h2>
          <p className="text-[14px] text-gray-500 mt-1">Manage authentication policies and active sessions.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <h3 className="text-[15px] font-bold text-gray-900">Authentication</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-bold text-gray-900">Two-Factor Authentication (2FA)</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Require a second verification step for all admins.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="twoFactorEnabled" checked={formData.twoFactorEnabled} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="h-px bg-gray-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Minimum Password Length</label>
                <select name="minPasswordLength" value={formData.minPasswordLength} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all appearance-none">
                  <option value="8">8 characters</option>
                  <option value="12">12 characters (Recommended)</option>
                  <option value="16">16 characters</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Session Timeout</label>
                <select name="sessionTimeout" value={formData.sessionTimeout} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all appearance-none">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Active Sessions</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Manage devices currently logged in to the admin panel.</p>
            </div>
            <button className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-[8px] text-[12px] font-bold transition-colors shadow-sm">
              Logout Other Devices
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 border border-blue-200 bg-blue-50/50 rounded-[12px]">
              <MonitorSmartphone className="w-8 h-8 text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-bold text-gray-900">Windows • Chrome</p>
                <p className="text-[12px] text-gray-500">Current Session • IP: 192.168.1.1</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-[6px] text-[10px] font-bold">Active Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
