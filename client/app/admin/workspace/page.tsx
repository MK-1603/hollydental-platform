"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Search, Loader2, X, Calendar, ExternalLink, AlertTriangle, 
  UserCheck, ChevronDown, Clock, Activity, Save, Copy, History, FileDown, 
  Users, Stethoscope, AlignLeft, ShieldAlert, BriefcaseMedical, Pill, CheckCircle2
} from "lucide-react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { generatePrescriptionPDF } from "@/lib/pdf";

const CATEGORIES = [
  {
    title: "Clinical Documentation",
    tools: [
      { id: "soap-notes", label: "SOAP Notes", icon: FileText, desc: "Subjective, Objective, Assessment, and Plan." },
      { id: "progress-notes", label: "Progress Notes", icon: AlignLeft, desc: "Document ongoing care and observations." },
    ]
  },
  {
    title: "Prescription",
    tools: [
      { id: "prescription-builder", label: "Prescription Builder", icon: Pill, desc: "Draft structured medical prescriptions." },
    ]
  }
];

const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools);

export default function ClinicalWorkspace() {
  const [activeTool, setActiveTool] = useState("soap-notes");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientSwitcher, setShowPatientSwitcher] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"none" | "right">("none");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Note State
  const [noteId, setNoteId] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<any>({});
  
  // Real-time patients list
  const { data: allPatients = [], loading: patientsLoading } = useLiveData<any[]>("/patients", {
    intervalMs: 15000,
    initialData: [],
  });

  // Selected patient details
  const { data: patientData, loading: isLoadingPatient } = useLiveData<any>(
    selectedPatientId ? `/patients/${selectedPatientId}` : null,
    { enabled: !!selectedPatientId }
  );

  // Load patient clinical history
  const { data: history = [], refetch: refetchHistory } = useLiveData<any[]>(
    selectedPatientId ? `/clinical/patient/${selectedPatientId}` : null,
    { enabled: !!selectedPatientId }
  );

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiRequest(`/search?q=${encodeURIComponent(patientSearch)}`);
        setSearchResults((res as any[]).filter(r => r.type === "Patient"));
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [patientSearch]);

  // Load last active record on tool or patient switch
  useEffect(() => {
    setNoteId(null);
    if (activeTool === "soap-notes") {
      setDocumentContent({ subjective: "", objective: "", assessment: "", plan: "" });
    } else if (activeTool === "prescription-builder") {
      setDocumentContent({ medication: "", dosage: "", duration: "", quantity: "", instructions: "" });
    } else {
      setDocumentContent({ main: "" });
    }
    setSaveStatus("idle");
  }, [activeTool, selectedPatientId]);

  // Prevent background scrolling for drawers
  useEffect(() => {
    if (mobileDrawer !== "none" || showPatientSwitcher || showHistoryDrawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileDrawer, showPatientSwitcher, showHistoryDrawer]);

  // Auto-save logic (every 20s if changed)
  const prevContentRef = useRef<string>("");
  useEffect(() => {
    const currentStr = JSON.stringify(documentContent);
    if (!selectedPatientId || currentStr === prevContentRef.current) return;
    
    const timer = setInterval(() => {
      if (JSON.stringify(documentContent) !== prevContentRef.current) {
        handleSave(true);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [documentContent, selectedPatientId, noteId]);

  const handleSave = async (isAuto = false) => {
    if (!patientData) {
      if (!isAuto) toast.error("Please select a patient before saving.");
      return;
    }

    setSaveStatus("saving");
    if (!isAuto) setIsSaving(true);
    
    try {
      let result;
      if (noteId) {
        result = await apiRequest(`/clinical/${noteId}`, {
          method: "PUT",
          body: JSON.stringify({ content: documentContent })
        });
      } else {
        result = await apiRequest(`/clinical`, {
          method: "POST",
          body: JSON.stringify({
            patientId: selectedPatientId,
            recordType: activeTool,
            content: documentContent
          })
        });
        setNoteId(result.id);
      }
      
      prevContentRef.current = JSON.stringify(documentContent);
      setSaveStatus("saved");
      setLastSaved(new Date());
      refetchHistory();
      if (!isAuto) toast.success("Record saved successfully.");
    } catch (error) {
      setSaveStatus("error");
      if (!isAuto) toast.error("Failed to save record.");
    } finally {
      if (!isAuto) setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!documentContent) return;
    let textToCopy = "";
    if (activeTool === "soap-notes") {
      textToCopy = `SOAP NOTE\nSubjective: ${documentContent.subjective || "N/A"}\nObjective: ${documentContent.objective || "N/A"}\nAssessment: ${documentContent.assessment || "N/A"}\nPlan: ${documentContent.plan || "N/A"}`;
    } else if (activeTool === "prescription-builder") {
      textToCopy = `PRESCRIPTION\nMedication: ${documentContent.medication}\nDosage: ${documentContent.dosage}\nDuration: ${documentContent.duration}\nInstructions: ${documentContent.instructions}`;
    } else {
      textToCopy = documentContent.main || "";
    }
    
    navigator.clipboard.writeText(textToCopy);
    toast.success("Content copied to clipboard.");
  };

  const handleExport = () => {
    if (!patientData) {
      toast.warning("Please select a patient first.");
      return;
    }
    if (activeTool === "prescription-builder") {
      generatePrescriptionPDF({
        patientName: `${patientData.firstName} ${patientData.lastName}`,
        patientDob: patientData.dateOfBirth,
        drugName: documentContent.medication || "Unknown",
        dosage: documentContent.dosage || "Unknown",
        duration: documentContent.duration || "Unknown",
        frequency: "As directed",
        instructions: documentContent.instructions || "",
        issuedAt: new Date().toISOString()
      });
      toast.success("Prescription PDF generated.");
    } else {
      toast.info("PDF Export for SOAP notes coming soon.");
    }
  };

  const loadHistoryVersion = (record: any) => {
    if (confirm("Load this previous version? Current unsaved changes will be lost.")) {
      setActiveTool(record.recordType);
      setNoteId(record.id);
      setDocumentContent(record.content);
      prevContentRef.current = JSON.stringify(record.content);
      setShowHistoryDrawer(false);
    }
  };

  const renderEditorFields = () => {
    if (activeTool === "prescription-builder") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Medication</label>
              <input type="text" value={documentContent.medication || ''} onChange={e => setDocumentContent({...documentContent, medication: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] focus:outline-none focus:border-blue-500 shadow-sm" placeholder="e.g. Amoxicillin 500mg" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dosage & Frequency</label>
              <input type="text" value={documentContent.dosage || ''} onChange={e => setDocumentContent({...documentContent, dosage: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] focus:outline-none focus:border-blue-500 shadow-sm" placeholder="e.g. 1 tablet 3 times a day" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</label>
              <input type="text" value={documentContent.duration || ''} onChange={e => setDocumentContent({...documentContent, duration: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] focus:outline-none focus:border-blue-500 shadow-sm" placeholder="e.g. 5 days" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
              <input type="text" value={documentContent.quantity || ''} onChange={e => setDocumentContent({...documentContent, quantity: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] focus:outline-none focus:border-blue-500 shadow-sm" placeholder="e.g. 15 tablets" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Special Instructions</label>
            <textarea value={documentContent.instructions || ''} onChange={e => setDocumentContent({...documentContent, instructions: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] min-h-[80px] focus:outline-none focus:border-blue-500 shadow-sm resize-y" placeholder="e.g. Take with food..." />
          </div>
        </div>
      );
    }

    if (activeTool === "soap-notes") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subjective (Patient's Report)</label>
            <textarea value={documentContent.subjective || ''} onChange={e => setDocumentContent({...documentContent, subjective: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] min-h-[100px] focus:outline-none focus:border-blue-500 shadow-sm resize-y" placeholder="Patient complains of..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Objective (Clinical Findings)</label>
            <textarea value={documentContent.objective || ''} onChange={e => setDocumentContent({...documentContent, objective: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] min-h-[100px] focus:outline-none focus:border-blue-500 shadow-sm resize-y" placeholder="Vitals, examination results..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Assessment (Diagnosis)</label>
            <textarea value={documentContent.assessment || ''} onChange={e => setDocumentContent({...documentContent, assessment: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] min-h-[100px] focus:outline-none focus:border-blue-500 shadow-sm resize-y" placeholder="Primary diagnosis..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Plan (Treatment & Follow-up)</label>
            <textarea value={documentContent.plan || ''} onChange={e => setDocumentContent({...documentContent, plan: e.target.value})} className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-3 md:py-2 text-[14px] md:text-[12px] min-h-[100px] focus:outline-none focus:border-blue-500 shadow-sm resize-y" placeholder="Prescribed X, advised Y..." />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 h-full flex flex-col">
        <textarea
          value={documentContent.main || ''} onChange={e => setDocumentContent({...documentContent, main: e.target.value})}
          className="w-full flex-1 bg-white border border-gray-200 rounded-[8px] px-4 py-3 text-[14px] md:text-[13px] leading-relaxed focus:outline-none focus:border-blue-500 shadow-sm resize-none min-h-[400px]"
          placeholder="Start typing clinical notes here..."
        />
      </div>
    );
  };

  const RightSidebarContent = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-4 bg-gray-50 pb-safe">
      {isLoadingPatient ? (
        <div className="flex flex-col items-center justify-center h-40 space-y-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-[11px] font-medium text-gray-500">Loading Context...</p>
        </div>
      ) : patientData ? (
        <div className="bg-white border border-gray-200 rounded-[16px] p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100" />
          
          <div className="relative z-10 flex flex-col items-center text-center mt-2">
            <div className="w-16 h-16 rounded-[12px] bg-white border border-gray-200 shadow-sm flex items-center justify-center text-blue-700 font-bold text-[22px] mb-3">
              {patientData.firstName?.charAt(0) || ''}{patientData.lastName?.charAt(0) || ''}
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 leading-tight">{patientData.firstName} {patientData.lastName}</h3>
            <p className="text-[12px] text-gray-500 font-mono mt-1">ID: {patientData.id?.substring(0, 8).toUpperCase()}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 mb-4 text-[12px]">
            <div className="bg-gray-50 p-2 rounded-[8px] border border-gray-100 text-center">
              <span className="block font-bold text-gray-400 uppercase mb-0.5 text-[9px]">Age/Gender</span>
              <span className="font-bold text-gray-900">{patientData.age || '-'}y • {patientData.gender?.[0] || '-'}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-[8px] border border-gray-100 text-center">
              <span className="block font-bold text-gray-400 uppercase mb-0.5 text-[9px]">Phone</span>
              <span className="font-bold text-gray-900 truncate">{patientData.phone || '-'}</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Clinical Context
            </h4>
            
            {patientData.allergies ? (
              <div className="flex items-start gap-2 p-2.5 bg-red-50 text-red-900 rounded-[8px] text-[12px]">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <div><span className="font-bold text-red-700">Allergy:</span> {patientData.allergies}</div>
              </div>
            ) : (
              <div className="text-[12px] text-gray-500 italic px-1">No known allergies.</div>
            )}

            {patientData.medicalConditions && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 text-amber-900 rounded-[8px] text-[12px]">
                <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div><span className="font-bold text-amber-700">Condition:</span> {patientData.medicalConditions}</div>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4 mt-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent History
            </h4>
            <div className="relative border-l-2 border-gray-100 ml-1.5 space-y-4 pb-1">
               {history.slice(0, 3).map((h) => (
                  <div key={h.id} className="relative pl-4 cursor-pointer hover:bg-gray-50 rounded-r-[8px] py-1" onClick={() => loadHistoryVersion(h)}>
                     <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full -left-[5.5px] top-1.5 ring-4 ring-white" />
                     <p className="text-[12px] font-bold text-gray-900">{h.recordType.toUpperCase()}</p>
                     <p className="text-[11px] text-gray-500">{new Date(h.updatedAt).toLocaleDateString()}</p>
                  </div>
               ))}
               {history.length === 0 && (
                  <div className="text-[11px] text-gray-500 pl-4">No recent history found.</div>
               )}
            </div>
          </div>

          <a href={`/admin/patients/${selectedPatientId}`} target="_blank" rel="noreferrer" className="w-full mt-5 flex items-center justify-center gap-2 h-[40px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-[12px] text-[13px] font-bold transition-colors shadow-sm">
            Open Full Record <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 rounded-[12px] bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-[14px] font-bold text-gray-900 mb-1">No Patient Selected</h3>
          <p className="text-[12px] text-gray-500">Select a patient to view their clinical context.</p>
        </div>
      )}
    </div>
  );

  const PatientSwitcherDrawer = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-[16px] text-gray-900">Switch Patient</h3>
        <button onClick={() => setShowPatientSwitcher(false)} className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors text-gray-500">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-9 pr-8 h-[40px] bg-white border border-gray-200 rounded-[12px] text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow shadow-sm"
          />
          {patientSearch && (
            <button
              onClick={() => { setPatientSearch(""); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {patientSearch.trim().length > 1 ? (
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Search className="w-3 h-3" /> Search Results</h4>
            {isSearching ? (
              <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
            ) : searchResults.length > 0 ? (
              searchResults.map((res) => {
                const rawId = res.id.replace('pat-', '');
                return (
                  <button
                    key={res.id}
                    onClick={() => {
                      setSelectedPatientId(rawId);
                      setPatientSearch("");
                      setSearchResults([]);
                      setShowPatientSwitcher(false);
                      setMobileDrawer("none");
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-[12px] border border-transparent transition-colors group text-left"
                  >
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">{res.title}</p>
                      <p className="text-[11px] text-gray-500">{res.subtitle}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-[12px] text-gray-500 text-center">No patients found.</div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Today's Patients</h4>
              <div className="space-y-1">
                {patientsLoading && allPatients.length === 0 ? (
                  <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
                ) : allPatients.length > 0 ? (
                  allPatients.slice(0, 5).map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatientId(p.id); setShowPatientSwitcher(false); setMobileDrawer("none"); }}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-[12px] border border-transparent transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 text-[11px] font-bold flex items-center justify-center transition-colors">
                          {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                        </div>
                        <div>
                          <span className="block text-[13px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{p.firstName} {p.lastName}</span>
                          <span className="block text-[11px] text-gray-500 font-mono">ID: {p.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-4 text-center text-[12px] text-gray-500">No patients available.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex w-full h-full bg-[#F8FAFC] font-inter overflow-hidden text-gray-900 relative">
      {/* Mobile Overlay */}
      {(mobileDrawer !== "none" || showPatientSwitcher) && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" onClick={() => {setMobileDrawer("none"); setShowPatientSwitcher(false)}} />
      )}

      {/* ── 1. Center Workspace (Editor) ── */}
      <div className="flex-1 lg:w-[70%] flex flex-col relative h-full bg-white z-20 overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.03)] border-r border-gray-200">
        {/* Header */}
        <header className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white z-30 shrink-0 w-full min-h-[64px]">
          {/* LEFT: Patient Context */}
          <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 -ml-1.5 rounded-[12px] transition-colors border border-transparent hover:border-gray-200" onClick={() => setShowPatientSwitcher(true)}>
            {patientData ? (
              <>
                <div className="w-[44px] h-[44px] rounded-[12px] bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[15px] border border-blue-100 shrink-0">
                  {patientData.firstName?.charAt(0) || ''}{patientData.lastName?.charAt(0) || ''}
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[16px] font-semibold text-gray-900 leading-tight truncate">{patientData.firstName} {patientData.lastName}</span>
                  <div className="flex items-center gap-3 mt-0.5 whitespace-nowrap overflow-hidden">
                    <span className="text-[12px] font-medium text-gray-500">Patient ID • {patientData.id?.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1 hidden sm:block shrink-0" />
              </>
            ) : (
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-[44px] h-[44px] rounded-[12px] bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[16px] font-semibold text-gray-600">Switch Patient...</span>
              </div>
            )}
          </div>

          {/* RIGHT: Actions & Tools */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full xl:w-auto">
            <div className="relative shrink-0 flex-1 sm:flex-none">
              <FileText className="w-4 h-4 text-gray-400 group-hover:text-gray-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <select value={activeTool} onChange={(e) => setActiveTool(e.target.value)} className="appearance-none pl-9 pr-8 h-[44px] sm:h-[36px] w-full sm:w-[160px] bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-[10px] text-[14px] font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm cursor-pointer transition-all">
                {ALL_TOOLS.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            </div>

            <div className="w-[1px] h-[20px] bg-gray-200 shrink-0 hidden md:block mx-1" />

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleCopy} className="h-[44px] w-[44px] sm:h-[36px] sm:w-[36px] flex items-center justify-center text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 shadow-sm rounded-[10px] hover:bg-gray-50 active:bg-gray-100 transition-all" title="Copy to Clipboard">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={handleExport} className="h-[44px] w-[44px] sm:h-[36px] sm:w-[36px] flex items-center justify-center text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 shadow-sm rounded-[10px] hover:bg-gray-50 active:bg-gray-100 transition-all" title="Export PDF">
                <FileDown className="w-4 h-4" />
              </button>
              <button onClick={() => setShowHistoryDrawer(true)} className="h-[44px] w-[44px] sm:h-[36px] sm:w-[36px] hidden md:flex items-center justify-center text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 shadow-sm rounded-[10px] hover:bg-gray-50 active:bg-gray-100 transition-all" title="Version History">
                <History className="w-4 h-4" />
              </button>
              <button onClick={() => setMobileDrawer("right")} className="lg:hidden h-[44px] w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 border border-gray-200 bg-white rounded-[10px] shrink-0 shadow-sm">
                <Users className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => handleSave(false)} disabled={isSaving} className="h-[44px] sm:h-[36px] w-full sm:w-[140px] text-[14px] font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-[10px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 mt-2 sm:mt-0">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative bg-white">
          {patientData ? (
            <div className="h-full">
              <div className="flex flex-col min-h-full">
                <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto w-full flex-1">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">{ALL_TOOLS.find(t=>t.id===activeTool)?.label}</h2>
                    {saveStatus === 'saved' && (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[6px] text-[11px] font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Saved {lastSaved?.toLocaleTimeString()}
                      </span>
                    )}
                    {saveStatus === 'saving' && (
                      <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-[6px] text-[11px] font-bold border border-gray-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-[6px] text-[11px] font-bold border border-red-100">
                        <AlertTriangle className="w-3.5 h-3.5" /> Save Failed
                      </span>
                    )}
                  </div>
                  {renderEditorFields()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center max-w-sm mx-auto px-4">
              <div className="w-20 h-20 rounded-[20px] bg-gray-50 flex items-center justify-center border border-gray-100 mb-6 shadow-sm">
                <UserCheck className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-[20px] font-bold text-gray-900 mb-2">Patient Workspace</h3>
              <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">Select a patient to begin documentation. Context, vitals, and medical history will be instantly loaded from the database.</p>
              <button onClick={() => setShowPatientSwitcher(true)} className="h-[44px] px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-[12px] text-[14px] transition-colors flex items-center gap-2 shadow-sm">
                <Search className="w-4 h-4" /> Search Patient
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Right Context Panel ── */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-[85%] max-w-[360px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out lg:static lg:w-[30%] lg:max-w-none lg:shadow-none lg:transform-none shrink-0 border-l border-gray-200 ${mobileDrawer === "right" ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="lg:hidden px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <span className="font-bold text-[14px] text-gray-900">Patient Context</span>
          <button onClick={() => setMobileDrawer("none")} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-[8px]"><X className="w-4 h-4" /></button>
        </div>
        <RightSidebarContent />
      </aside>

      {/* ── 3. Patient Switcher Drawer ── */}
      {showPatientSwitcher && (
        <>
          <div className="fixed inset-y-0 left-0 w-full md:w-[400px] bg-white shadow-2xl z-50 animate-slide-left flex flex-col border-r border-gray-200">
            <PatientSwitcherDrawer />
          </div>
        </>
      )}

      {/* ── 4. History Drawer ── */}
      {showHistoryDrawer && (
        <>
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={() => setShowHistoryDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-gray-900">Version History</h3>
              <button onClick={() => setShowHistoryDrawer(false)} className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {history.length > 0 ? history.map((record) => (
                 <div key={record.id} className="border border-gray-200 rounded-[12px] p-4 hover:border-blue-300 transition-colors cursor-pointer bg-gray-50" onClick={() => loadHistoryVersion(record)}>
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-[14px] font-bold text-gray-900">{record.recordType.toUpperCase()}</h4>
                       <span className="text-[11px] text-gray-500">{new Date(record.updatedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-[12px] text-gray-600 line-clamp-2">
                       {record.content?.plan || record.content?.medication || record.content?.main || "No content preview"}
                    </p>
                 </div>
               )) : (
                 <div className="text-center p-8 text-gray-500 text-[13px]">No history records found for this patient.</div>
               )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
