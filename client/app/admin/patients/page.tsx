"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Eye,
  ClipboardList,
  Phone,
  Mail,
  Users,
  Sparkles,
  ShieldCheck,
  UserCheck
} from "lucide-react";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = () => {
    setLoading(true);
    const path = search ? `/patients?search=${search}` : "/patients";
    apiRequest(path)
      .then((data) => setPatients(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden select-none">
      
      {/* ── Header Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-gold" />
            </div>
            Patient Directory
          </h1>
          <p className="text-gray-400 text-xs mt-1 ml-10.5 hidden sm:block">
            Review registered client profiles, contact metrics, and clinical status.
          </p>
        </div>

        {/* Rapid Stat Overview Badges */}
        <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
          <div className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-xl text-[10px] font-bold text-navy">
            <UserCheck className="w-3.5 h-3.5 text-gold" />
            <span>Total: <span className="font-extrabold text-gold">{patients.length}</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-navy/5 border border-navy/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-navy">
            <ShieldCheck className="w-3.5 h-3.5 text-navy" />
            <span>Audited Files</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Panel ── */}
      <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-3.5 shrink-0">
        <div className="flex gap-4 items-center justify-between max-w-7xl mx-auto w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name, email, phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-gold rounded-xl pl-10 pr-4 py-2 text-xs text-navy placeholder:text-gray-400 focus:outline-none transition-all shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ── Content Body Viewport ── */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/30 p-6">
        <div className="max-w-7xl mx-auto w-full">
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 shimmer rounded-2xl bg-white border border-gray-100" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-white border border-gray-100 shadow-xs rounded-2xl p-16 text-center max-w-md mx-auto mt-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
                <ClipboardList className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="font-serif text-base font-extrabold text-navy">No Patients Found</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mx-auto">
                No patient profiles correspond to your current directory query parameters or keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className="group bg-white border border-gray-200/50 hover:border-gold rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-52 relative overflow-hidden"
                >
                  {/* Subtle background glow */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

                  <div>
                    {/* Header: Initial Avatar & Name */}
                    <div className="flex items-center gap-3.5 mb-4 relative">
                      <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center font-bold text-sm shrink-0 border border-gold/15 shadow-inner">
                        {(p.firstName?.[0] || "") + (p.lastName?.[0] || "")}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm font-extrabold text-navy truncate group-hover:text-gold transition-colors duration-250">
                          {p.firstName} {p.lastName}
                        </h3>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest bg-navy/5 text-navy font-bold px-2 py-0.5 rounded-full inline-block mt-1 border border-navy/10">
                          File active
                        </span>
                      </div>
                    </div>

                    {/* Body: Patient contact details */}
                    <div className="space-y-2 text-xs text-gray-500 mb-4 border-t border-gray-50 pt-3.5">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                        <a href={`tel:${p.phone}`} className="text-navy hover:text-gold transition-colors font-semibold truncate">
                          {p.phone || "—"}
                        </a>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                        <a href={`mailto:${p.email}`} className="text-navy hover:text-gold transition-colors font-semibold truncate" title={p.email}>
                          {p.email || "—"}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* CTA Footer Action */}
                  <div className="shrink-0">
                    <Link
                      href={`/admin/patients/${p.id}`}
                      className="w-full text-center bg-navy group-hover:bg-gold text-white group-hover:text-navy font-bold py-2.5 rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none shadow-xs border border-transparent"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Clinical Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
