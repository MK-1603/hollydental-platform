"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Server, Cpu, Database, Activity, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

export default function SystemSettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/system/health");
      setHealth(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">System Health</h2>
          <p className="text-[14px] text-gray-500 mt-1">Live metrics and performance monitoring for the enterprise backend.</p>
        </div>
        <button 
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-700">Status</h3>
          </div>
          <p className="text-[24px] font-black text-gray-900 tracking-tight capitalize">{health?.status || "Loading..."}</p>
          <p className="text-[12px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online and healthy
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <Server className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-700">Uptime</h3>
          </div>
          <p className="text-[24px] font-black text-gray-900 tracking-tight">{health ? formatUptime(health.uptimeSeconds) : "--"}</p>
          <p className="text-[12px] text-gray-500 mt-1">Since last restart</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-700">Memory (Heap)</h3>
          </div>
          <p className="text-[24px] font-black text-gray-900 tracking-tight">{health?.memoryUsage?.heapUsed || 0} <span className="text-[16px] text-gray-500 font-medium">MB</span></p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(((health?.memoryUsage?.heapUsed || 0) / (health?.memoryUsage?.heapTotal || 1)) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
              <Cpu className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-700">System Load</h3>
          </div>
          <p className="text-[24px] font-black text-gray-900 tracking-tight">{Number(health?.loadAvg?.[0] || 0).toFixed(2)}</p>
          <p className="text-[12px] text-gray-500 mt-1">{health?.cpus || 1} Cores Available</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden mb-8">
         <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Environment Details</h3>
         </div>
         <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Node.js Version</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono">{health?.nodeVersion || "--"}</p>
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Platform</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono capitalize">{health?.platform || "--"}</p>
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">System Memory</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono">{health?.systemMemory?.usedGb || "--"} / {health?.systemMemory?.totalGb || "--"} GB</p>
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Process RSS</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono">{health?.memoryUsage?.rss || "--"} MB</p>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
         <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-900">Infrastructure Services</h3>
            <span className={`px-2 py-1 text-[11px] font-bold rounded-full border ${health?.redis?.status === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              Redis {health?.redis?.status || "Unknown"}
            </span>
         </div>
         <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cache Memory</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono">{health?.redis?.memoryUsage || "--"}</p>
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cached Keys</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono">{health?.redis?.keyCount || 0}</p>
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Backup Queue</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono capitalize">{health?.workers?.backupQueue || "Idle"}</p>
               </div>
               <div>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Queue</p>
                 <p className="text-[14px] font-medium text-gray-900 font-mono capitalize">{health?.workers?.emailQueue || "Idle"}</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
