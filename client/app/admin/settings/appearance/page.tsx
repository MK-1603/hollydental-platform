"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Brush, Monitor, Sun, Moon, Maximize, Check } from "lucide-react";

export default function AppearanceSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: "system",
    primaryColor: "blue",
    sidebarMode: "expanded",
    fontScale: "medium",
    cardDensity: "comfortable",
    borderRadius: "16px",
    reducedMotion: false,
    animations: true,
  });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiRequest("/settings/appearance");
      if (Object.keys(data).length > 0) {
        setSettings(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async (newSettings = settings) => {
    setIsSaving(true);
    try {
      await apiRequest("/settings/appearance", {
        method: "PUT",
        body: JSON.stringify(newSettings),
      });
      toast.success("Appearance settings updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    handleSave(updated); // Autosave
  };

  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Appearance</h2>
        <p className="text-[14px] text-gray-500 mt-1">Customize the enterprise UI to match your practice brand.</p>
      </div>

      <div className="space-y-8">
        {/* Theme */}
        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <Brush className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Color Theme</h3>
              <p className="text-[13px] text-gray-500">Select your preferred color mode.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "light", label: "Light Mode", icon: Sun, desc: "Classic bright UI" },
                { id: "dark", label: "Dark Mode", icon: Moon, desc: "Easy on the eyes" },
                { id: "system", label: "System Sync", icon: Monitor, desc: "Follows OS setting" }
              ].map((theme) => {
                const isActive = settings.theme === theme.id;
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.id}
                    onClick={() => updateSetting("theme", theme.id)}
                    className={`flex flex-col items-start p-4 rounded-[12px] border-2 text-left transition-all relative ${
                      isActive ? "border-blue-600 bg-blue-50/50" : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <h4 className={`text-[14px] font-bold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>{theme.label}</h4>
                    <p className={`text-[12px] mt-1 ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>{theme.desc}</p>
                    {isActive && (
                      <div className="absolute top-4 right-4 text-blue-600">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Layout Density */}
        <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <Maximize className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Layout & Density</h3>
              <p className="text-[13px] text-gray-500">Adjust how much information fits on screen.</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Sidebar Mode</h4>
                <p className="text-[13px] text-gray-500 max-w-md mt-1">Shrink the main navigation to icons only, saving horizontal screen space for clinical charts.</p>
              </div>
              <select 
                value={settings.sidebarMode}
                onChange={(e) => updateSetting("sidebarMode", e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="expanded">Expanded (Default)</option>
                <option value="compact">Compact (Icons Only)</option>
              </select>
            </div>
            
            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Font Scale</h4>
                <p className="text-[13px] text-gray-500 max-w-md mt-1">Adjust global text size for better readability.</p>
              </div>
              <select 
                value={settings.fontScale}
                onChange={(e) => updateSetting("fontScale", e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Card Density</h4>
                <p className="text-[13px] text-gray-500 max-w-md mt-1">Control the internal padding of interface cards.</p>
              </div>
              <select 
                value={settings.cardDensity}
                onChange={(e) => updateSetting("cardDensity", e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable (Default)</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
            
            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Border Radius</h4>
                <p className="text-[13px] text-gray-500 max-w-md mt-1">Change how rounded corners appear on buttons and cards.</p>
              </div>
              <select 
                value={settings.borderRadius}
                onChange={(e) => updateSetting("borderRadius", e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0px">Square (0px)</option>
                <option value="8px">Subtle (8px)</option>
                <option value="16px">Rounded (16px)</option>
                <option value="24px">Pill (24px)</option>
              </select>
            </div>
            
            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">UI Animations</h4>
                <p className="text-[13px] text-gray-500 max-w-md mt-1">Enable micro-interactions and transitions.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.animations}
                  onChange={(e) => updateSetting("animations", e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900">Reduced Motion</h4>
                <p className="text-[13px] text-gray-500 max-w-md mt-1">Disable animations and transitions across the enterprise platform to improve performance on older devices.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.reducedMotion}
                  onChange={(e) => updateSetting("reducedMotion", e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Save Indicator (though it autosaves, good for feedback) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 transform transition-transform">
         <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-gray-700">Settings Autosaved</span>
            {isSaving && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>}
            {!isSaving && <Check className="w-5 h-5 text-emerald-500" />}
         </div>
      </div>
    </div>
  );
}
