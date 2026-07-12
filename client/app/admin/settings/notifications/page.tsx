"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { Bell, RefreshCw, Save, Mail, MessageSquare, Monitor } from "lucide-react";

export default function NotificationsSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    apptReminders: true,
    emailNotifications: true,
    smsNotifications: false,
    browserNotifications: true
  });

  useEffect(() => {
    apiRequest("/settings/notifications")
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
      await apiRequest("/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      toast.success("Notification preferences saved.");
    } catch (error: any) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-[13px] text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Notifications</h2>
          <p className="text-[14px] text-gray-500 mt-1">Configure internal and patient-facing alerts.</p>
        </div>
        <button 
          onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-[15px] font-bold text-gray-900">Patient Communications</h3>
        </div>
        <div className="p-0">
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-gray-100 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">Appointment Reminders</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Automatically send reminders 24h before appt.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-2">
              <input type="checkbox" name="apptReminders" checked={formData.apptReminders} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-gray-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">Email Notifications</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Send invoices and receipts via email.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-2">
              <input type="checkbox" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-gray-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">SMS Notifications</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Send critical alerts via SMS (charges apply).</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-2">
              <input type="checkbox" name="smsNotifications" checked={formData.smsNotifications} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
