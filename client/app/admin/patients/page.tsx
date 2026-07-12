"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { Search, Phone, Mail, Users, Calendar, FileText, Activity, Edit2, Pill, CreditCard, ChevronDown, ChevronUp, Filter, ArrowUpDown, LayoutGrid, Download, Plus, X } from "lucide-react";

export default function AdminPatientsPage() {
  const [search, setSearch] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const { data: patients = [], loading } = useLiveData<any[]>(
    search ? `/patients?search=${search}` : "/patients",
    { initialData: [], intervalMs: 15000 }
  );

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCard(prev => prev === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] overflow-hidden font-inter select-none">
      
      {/* ── Sticky Top Toolbar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shrink-0 shadow-sm p-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-none">
                Patient Directory
              </h1>
              <p className="text-[12px] text-gray-500 font-medium mt-1">
                {patients.length} active records
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Name, ID, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-9 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <button onClick={() => toast.success("Filters applied")} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-[12px] hover:bg-gray-50 transition-colors shadow-sm text-[12px] font-medium shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button onClick={() => toast.success("Sorting changed")} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-[12px] hover:bg-gray-50 transition-colors shadow-sm text-[12px] font-medium shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sort</span>
              </button>
              <button onClick={() => toast.success("Export started")} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-[12px] hover:bg-gray-50 transition-colors shadow-sm text-[12px] font-medium shrink-0">
                <Download className="w-3.5 h-3.5" />
              </button>
              <Link href="/admin/patients/new" className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-[12px] font-medium shrink-0 ml-auto sm:ml-0">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Patient</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Patient Grid Viewport ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[220px] shimmer rounded-2xl bg-white border border-gray-100" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">No Patients Found</h3>
            <p className="text-[13px] text-gray-500 mt-1 max-w-sm">Try adjusting your search filters or click 'Add Patient' to create a new record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-safe">
            {patients.map((p) => {
              const isExpanded = expandedCard === p.id;
              
              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden">
                  
                  {/* Card Header (Always Visible) */}
                  <Link href={`/admin/patients/${p.id}`} className="p-4 sm:p-5 flex-1 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[16px] border border-blue-100 shrink-0">
                          {(p.firstName?.[0] || "") + (p.lastName?.[0] || "")}
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-gray-900 group-hover:text-blue-600 transition-colors">
                            {p.firstName} {p.lastName}
                          </h3>
                          <p className="text-[11px] font-mono text-gray-400 mt-0.5">ID: {p.id.substring(0,8).toUpperCase()}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[12px] mb-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{p.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{p.age ? `${p.age}y` : "—"} &bull; {p.gender?.[0] || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">Last visit: {p.lastVisit || "Never"}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Expanded Mobile Details */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 md:hidden animate-fade-in border-t border-gray-100 pt-4 bg-gray-50/50">
                      <div className="space-y-3 text-[12px]">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{p.email || "No email"}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Conditions</p>
                          <p className="text-gray-900 font-medium">{p.medicalConditions || "None reported"}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Allergies</p>
                          <p className="text-red-600 font-medium">{p.allergies || "No known allergies"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto">
                    
                    {/* Mobile Expand Toggle */}
                    <button 
                      onClick={(e) => toggleExpand(p.id, e)}
                      className="md:hidden flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-4 h-4" /> Less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> More</>
                      )}
                    </button>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1 ml-auto md:ml-0 md:w-full md:justify-around">
                      <Link href={`/admin/patients/${p.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" title="Profile">
                        <Users className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/patients/${p.id}?tab=medical-history`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip-trigger" title="Medical Record">
                        <Activity className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/patients/${p.id}?tab=prescriptions`} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip-trigger" title="Prescription">
                        <Pill className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/patients/${p.id}?tab=invoices`} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors tooltip-trigger" title="Invoice">
                        <CreditCard className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal stub for the User icon if missing
function User(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
