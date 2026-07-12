"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Users, Settings, FileText, Command, Activity, CreditCard, ChevronRight } from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const items = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <Activity className="w-4 h-4 text-gray-500" /> },
    { label: "Appointments", href: "/admin/appointments", icon: <Calendar className="w-4 h-4 text-blue-500" /> },
    { label: "Patients", href: "/admin/patients", icon: <Users className="w-4 h-4 text-purple-500" /> },
    { label: "Clinical Workspace", href: "/admin/workspace", icon: <FileText className="w-4 h-4 text-emerald-500" /> },
    { label: "Billing & Invoices", href: "/admin/billing", icon: <CreditCard className="w-4 h-4 text-amber-500" /> },
    { label: "General Settings", href: "/admin/settings/general", icon: <Settings className="w-4 h-4 text-gray-500" /> },
    { label: "User Management", href: "/admin/settings/users", icon: <Users className="w-4 h-4 text-indigo-500" /> },
    { label: "Audit Logs", href: "/admin/activity", icon: <Activity className="w-4 h-4 text-red-500" /> },
  ];

  const filtered = search
    ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  const navigateTo = (href: string) => {
    setIsOpen(false);
    setSearch("");
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[16px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            className="w-full bg-transparent px-4 py-4 text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Search patients, actions, or jump to..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="hidden sm:flex items-center gap-1 shrink-0">
             <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-[6px] text-[10px] font-bold text-gray-500 font-mono">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
             <div className="py-12 text-center text-[14px] text-gray-500">
                No results found for "{search}".
             </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.href}
                  onClick={() => navigateTo(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-[8px] bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-gray-300 transition-colors">
                     {item.icon}
                  </div>
                  <span className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
