"use client";

import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, File, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Play, Pause, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

import { apiUpload } from "@/lib/api";

interface UploadManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  patients: {id: string, firstName: string, lastName: string}[];
  initialPatientId: string;
  currentPath: string;
}

export default function UploadManagerModal({ isOpen, onClose, onUploadSuccess, patients, initialPatientId, currentPath }: UploadManagerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [documentType, setDocumentType] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [metadata, setMetadata] = useState<any>({});
  
  useEffect(() => {
    if (isOpen) setSelectedPatientId(initialPatientId);
  }, [isOpen, initialPatientId]);
  
  // Upload state
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("0 KB/s");
  const [remainingTime, setRemainingTime] = useState("Calculating...");
  const [isPaused, setIsPaused] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "paused" | "success" | "error">("idle");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDocumentType("");
      setSelectedFiles([]);
      setMetadata({});
      setProgress(0);
      setUploadStatus("idle");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDocumentTypeSelect = (type: string) => {
    setDocumentType(type);
    setMetadata({ ...metadata, category: type });
    setStep(2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setStep(3);
    }
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return toast.warning("No files selected.");
    if (!selectedPatientId) return toast.warning("Patient is required.");

    setStep(4);
    setUploadStatus("uploading");
    setProgress(0);
    setUploadSpeed("Uploading...");
    setRemainingTime("Please wait");
    
    let successCount = 0;
    
    // Upload files sequentially for simplicity and stability, or promise.all
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        await apiUpload("/files/upload", {
          patientId: selectedPatientId,
          category: metadata.category || currentPath || "document",
          metadata: JSON.stringify({
            ...metadata,
            customName: file.name
          }),
          file
        });
        successCount++;
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (successCount === selectedFiles.length) {
      setProgress(100);
      setUploadStatus("success");
      setTimeout(() => {
        toast.success(`${successCount} files uploaded successfully`);
        onUploadSuccess();
        onClose();
      }, 1500);
    } else {
      setUploadStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={uploadStatus === 'uploading' ? undefined : onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">Upload Manager</h2>
              <div className="flex items-center gap-2 mt-0.5 text-[12px] font-medium text-gray-500">
                <span className={step >= 1 ? "text-indigo-600" : ""}>Type</span>
                <span className="text-gray-300">/</span>
                <span className={step >= 2 ? "text-indigo-600" : ""}>Files</span>
                <span className="text-gray-300">/</span>
                <span className={step >= 3 ? "text-indigo-600" : ""}>Details</span>
                <span className="text-gray-300">/</span>
                <span className={step >= 4 ? "text-indigo-600" : ""}>Upload</span>
              </div>
            </div>
          </div>
          {uploadStatus !== 'uploading' && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-[18px] font-bold text-gray-900 mb-4 text-center">Select Document Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: "image", icon: ImageIcon, label: "Image" },
                  { id: "xray", icon: ImageIcon, label: "X-Ray" },
                  { id: "report", icon: FileText, label: "Clinical Report" },
                  { id: "consent", icon: FileText, label: "Consent Form" },
                  { id: "prescription", icon: FileText, label: "Prescription" },
                  { id: "other", icon: File, label: "Other" }
                ].map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => handleDocumentTypeSelect(type.id)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                  >
                    <type.icon className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mb-3" />
                    <span className="text-[14px] font-semibold text-gray-700 group-hover:text-indigo-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col items-center justify-center">
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md p-10 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/80 cursor-pointer transition-all flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-2">Click or drag files here</h3>
                <p className="text-[13px] text-gray-500 font-medium">Supports multiple files and folder upload</p>
                <div className="mt-6 px-4 py-2 bg-white rounded-lg border border-gray-200 text-[13px] font-bold text-indigo-600 shadow-sm">
                  Browse Files
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 text-[13px] font-medium flex items-center gap-3 border border-blue-100">
                <File className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">{selectedFiles.length} files selected.</span> Please provide metadata below.
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Document Title *</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]" placeholder="e.g. Post-op X-Ray" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Patient *</label>
                    <select 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px]"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                      <option value="">Select Patient</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Description</label>
                  <textarea 
                    rows={3} 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] resize-none" 
                    placeholder="Add optional notes..."
                    value={metadata.description || ""}
                    onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col items-center justify-center max-w-md mx-auto text-center">
              {uploadStatus === 'uploading' && <UploadCloud className="w-16 h-16 text-indigo-500 mb-4 animate-bounce" />}
              {uploadStatus === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />}
              {uploadStatus === 'error' && <AlertCircle className="w-16 h-16 text-red-500 mb-4" />}
              
              <h3 className="text-[18px] font-bold text-gray-900 mb-1">
                {uploadStatus === 'uploading' && "Uploading Files..."}
                {uploadStatus === 'success' && "Upload Complete!"}
                {uploadStatus === 'error' && "Upload Failed"}
              </h3>
              
              {uploadStatus === 'uploading' && (
                <>
                  <p className="text-[13px] text-gray-500 font-medium mb-6">{remainingTime} • {uploadSpeed}</p>
                  
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setUploadStatus("error")} className="px-4 py-2 border border-red-200 text-red-600 text-[13px] font-bold rounded-lg hover:bg-red-50">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 3 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-[14px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg">Back</button>
            <button onClick={startUpload} className="px-6 py-2 text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Start Upload</button>
          </div>
        )}
      </div>
    </div>
  );
}
