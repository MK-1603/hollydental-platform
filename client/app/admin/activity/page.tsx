"use client";

import { useState, useMemo } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { 
  Search, Shield, Download, Activity, CalendarDays, 
  RefreshCw, AlertTriangle, LogIn, Upload,
  User, Key, ChevronDown, Trash2, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [timeFilter, setTimeFilter] = useState("24h");
  
  const { data: rawLogs = [], loading, refetch } = useLiveData<any[]>(
    `/audit`, 
    { initialData: [], intervalMs: 30000 }
  );

  const logs = useMemo(() => {
    let result = [...rawLogs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (timeFilter !== "all") {
      const now = new Date().getTime();
      result = result.filter(log => {
        const logTime = new Date(log.createdAt).getTime();
        const diff = now - logTime;
        if (timeFilter === "24h") return diff <= 24 * 60 * 60 * 1000;
        if (timeFilter === "7d") return diff <= 7 * 24 * 60 * 60 * 1000;
        if (timeFilter === "30d") return diff <= 30 * 24 * 60 * 60 * 1000;
        return true;
      });
    }

    if (filterAction !== "all") {
      result = result.filter(l => l.action?.toLowerCase().includes(filterAction));
    }
    
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.action?.toLowerCase().includes(s) || 
        l.actorName?.toLowerCase().includes(s) ||
        l.targetType?.toLowerCase().includes(s) ||
        l.ipAddress?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [rawLogs, filterAction, searchQuery, timeFilter]);

  const getActionIcon = (action: string) => {
    const lower = action?.toLowerCase() || '';
    if (lower.includes("login")) return LogIn;
    if (lower.includes("upload")) return Upload;
    if (lower.includes("security") || lower.includes("password")) return Key;
    if (lower.includes("failed")) return AlertTriangle;
    if (lower.includes("delete")) return Trash2;
    return Activity;
  };

  return (
    <div className="min-h-full flex flex-col bg-[#F4F7FB] w-full font-inter select-none">
      
      {/* ── LUXURY HEADER ── */}
      <div className="bg-white px-4 md:px-8 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-sm md:text-base font-bold text-[#0A1628] tracking-tight font-serif leading-none truncate">Security Audit</h1>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button onClick={refetch} className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md hover:bg-[#F1F5F9] transition-all flex items-center justify-center text-[#475569] hover:text-[#0A1628]">
              <RefreshCw className={cn("w-3 h-3 md:w-3.5 md:h-3.5", loading && "animate-spin")} />
            </button>

            <button className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] bg-gradient-to-r from-[#0A1628] to-[#1a2b45] hover:opacity-90 rounded-md transition-all flex items-center justify-center shadow-md shadow-navy/20" title="Export CSV">
              <Download className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#C9A84C]" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col h-[calc(100vh-100px)]">
        
        {/* ── TOOLBAR (STICKY) ── */}
        <div className="bg-white border-b border-[#E2E8F0] p-4 flex items-center justify-between gap-3 z-30 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.02)] w-full sticky top-[72px] md:top-[88px]">
          <div className="flex w-full max-w-7xl mx-auto gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-medium text-[#0A1628] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#C9A84C]/50 transition-all outline-none"
              />
            </div>
            
            <div className="relative h-11 shrink-0">
              <Filter className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="h-full pl-9 pr-8 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0A1628] shadow-sm outline-none hover:bg-[#F8FAFC] focus:ring-2 focus:ring-[#C9A84C]/30 appearance-none cursor-pointer transition-colors"
              >
                <option value="all">All Actions</option>
                <option value="login">Logins</option>
                <option value="update">Updates</option>
                <option value="delete">Deletions</option>
                <option value="failed">Failures</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto bg-[#F4F7FB] relative">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
          
          {/* ── DESKTOP TABLE ── */}
          <div className="hidden md:block bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-y border-[#E2E8F0]">
                  <th className="py-3.5 px-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[20%]">Action</th>
                  <th className="py-3.5 px-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[25%]">Actor</th>
                  <th className="py-3.5 px-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[25%]">Target</th>
                  <th className="py-3.5 px-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[15%]">Network</th>
                  <th className="py-3.5 px-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[15%]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {logs.map((log) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <tr key={log.id} className="border-b border-[#E2E8F0]/50 hover:bg-[#F8FAFC] transition-colors group cursor-default">
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0A1628]">
                          <Icon className="w-4 h-4 text-[#64748B]" />
                          <span className="text-xs font-bold whitespace-nowrap">{log.action}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0A1628] text-[#C9A84C] flex items-center justify-center font-bold text-xs">
                            {log.actorName ? log.actorName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-[#0A1628] text-sm group-hover:text-[#C9A84C] transition-colors">{log.actorName || "System"}</p>
                            <p className="text-xs text-[#64748B] font-medium">{log.actorRole || "Automated"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="font-semibold text-[#334155]">{log.targetType || "—"}</p>
                          <p className="text-xs text-[#94A3B8] max-w-[200px] truncate">{log.targetId || "—"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="font-medium text-[#334155] font-mono text-xs">{log.ipAddress || "0.0.0.0"}</p>
                          <p className="text-xs text-[#94A3B8]">{log.userAgent ? log.userAgent.split(' ')[0] : "Unknown"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#64748B] font-medium">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#94A3B8] font-medium">
                      No audit logs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARD FEED ── */}
          <div className="md:hidden flex flex-col gap-3 pb-6">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <div key={log.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#0A1628]">
                      <Icon className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{log.action}</span>
                    </div>
                    <span className="text-xs text-[#94A3B8] font-medium">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#0A1628] text-[#C9A84C] flex items-center justify-center font-bold text-sm">
                      {log.actorName ? log.actorName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-[#0A1628] text-[15px]">{log.actorName || "System"}</p>
                      <p className="text-xs text-[#64748B] font-medium">{log.actorRole || "Automated"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] mb-0.5">Target</p>
                      <p className="text-[13px] font-semibold text-[#334155]">{log.targetType || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] mb-0.5">IP Address</p>
                      <p className="text-[12px] font-mono text-[#334155]">{log.ipAddress || "0.0.0.0"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F0]">
                <p className="text-[#94A3B8] font-medium">No audit logs found.</p>
              </div>
            )}
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
