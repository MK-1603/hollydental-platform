"use client";

import { useState, useMemo } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { 
  Search, Shield, Filter, Download, Activity, CalendarDays, 
  RefreshCw, AlertTriangle, AlertCircle, LogIn, Upload, ShieldAlert,
  Server, User, ArrowUpRight, Lock, Key, ChevronDown, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  
  const { data: rawLogs = [], loading, refetch } = useLiveData<any[]>(
    `/audit`, 
    { initialData: [], intervalMs: 30000 }
  );

  const logs = useMemo(() => {
    let result = [...rawLogs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filterAction !== "all") {
      result = result.filter(l => l.action?.toLowerCase().includes(filterAction));
    }
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.action?.toLowerCase().includes(s) || 
        l.actorName?.toLowerCase().includes(s) ||
        l.targetType?.toLowerCase().includes(s)
      );
      
    }
    return result;
  }, [rawLogs, filterAction, searchQuery]);

  const getActionColor = (action: string) => {
    const lower = action?.toLowerCase() || '';
    if (lower.includes("login") || lower.includes("success")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (lower.includes("delete") || lower.includes("force")) return "bg-red-50 text-red-700 border-red-200";
    if (lower.includes("update") || lower.includes("edit") || lower.includes("create")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (lower.includes("warn") || lower.includes("failed")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getActionIcon = (action: string) => {
    const lower = action?.toLowerCase() || '';
    if (lower.includes("login")) return LogIn;
    if (lower.includes("upload")) return Upload;
    if (lower.includes("security") || lower.includes("password")) return Key;
    if (lower.includes("failed")) return AlertTriangle;
    if (lower.includes("delete")) return Trash2;
    return Activity;
  };
  
  // Minimal stub for Trash2 if missing from imports above
  const Trash2 = AlertCircle; 

  const stats = {
    total: rawLogs.length,
    critical: rawLogs.filter(l => l.action?.toLowerCase().includes("delete") || l.action?.toLowerCase().includes("failed")).length,
    logins: rawLogs.filter(l => l.action?.toLowerCase().includes("login")).length,
    security: rawLogs.filter(l => l.action?.toLowerCase().includes("password") || l.action?.toLowerCase().includes("force")).length,
  };

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col bg-[#F8FAFC] w-full max-w-none overflow-hidden font-inter select-none">
      
      {/* ── TOP DASHBOARD HEADER ── */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-8 py-5 flex items-center justify-between z-40 relative shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-none mb-1">Security & Audit Logs</h1>
            <p className="text-[12px] text-gray-500 font-medium">System-wide immutable record of operational events.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={refetch} className="h-[36px] px-3 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm text-gray-600 tooltip-trigger">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          
          <div className="h-[36px] flex items-center bg-white border border-gray-200 rounded-[8px] shadow-sm px-3 text-[13px] font-medium text-gray-600">
            <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
            Last 24 Hours
            <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
          </div>

          <button className="h-[36px] px-4 bg-gray-900 hover:bg-black text-white text-[13px] font-bold rounded-[8px] transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ── STATISTICS BAR ── */}
      <div className="px-8 py-4 shrink-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100"><Activity className="w-5 h-5 text-blue-500" /></div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today's Events</p>
            <p className="text-[20px] font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white border border-red-200 rounded-[12px] p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 relative z-10"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Critical / Failed</p>
            <p className="text-[20px] font-bold text-red-900">{stats.critical}</p>
          </div>
        </div>
        <div className="bg-white border border-emerald-200 rounded-[12px] p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 relative z-10"><LogIn className="w-5 h-5 text-emerald-500" /></div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Logins</p>
            <p className="text-[20px] font-bold text-emerald-900">{stats.logins}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100"><ShieldAlert className="w-5 h-5 text-purple-500" /></div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Security Tasks</p>
            <p className="text-[20px] font-bold text-gray-900">{stats.security}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-[12px] p-4 shadow-sm hidden lg:flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><Server className="w-5 h-5 text-gray-400" /></div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">System Status</p>
            <p className="text-[14px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Healthy</p>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE (TIMELINE + TABLE) ── */}
      <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-6">
        
        {/* LEFT TIMELINE (320px) */}
        <div className="w-[320px] shrink-0 bg-white border border-gray-200 rounded-[16px] shadow-sm flex flex-col overflow-hidden hidden xl:flex">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Live Activity Feed
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0"></div>
                    <div className="flex-1 space-y-2 py-1"><div className="h-3 bg-gray-100 rounded w-full"></div><div className="h-3 bg-gray-50 rounded w-1/2"></div></div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
               <div className="text-center py-10 text-[12px] text-gray-500">No recent activity.</div>
            ) : (
              <div className="relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {logs.slice(0, 20).map((log, i) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <div key={log.id} className="relative flex items-start justify-between mb-6 group">
                      <div className="flex items-start gap-4">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-gray-500 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-gray-900 leading-snug">
                            <span className="font-bold text-indigo-700">{log.actorName || 'System'}</span> {log.action}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(log.createdAt).toLocaleTimeString()} • {log.targetType || 'System'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DATA TABLE */}
        <div className="flex-1 bg-white border border-gray-200 rounded-[16px] shadow-sm flex flex-col overflow-hidden">
          
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[260px] pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-[13px] focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm" 
                />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="py-2 px-3 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium text-gray-600 shadow-sm outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Actions</option>
                <option value="login">Logins</option>
                <option value="create">Creates</option>
                <option value="update">Updates</option>
                <option value="delete">Deletions</option>
                <option value="failed">Failures</option>
              </select>
            </div>
            <div className="text-[12px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              Showing {logs.length} events
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Timestamp</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Actor</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Action</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Target</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-16 text-center"><Activity className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-3" /><p className="text-[14px] font-medium text-gray-900">Loading audit trail...</p></td></tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-24 text-center">
                      <div className="w-24 h-24 mx-auto relative mb-6">
                        <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-xl"></div>
                        <div className="relative w-full h-full bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center">
                          <Shield className="w-10 h-10 text-emerald-500" />
                        </div>
                      </div>
                      <h3 className="text-[18px] font-bold text-gray-900 tracking-tight">No events found</h3>
                      <p className="text-[13px] text-gray-500 mt-1 max-w-sm mx-auto">No audit logs match your current search and filter criteria. The system is secure.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-gray-900">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[11px] font-medium text-gray-500 mt-0.5">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-[11px] font-bold border border-indigo-100 shrink-0">
                            {log.actorName ? log.actorName[0].toUpperCase() : (log.actorRole === 'system' ? 'S' : '?')}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-900">{log.actorName || (log.actorRole === 'system' ? 'System Service' : 'Unknown')}</p>
                            <p className="text-[11px] font-medium text-gray-500">{log.actorEmail || 'Automated Task'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider border", getActionColor(log.action))}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.targetType ? (
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-gray-900 capitalize flex items-center gap-1.5">
                              {log.targetType}
                              <ArrowUpRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-blue-600" />
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 mt-0.5">{log.targetId?.substring(0,8) || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-[13px] font-medium text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-mono font-medium text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 inline-block w-fit">
                            {log.ip || 'Local/Internal'}
                          </span>
                          <span className="text-[11px] font-medium text-gray-400 truncate max-w-[200px] mt-1" title={log.userAgent}>
                            {log.userAgent || 'No User Agent recorded'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
