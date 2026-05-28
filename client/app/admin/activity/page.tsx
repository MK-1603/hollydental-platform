"use client";

import { useMemo, useState, Fragment } from "react";
import { useLiveData } from "@/lib/useLiveData";
import {
  Activity as ActivityIcon,
  Search,
  RefreshCw,
  ShieldAlert,
  Filter,
  Globe,
  User,
  Terminal,
  Clock,
  Eye,
  ChevronDown,
  Info
} from "lucide-react";

interface AuditEntry {
  id: string;
  actorId: string | null;
  actorRole: "admin" | "patient" | "system" | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

function normalize(raw: any): AuditEntry[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.logs)) return raw.logs;
  return [];
}

const QUICK_FILTERS: { label: string; value: string }[] = [
  { label: "All Logs", value: "" },
  { label: "Sign-ins", value: "auth.login" },
  { label: "Password Resets", value: "admin.user.password.reset" },
  { label: "Failed Sign-ins", value: "auth.login.failure" },
  { label: "Appointments", value: "appointment." },
  { label: "Messages", value: "message." },
];

function getActionBadge(action: string) {
  if (action.includes("success") || action.includes("create") || action.includes("save") || action.includes("publish")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (action.includes("failure") || action.includes("error") || action.includes("delete") || action.includes("remove")) {
    return "bg-red-50 text-red-700 border-red-100";
  }
  if (action.includes("reset") || action.includes("update") || action.includes("change")) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }
  return "bg-navy/5 text-navy border-navy/10";
}

function getRoleBadge(role: AuditEntry["actorRole"]) {
  switch (role) {
    case "admin":
      return "bg-navy text-white shadow-xs border border-navy/20";
    case "patient":
      return "bg-gold/10 text-gold-dark border border-gold/20";
    case "system":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-gray-50 text-gray-500 border border-gray-100";
  }
}

export default function AdminActivityLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (actionFilter) params.set("action", actionFilter);
    if (search.trim()) params.set("search", search.trim());
    return `/admin/audit-logs?${params.toString()}`;
  }, [actionFilter, search]);

  const { data: rows = [], loading, error, refetch } = useLiveData<AuditEntry[]>(path, {
    intervalMs: 15000,
    select: normalize,
    initialData: [],
  });

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      
      {/* ── Header Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
              <ActivityIcon className="w-4 h-4 text-gold" />
            </div>
            Activity Log
          </h1>
          <p className="text-gray-400 text-xs mt-1 ml-10.5 hidden sm:block">
            Real-time track of security-sensitive events across the clinic.
          </p>
        </div>
        
        <button
          type="button"
          onClick={refetch}
          className="bg-white hover:bg-gray-50 text-navy border border-gray-200 hover:border-navy font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold" : ""}`} /> 
          Refresh Logs
        </button>
      </div>

      {/* ── Control panel ── */}
      <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-3.5 shrink-0">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between max-w-7xl mx-auto w-full">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action keyword, target, or metadata notes..."
              className="w-full bg-white border border-gray-200 focus:border-gold rounded-xl pl-10 pr-4 py-2 text-xs text-navy placeholder:text-gray-400 focus:outline-none transition-all shadow-xs"
            />
          </div>
          
          {/* Action Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-gold" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">Filter:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-navy font-bold cursor-pointer transition-all shadow-xs focus:outline-none focus:border-gold"
            >
              {QUICK_FILTERS.map((qf) => (
                <option key={qf.value} value={qf.value}>
                  {qf.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table viewport ── */}
      <div className="flex-1 min-h-0 overflow-hidden bg-gray-50/30 p-6 flex flex-col">
        <div className="max-w-7xl w-full mx-auto bg-white border border-gray-200 shadow-xs rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
          
          {error && (
            <div className="m-4 rounded-xl border border-red-100 bg-red-50/60 text-red-700 px-4 py-3 text-xs flex items-center gap-3 animate-fade-in shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <span className="font-semibold">Failed to fetch the activity stream. Check connection or credentials.</span>
            </div>
          )}

          {loading && rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Syncing audit records...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 text-gray-400">
              <Terminal className="w-8 h-8 text-gray-200" />
              <p className="text-xs font-semibold text-navy">No Audit Trails Found</p>
              <p className="text-[11px]">No activity matches the current query or search parameters.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs min-w-[900px] border-collapse table-layout-fixed">
                <thead className="bg-gray-50/95 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200 shadow-xs">
                  <tr>
                    <th className="text-left px-6 py-4 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gold" /> When</span>
                    </th>
                    <th className="text-left px-6 py-4 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gold" /> Actor</span>
                    </th>
                    <th className="text-left px-6 py-4 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-gold" /> Action</span>
                    </th>
                    <th className="text-left px-6 py-4 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                      Target
                    </th>
                    <th className="text-left px-6 py-4 text-[9px] font-extrabold uppercase tracking-widest text-gray-400">
                      <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gold" /> Source</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {rows.map((r) => {
                    const isExpanded = expandedId === r.id;
                    return (
                      <Fragment key={r.id}>
                        <tr
                          className={`hover:bg-gray-50/50 transition-colors align-top cursor-pointer ${
                            isExpanded ? "bg-gold/5" : ""
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        >
                          {/* Date/Time column */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-gray-500 font-semibold">
                            {new Date(r.createdAt).toLocaleString("en-IE", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true
                            })}
                          </td>

                          {/* Actor column */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getRoleBadge(r.actorRole)}`}>
                              {r.actorRole || "system"}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-mono mt-1 select-all">
                              {r.actorId ? `ID: ${r.actorId.substring(0, 8)}` : "—"}
                            </span>
                          </td>

                          {/* Action column */}
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${getActionBadge(r.action)}`}>
                                {r.action}
                              </span>
                              {r.metadata && Object.keys(r.metadata).length > 0 && (
                                <span
                                  className="text-[9px] text-gold hover:text-gold-dark font-extrabold flex items-center gap-1 mt-1 cursor-pointer select-none"
                                >
                                  <Eye className="w-3 h-3" />
                                  {isExpanded ? "Collapse Details" : "View JSON Details"}
                                  <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Target column */}
                          <td className="px-6 py-4.5 text-[11px]">
                            {r.targetType ? (
                              <div className="space-y-0.5">
                                <span className="block text-navy font-bold uppercase tracking-wider text-[9px] bg-slate-100/50 border border-slate-200/40 rounded px-1.5 py-0.5 inline-block">
                                  {r.targetType}
                                </span>
                                <span className="block text-[10px] text-gray-400 font-mono select-all">
                                  {r.targetId ? `ID: ${r.targetId.substring(0, 8)}` : "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300 font-medium">—</span>
                            )}
                          </td>

                          {/* Source/IP column */}
                          <td className="px-6 py-4.5 text-[11px] text-gray-500">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 font-semibold text-navy">
                                {r.ip || "—"}
                              </span>
                              {r.userAgent && (
                                <span
                                  title={r.userAgent}
                                  className="block text-[9px] text-gray-400 font-medium truncate max-w-[200px]"
                                >
                                  {r.userAgent}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Collapsible Details Row */}
                        {isExpanded && r.metadata && (
                          <tr className="bg-gold/5/20 border-b border-gray-100">
                            <td colSpan={5} className="px-6 py-4 animate-fade-in">
                              <div className="bg-navy border border-navy/25 rounded-xl p-4 shadow-inner space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-gold uppercase tracking-wider font-extrabold border-b border-white/5 pb-2 select-none">
                                  <Info className="w-4 h-4" /> Log Metadata Payload
                                </div>
                                <pre className="text-[10px] font-mono text-gray-300 overflow-auto max-h-60 leading-relaxed no-scrollbar pt-1 select-all whitespace-pre-wrap break-all">
                                  {JSON.stringify(r.metadata, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
