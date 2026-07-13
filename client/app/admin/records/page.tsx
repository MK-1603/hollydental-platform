"use client";

import { useState, useEffect, useRef } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { Search, Filter, ChevronRight, FileText, Calendar, Activity, Pill, Paperclip, Download, Plus, Clock, Stethoscope, AlertCircle, ArrowLeft, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { generateTablePDF } from "@/lib/pdf";

export default function MedicalRecordsPage() {
  const { data: rawPatients, loading: isPatientsLoading, error: patientsError } = useLiveData<any[]>("/records", {
    initialData: [],
    intervalMs: 60000
  });

  const [activePatient, setActivePatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Realtime debounce logic
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  const patientsList = rawPatients?.filter(p => 
    p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
    p.displayId.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) || [];

  // Desktop auto-select logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !activePatient && patientsList.length > 0) {
        setActivePatient(patientsList[0].id);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [patientsList, activePatient]);

  const { data: timelineData, loading: isTimelineLoading } = useLiveData<any[]>(
    activePatient ? `/records/${activePatient}/timeline` : null, 
    {
      initialData: [],
      intervalMs: 60000
    }
  );

  const patient = rawPatients?.find(p => p.id === activePatient);

  useEffect(() => {
    if (patientsError) {
      toast.error("Failed to load patient records.");
    }
  }, [patientsError]);

  const handleExport = () => {
    generateTablePDF({
      title: "Medical Records",
      columns: ["ID", "Patient Name", "Last Visit"],
      rows: patientsList.map((p) => [
        p.displayId,
        p.name,
        p.lastVisit || "N/A",
      ]),
      filename: "HollyDental-Medical-Records",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative w-full overflow-hidden">
      
      {/* Page Header (Only visible if no patient selected on mobile, always visible on desktop) */}
      <div className={`px-4 md:px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 ${activePatient ? 'hidden lg:flex' : 'flex'}`}>
        <div>
          <h1 className="text-[18px] md:text-[20px] font-semibold text-gray-900 tracking-tight">Medical Records</h1>
          <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5 hidden sm:block">Manage patient clinical histories and documentation.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="hidden sm:flex items-center gap-1.5 px-3 py-2 md:py-1.5 border border-gray-200 rounded-[8px] text-[13px] md:text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 md:w-3.5 md:h-3.5" /> Export
          </button>
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 md:py-1.5 bg-blue-600 text-white rounded-[8px] text-[13px] md:text-[12px] font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" /> Add Note
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left: Patient List (Full width on mobile, 300px on lg) */}
        <div className={`w-full lg:w-[320px] lg:border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0 transition-transform ${activePatient ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients..."
                className="w-full bg-white border border-gray-200 rounded-[10px] md:rounded-[8px] pl-9 pr-8 py-2.5 md:py-1.5 text-[14px] md:text-[12px] focus:outline-none focus:border-blue-500 shadow-sm transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Add Record FAB */}
          <button className="lg:hidden fixed bottom-[80px] right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" />
          </button>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-safe">
            {isPatientsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 md:p-3 border border-transparent rounded-[12px] md:rounded-[8px] animate-pulse bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
              ))
            ) : patientsList.length > 0 ? (
              patientsList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePatient(p.id)}
                  className={`w-full text-left p-4 md:p-3 rounded-[12px] md:rounded-[8px] transition-all border shadow-sm ${
                    activePatient === p.id ? "bg-white border-blue-200 ring-1 ring-blue-100" : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5 md:mb-1">
                    <p className={`text-[15px] md:text-[13px] font-bold ${activePatient === p.id ? "text-blue-900" : "text-gray-900"}`}>{p.name}</p>
                    <span className="text-[11px] md:text-[10px] text-gray-400 font-mono">{p.displayId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] md:text-[11px] text-gray-500">
                    <p>DOB: {p.dob}</p>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <p>Visit: {p.lastVisit}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-[14px] md:text-[12px] font-semibold text-gray-700">No patients found</p>
                <p className="text-[12px] md:text-[11px] text-gray-500 mt-1">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Record Details (Full width on mobile when selected) */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden w-full lg:w-auto absolute lg:static inset-0 z-40 transition-transform ${activePatient ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} ${!activePatient && 'hidden lg:flex'}`}>
          {patient ? (
            <>
              {/* Mobile Back Header */}
              <div className="lg:hidden flex items-center px-2 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                <button onClick={() => setActivePatient(null)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-bold text-gray-900 truncate">{patient.name}</h2>
                  <p className="text-[12px] text-gray-500 truncate">{patient.displayId} • {patient.dob}</p>
                </div>
              </div>

              {/* Desktop Patient Banner */}
              <div className="hidden lg:flex px-6 py-5 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[18px] shadow-sm">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[18px] font-bold text-gray-900">{patient.name}</h2>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[12px] text-gray-500">ID: <span className="font-medium text-gray-900">{patient.displayId}</span></span>
                      <span className="text-[12px] text-gray-500">DOB: <span className="font-medium text-gray-900">{patient.dob}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Container */}
              <div className="border-b border-gray-200 bg-white overflow-x-auto no-scrollbar shrink-0 relative">
                <div className="flex px-4 md:px-6">
                  {[
                    { id: "timeline", label: "Clinical Timeline" },
                    { id: "visits", label: "Visit History" },
                    { id: "attachments", label: "X-Rays & Docs" },
                    { id: "treatment", label: "Treatment Plan" },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`py-3 md:py-2.5 px-3 md:px-0 md:mr-6 text-[14px] md:text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                        activeTab === t.id ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {t.label}
                      {activeTab === t.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30 pb-safe">
                {activeTab === "timeline" && (
                  <div className="max-w-3xl space-y-6 relative before:absolute before:inset-0 before:ml-[18px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {isTimelineLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-200 bg-gray-100 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 animate-pulse" />
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-[16px] md:rounded-[12px] border border-gray-200 shadow-sm animate-pulse ml-2 md:ml-0">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))
                    ) : timelineData && timelineData.length > 0 ? (
                      timelineData.map((item) => (
                        <div key={item.id} className="relative flex items-start justify-between md:justify-normal md:items-center md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 mt-2 md:mt-0">
                            {item.type === "visit" && <Stethoscope className="w-4 h-4 text-blue-500" />}
                            {item.type === "note" && <FileText className="w-4 h-4 text-emerald-500" />}
                            {item.type === "rx" && <Pill className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-[16px] md:rounded-[12px] border border-gray-200 shadow-sm ml-2 md:ml-0 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 gap-1 md:gap-0">
                              <span className="text-[14px] md:text-[13px] font-bold text-gray-900 leading-tight">{item.title}</span>
                              <span className="text-[11px] md:text-[10px] font-medium text-gray-500 flex items-center gap-1 shrink-0 bg-gray-50 px-2 py-0.5 rounded-full w-max"><Clock className="w-3 h-3" /> {item.date}</span>
                            </div>
                            <p className="text-[12px] md:text-[11px] text-gray-500 font-semibold mb-2">{item.doctor}</p>
                            <p className="text-[13px] md:text-[12px] text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-[8px]">{item.desc}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-[16px] md:rounded-[12px] mx-auto w-full md:w-[calc(50%-2.5rem)]">
                        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-[15px] md:text-[13px] font-bold text-gray-700">No timeline events</p>
                        <p className="text-[13px] md:text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto">This patient does not have any recorded visits or notes yet.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === "attachments" && (
                  <div className="text-center py-20 bg-white rounded-[16px] border border-gray-200 shadow-sm">
                    <Paperclip className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-[15px] font-bold text-gray-700">No attachments</p>
                    <p className="text-[13px] text-gray-500 mt-1">Upload X-Rays or documents here.</p>
                    <button className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-[13px] rounded-[8px]">Upload File</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-50/30">
              <FileText className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-[16px] font-bold text-gray-900">No Patient Selected</p>
              <p className="text-[13px] text-gray-500 mt-1">Select a patient from the sidebar to view their medical records.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
