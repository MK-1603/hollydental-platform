"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Calendar, FileText, Pill, Activity, Plus } from "lucide-react";

export default function PortalGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Grouped quick actions to show when search is empty or at the bottom
  const QUICK_ACTIONS = [
    { label: "Book Appointment", icon: Calendar, href: "/portal/appointments" },
    { label: "Pay Invoice", icon: FileText, href: "/portal/invoices" },
    { label: "Request Prescription", icon: Pill, href: "/portal/prescriptions" },
    { label: "Message Clinic", icon: Activity, href: "/portal/messages" }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      // Mock patient search results
      setTimeout(() => {
        setResults([
          { id: 1, type: "Appointments", title: "Upcoming Dental Cleaning", subtitle: "Tomorrow at 10:00 AM", href: "/portal/appointments" },
          { id: 2, type: "Invoices", title: "Invoice #INV-2023-089", subtitle: "Paid - €120.00", href: "/portal/invoices" },
          { id: 3, type: "Treatments", title: "Root Canal Follow-up", subtitle: "Completed on Oct 12", href: "/portal/treatments" },
        ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.subtitle.toLowerCase().includes(query.toLowerCase())));
        setIsSearching(false);
      }, 300);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const flatResults = results;
    const totalItems = (query.length >= 2 && flatResults.length > 0) ? flatResults.length : QUICK_ACTIONS.length;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.length >= 2 && flatResults.length > 0 && flatResults[selectedIndex]) {
        router.push(flatResults[selectedIndex].href);
      } else if (QUICK_ACTIONS[selectedIndex]) {
        router.push(QUICK_ACTIONS[selectedIndex].href);
      }
      setIsFocused(false);
      setQuery("");
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (scrollRef.current && isFocused) {
      const activeEl = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isFocused]);

  const groupedResults = results.reduce((acc: Record<string, any[]>, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {});

  const showDropdown = isFocused;

  return (
    <div className="relative w-full hidden md:block" ref={containerRef}>
      <div 
        className={`flex items-center gap-3 px-4 h-[44px] border transition-all duration-200 ${
          isFocused 
            ? "bg-white border-blue-500 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] rounded-t-[14px] rounded-b-none" 
            : "bg-gray-50/80 hover:bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm shadow-sm rounded-[14px]"
        }`}
      >
        {isSearching ? (
          <Loader2 className="w-[18px] h-[18px] shrink-0 text-blue-500 animate-spin" />
        ) : (
          <Search className={`w-[18px] h-[18px] shrink-0 transition-colors ${isFocused ? "text-blue-500" : "text-gray-400"}`} />
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search your appointments, invoices, treatments..."
          className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        
        {query.length > 0 && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
        
        {!isFocused && query.length === 0 && (
          <div className="ml-auto flex items-center gap-1 shrink-0 pointer-events-none">
            <kbd className="px-2 py-1 rounded-[6px] bg-white border border-gray-200 text-[11px] font-semibold text-gray-500 shadow-sm">⌘ K</kbd>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-[14px] shadow-xl z-50 flex flex-col overflow-hidden max-h-[420px]">
          <div ref={scrollRef} className="overflow-y-auto custom-scrollbar p-1.5 flex-1">
            
            {query.length >= 2 ? (
              results.length > 0 ? (
                Object.entries(groupedResults).map(([type, items], groupIndex) => (
                  <div key={type} className="mb-2 last:mb-0">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {type}
                    </div>
                    {items.map((item, idx) => {
                      let globalIdx = 0;
                      for (let i = 0; i < groupIndex; i++) {
                        globalIdx += Object.values(groupedResults)[i].length;
                      }
                      globalIdx += idx;
                      
                      const isActive = globalIdx === selectedIndex;

                      return (
                        <button
                          key={item.id}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          onClick={() => {
                            router.push(item.href);
                            setIsFocused(false);
                            setQuery("");
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-[8px] transition-colors ${
                            isActive ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div>
                            <span className={`text-[13px] font-medium block ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-[11px] text-gray-500 block mt-0.5">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-gray-900 font-medium">No results found</p>
                  <p className="text-[11px] text-gray-500 mt-1">We couldn't find anything matching "{query}"</p>
                </div>
              )
            ) : (
              <div className="mb-1">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Quick Actions
                </div>
                {QUICK_ACTIONS.map((action, idx) => {
                  const isActive = idx === selectedIndex;
                  return (
                    <button
                      key={idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        router.push(action.href);
                        setIsFocused(false);
                      }}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-colors ${
                        isActive ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className={`p-1 rounded-md ${isActive ? "bg-blue-100 text-blue-600" : "bg-white border border-gray-200 text-gray-500"}`}>
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-medium">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-500 font-medium">Press <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-700">ESC</kbd> to close</span>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
              Navigate with <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-700">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-700">↓</kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
