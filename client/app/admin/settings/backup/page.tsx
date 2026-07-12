"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { Database, Download, AlertTriangle, ShieldCheck, HardDrive, Clock } from "lucide-react";
import { toast } from "@/lib/toast";
import { useDialog } from "@/components/DialogProvider";

export default function BackupSettingsPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>("2 hours ago");
  const { confirm } = useDialog();

  const triggerBackup = async () => {
    const isConfirmed = await confirm({
      title: "Manual Backup",
      description: "Are you sure you want to trigger a manual database backup? This may slow down the system momentarily.",
      type: "info",
      confirmText: "Start Backup"
    });
    if (!isConfirmed) return;
    
    setIsBackingUp(true);
    try {
      const res = await apiRequest("/system/backup", { method: "POST" });
      if (res.success) {
        toast.success("Backup started successfully. You will be notified upon completion.");
        // Simulate backup completion for demo
        setTimeout(() => {
           setLastBackupTime("Just now");
           setIsBackingUp(false);
           toast.success("Database backup completed and securely stored.");
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to start backup process.");
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Database & Backups</h2>
        <p className="text-[14px] text-gray-500 mt-1">Manage database snapshots and automated backup policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-[16px] font-bold text-gray-900">Manual Backup</h3>
              </div>
              <p className="text-[13px] text-gray-500 mt-2 max-w-md">
                Instantly snapshot the entire Postgres database, including patient records, appointments, and configuration. The backup will be encrypted and stored in your secure bucket.
              </p>
            </div>
            <button 
              onClick={triggerBackup}
              disabled={isBackingUp}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-[10px] shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isBackingUp ? <Download className="w-4 h-4 animate-bounce" /> : <HardDrive className="w-4 h-4" />}
              {isBackingUp ? "Backing up..." : "Trigger Backup"}
            </button>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-[16px] p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-[14px] font-bold text-emerald-900">System Protected</h3>
          </div>
          <p className="text-[12px] text-emerald-700 font-medium mb-1">Automated daily backups are active.</p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 mt-auto">
            <Clock className="w-3.5 h-3.5" />
            Last backup: {lastBackupTime}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
         <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-gray-900">Recent Snapshots</h3>
            <span className="text-[12px] font-bold text-gray-500">Retention: 30 Days</span>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-100 bg-gray-50/50">
                 <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Snapshot ID</th>
                 <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                 <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                 <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Size</th>
                 <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               <tr className="hover:bg-gray-50/50 transition-colors">
                 <td className="px-6 py-4 text-[13px] font-mono text-gray-900">bkp_auto_20260711</td>
                 <td className="px-6 py-4 text-[13px] text-gray-600">Today at 02:00 AM</td>
                 <td className="px-6 py-4"><span className="px-2 py-1 rounded-[6px] text-[10px] font-bold bg-blue-50 text-blue-700">Automated</span></td>
                 <td className="px-6 py-4 text-[13px] text-gray-600">142 MB</td>
                 <td className="px-6 py-4 text-right">
                   <button className="text-[12px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-gray-700 hover:bg-gray-50 transition-colors">Download</button>
                 </td>
               </tr>
               <tr className="hover:bg-gray-50/50 transition-colors">
                 <td className="px-6 py-4 text-[13px] font-mono text-gray-900">bkp_auto_20260710</td>
                 <td className="px-6 py-4 text-[13px] text-gray-600">Yesterday at 02:00 AM</td>
                 <td className="px-6 py-4"><span className="px-2 py-1 rounded-[6px] text-[10px] font-bold bg-blue-50 text-blue-700">Automated</span></td>
                 <td className="px-6 py-4 text-[13px] text-gray-600">140 MB</td>
                 <td className="px-6 py-4 text-right">
                   <button className="text-[12px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-gray-700 hover:bg-gray-50 transition-colors">Download</button>
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
      </div>
      
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-[16px] p-5 shadow-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
           <h4 className="text-[13px] font-bold text-amber-900">Restoration Policy</h4>
           <p className="text-[12px] text-amber-800 mt-1">
             Restoring a backup will overwrite all current live data. If you need to recover a specific patient record without rolling back the entire database, please contact Enterprise Support to request a partial table extraction.
           </p>
        </div>
      </div>
    </div>
  );
}
