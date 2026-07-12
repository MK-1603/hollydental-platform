"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { apiRequest, apiUpload } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { toast } from "@/lib/toast";
import { 
  Folder, Upload, Download, Trash, RefreshCw, Pencil, Check, 
  X as XIcon, Search, FileText, Image as ImageIcon, 
  Activity, LayoutGrid, List, File, Share2, Plus, HardDrive, Info, FolderPlus,
  MoreVertical, ChevronRight, CornerUpLeft, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/components/DialogProvider";
import FolderModal from "@/components/admin/FolderModal";
import UploadManagerModal from "@/components/admin/UploadManagerModal";

interface PatientLite {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClinicalFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  visibility: string;
  folderType: string;
  tags?: string[];
  parentId?: string | null;
}

interface ClinicalFile {
  id: string;
  fileName: string;
  fileType: string;
  category: string; 
  cloudinaryUrl: string;
  createdAt: string;
  size?: number;
  originalName?: string;
  folderId?: string;
  metadata?: any;
}

export default function AdminFilesPage() {
  const { confirm } = useDialog();
  const { data: patients = [], loading: patientsLoading } = useLiveData<PatientLite[]>("/patients", { 
    intervalMs: 0, 
    select: (raw: any) => Array.isArray(raw) ? raw : (raw?.patients || raw?.data || []),
    initialData: [] 
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za" | "size">("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // Virtual Folder Navigation
  const [currentPath, setCurrentPath] = useState<string>(""); // "" is root
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [selectedFile, setSelectedFile] = useState<ClinicalFile | null>(null);
  
  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  // New Modals State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadManagerOpen, setIsUploadManagerOpen] = useState(false);
  const [dbFolders, setDbFolders] = useState<ClinicalFolder[]>([]);

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  const { data: files = [], loading: filesLoading, refetch: refetchFiles } = useLiveData<ClinicalFile[]>(
    selectedPatientId ? `/files/patient/${selectedPatientId}` : null,
    { 
      intervalMs: 30000, 
      select: (raw: any) => Array.isArray(raw) ? raw : (raw?.files || raw?.data || []),
      initialData: [] 
    }
  );

  const { data: remoteFolders = [], refetch: refetchFolders } = useLiveData<ClinicalFolder[]>(
    selectedPatientId ? `/files/folders/patient/${selectedPatientId}` : null,
    {
      intervalMs: 30000,
      select: (raw: any) => Array.isArray(raw) ? raw : (raw?.folders || raw?.data || []),
      initialData: []
    }
  );

  const refetch = useCallback(() => {
    refetchFiles();
    refetchFolders();
  }, [refetchFiles, refetchFolders]);

  // Derive virtual folders and filtered files
  const { folders, currentFiles } = useMemo(() => {
    let filtered = [...files];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(f => f.fileName.toLowerCase().includes(s) || f.category.toLowerCase().includes(s));
    }

    // Determine unique folders at current path
    const folderSet = new Set<string>();
    let fileList: ClinicalFile[] = [];

    filtered.forEach(file => {
      const cat = file.category || "other";
      // If we are at root (""), folders are the top level categories
      // If we are at "xray", and file is "xray/2026", folder is "2026"
      if (search) {
        fileList.push(file); // Search flattens hierarchy
        return;
      }
      
      if (currentPath === "") {
        if (cat.includes("/")) {
          folderSet.add(cat.split("/")[0]);
        } else {
          folderSet.add(cat);
        }
      } else {
        if (cat === currentPath) {
          fileList.push(file);
        } else if (cat.startsWith(currentPath + "/")) {
          const subPath = cat.substring(currentPath.length + 1);
          folderSet.add(subPath.split("/")[0]);
        }
      }
    });

    if (currentPath === "") {
      // In root, all files whose category has no slash are root files
      fileList.push(...filtered.filter(f => !f.category?.includes("/") && !search));
    }

    if (filterCategory !== "all") {
      fileList = fileList.filter(f => f.category === filterCategory);
    }

    // Sort folders alphabetically, files by date or selected sort
    const finalFolders = Array.from(folderSet).sort();
    const finalFiles = fileList.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "az") return a.fileName.localeCompare(b.fileName);
      if (sortBy === "za") return b.fileName.localeCompare(a.fileName);
      if (sortBy === "size") return (b.size || 0) - (a.size || 0);
      return 0;
    });

    return { folders: finalFolders, currentFiles: finalFiles };
  }, [files, currentPath, search, sortBy, filterCategory]);

  useEffect(() => {
    setSelectedFile(null);
  }, [currentPath, selectedPatientId]);

  // Handle Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploadManagerOpen(true);
    }
  }, []);

  const handleUploadSubmit = async (file: File, metadata: any) => {
    if (!file) return toast.warning("Choose a file to upload");
    if (!selectedPatientId) return toast.warning("Select a patient first");
    
    setUploading(true);
    setUploadProgress(10);
    try {
      const int = setInterval(() => setUploadProgress(p => Math.min(p + 15, 90)), 300);
      
      const cat = currentPath || "document"; 
      
      await apiUpload("/files/upload", {
        patientId: selectedPatientId,
        category: cat,
        metadata: JSON.stringify(metadata),
        file
      });
      
      clearInterval(int);
      setUploadProgress(100);
      
      setTimeout(() => {
        setPendingFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetch();
        toast.success("File uploaded successfully.");
      }, 500);
      
    } catch (error: any) {
      toast.error(`Upload failed: ${error?.message || "Please try again."}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await apiRequest(`/files/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ fileName: editName.trim() }),
      });
      refetch();
      setEditingId(null);
      toast.success("File renamed.");
      if (selectedFile?.id === id) {
        setSelectedFile(prev => prev ? { ...prev, fileName: editName.trim() } : null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to rename file.");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: "Delete File", description: "This file will be permanently deleted.", type: "danger" });
    if (!ok) return;
    try {
      await apiRequest(`/files/${id}`, { method: "DELETE" });
      refetch();
      if (selectedFile?.id === id) setSelectedFile(null);
      toast.success("File deleted.");
    } catch (error: any) {
      toast.error(`Failed to delete file.`);
    }
  };

  const handleCreateFolder = async (folderData: any) => {
    try {
      await apiRequest("/files/folders", {
        method: "POST",
        body: JSON.stringify({
          ...folderData,
          patientId: selectedPatientId
        })
      });
      refetchFolders();
      toast.success("Folder created successfully.");
    } catch(e) {
      toast.error("Failed to create folder.");
    }
  };

  const getFileIcon = (file: ClinicalFile) => {
    if (file.fileType?.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (file.fileType?.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleCopyLink = () => {
    if (selectedFile?.cloudinaryUrl) {
      navigator.clipboard.writeText(selectedFile.cloudinaryUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatBytes = (bytes: number = 0, decimals = 1) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  return (
    <div 
      className="flex flex-col h-full bg-white relative font-inter"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop Zone Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center border-4 border-dashed border-blue-400 m-4 rounded-2xl pointer-events-none">
          <div className="flex flex-col items-center text-blue-600">
            <Upload className="w-16 h-16 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Drop files to upload</h2>
            <p className="mt-2 text-blue-500">to {currentPath || "Root"} folder</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 bg-white">
        
        {/* Left: Patient Selector & Breadcrumb */}
        <div className="flex items-center gap-4">
          <select
            value={selectedPatientId}
            onChange={(e) => { setSelectedPatientId(e.target.value); setCurrentPath(""); }}
            disabled={patientsLoading || patients.length === 0}
            className="h-8 bg-gray-50 border border-gray-200 rounded-md px-2 text-[13px] font-medium text-gray-700 outline-none hover:bg-gray-100 transition-colors max-w-[200px] truncate"
          >
            {patients.length === 0 ? <option value="">No patients...</option> : patients.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
          
          <div className="h-4 w-px bg-gray-200" />
          
          <div className="flex items-center text-[13px] font-medium text-gray-600">
            <button onClick={() => setCurrentPath("")} className="hover:bg-gray-100 p-1 rounded transition-colors flex items-center">
              <HardDrive className="w-4 h-4 mr-1.5" /> Drive
            </button>
            {currentPath.split("/").filter(Boolean).map((part, idx, arr) => {
              const pathSoFar = arr.slice(0, idx + 1).join("/");
              return (
                <div key={pathSoFar} className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 mx-0.5 text-gray-400" />
                  <button 
                    onClick={() => setCurrentPath(pathSoFar)} 
                    className={cn("hover:bg-gray-100 p-1 rounded transition-colors", idx === arr.length - 1 ? "text-gray-900 font-semibold" : "")}
                  >
                    {part}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-8 pr-3 h-8 bg-gray-50 border border-gray-200 rounded-md text-[13px] focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" 
            />
          </div>
          
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            className="h-8 bg-gray-50 border border-gray-200 rounded-md px-2 text-[12px] font-medium text-gray-700 outline-none hover:bg-gray-100 hidden sm:block"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
            <option value="size">Size</option>
          </select>
          
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="h-8 bg-gray-50 border border-gray-200 rounded-md px-2 text-[12px] font-medium text-gray-700 outline-none hover:bg-gray-100 hidden sm:block"
          >
            <option value="all">All Types</option>
            <option value="photo">Photos</option>
            <option value="xray">X-Rays</option>
            <option value="document">Reports</option>
          </select>
          
          <div className="h-4 w-px bg-gray-200 mx-1" />
          
          <div className="flex items-center bg-gray-100 rounded-md p-0.5 border border-gray-200">
            <button onClick={() => setViewMode("list")} className={cn("p-1 rounded-sm transition-colors", viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")} className={cn("p-1 rounded-sm transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <button onClick={() => setIsFolderModalOpen(true)} className="h-8 px-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-md text-[13px] font-medium text-gray-700 transition-colors flex items-center gap-1.5 shadow-sm">
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          
          <div className="relative">
            <button onClick={() => setIsUploadManagerOpen(true)} disabled={!selectedPatientId} className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50">
              <Plus className="w-4 h-4" /> Upload
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Quick Filters) */}
        <div className="w-60 border-r border-gray-200 bg-[#F9FAFB] flex flex-col py-4 hidden lg:flex shrink-0">
          <div className="px-3 mb-4 space-y-0.5">
            <button onClick={() => { setSearch(""); setCurrentPath(""); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-200/60 text-gray-700 transition-colors">
              <HardDrive className="w-4 h-4 text-gray-500" /> My Drive
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-200/60 text-gray-700 transition-colors">
              <Share2 className="w-4 h-4 text-gray-500" /> Shared with me
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-200/60 text-gray-700 transition-colors">
              <Activity className="w-4 h-4 text-gray-500" /> Recent
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-gray-200/60 text-gray-700 transition-colors">
              <Trash className="w-4 h-4 text-gray-500" /> Trash
            </button>
          </div>
          <div className="mt-auto px-6 mb-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Storage
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
            </div>
            <div className="text-[12px] text-gray-500">{formatBytes(files.length * 2500000)} of 1 TB used</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            
            {filesLoading && !files.length ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : folders.length === 0 && currentFiles.length === 0 && !search ? (
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center mt-20 opacity-80">
                <div className="w-20 h-20 mb-6 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                  <Folder className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Empty folder</h3>
                <p className="text-[13px] text-gray-500 mt-1 mb-6">
                  Drag and drop files here, or use the "New" button to upload documents.
                </p>
                <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg shadow-sm transition-colors">
                  Upload File
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* UP FOLDER BUTTON */}
                {currentPath && !search && (
                  <div className="flex items-center mb-4">
                    <button onClick={navigateUp} className="flex items-center gap-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-md">
                      <CornerUpLeft className="w-4 h-4" /> Up to Parent Directory
                    </button>
                  </div>
                )}

                {/* FOLDERS GRID */}
                {remoteFolders.length > 0 && !search && (
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-900 mb-3 px-1">Folders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {remoteFolders.map(folder => (
                        <div 
                          key={folder.id}
                          onDoubleClick={() => setCurrentPath(currentPath ? `${currentPath}/${folder.name}` : folder.name)}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl cursor-pointer hover:shadow-sm transition-all group"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${folder.color || 'blue'}-50 text-${folder.color || 'blue'}-500`}>
                            <Folder className="w-4 h-4 fill-current" />
                          </div>
                          <span className="text-[13px] font-medium text-gray-800 truncate">{folder.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FILES */}
                {currentFiles.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-900 mb-3 px-1 mt-6">Files</h3>
                    
                    {viewMode === "list" ? (
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 w-8"></th>
                              <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Name</th>
                              <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Modified</th>
                              <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">File size</th>
                              <th className="px-4 py-3 text-[12px] font-semibold text-gray-600 text-right w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {currentFiles.map(file => (
                              <tr 
                                key={file.id} 
                                onClick={() => setSelectedFile(file)}
                                onDoubleClick={() => window.open(file.cloudinaryUrl, "_blank")}
                                className={cn(
                                  "group cursor-pointer transition-colors duration-75",
                                  selectedFile?.id === file.id ? "bg-blue-50/50" : "hover:bg-gray-50"
                                )}
                              >
                                <td className="px-4 py-2.5">
                                  {getFileIcon(file)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className={cn("text-[13px] font-medium truncate max-w-[300px]", selectedFile?.id === file.id ? "text-blue-700" : "text-gray-900")}>
                                    {file.fileName}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-[13px] text-gray-500">
                                  {new Date(file.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-2.5 text-[13px] text-gray-500">
                                  {formatBytes(file.size || 1500000)}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <button className="p-1 text-gray-400 hover:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {currentFiles.map(file => (
                          <div 
                            key={file.id} 
                            onClick={() => setSelectedFile(file)}
                            onDoubleClick={() => window.open(file.cloudinaryUrl, "_blank")}
                            className={cn(
                              "border rounded-xl overflow-hidden shadow-sm transition-all duration-150 cursor-pointer flex flex-col group bg-white",
                              selectedFile?.id === file.id ? "border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/10" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                            )}
                          >
                            <div className="aspect-square bg-gray-50 border-b border-gray-100 flex items-center justify-center relative overflow-hidden">
                              {file.fileType?.startsWith("image/") ? (
                                <img src={file.cloudinaryUrl} alt={file.fileName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="scale-150">{getFileIcon(file)}</div>
                              )}
                            </div>
                            <div className="p-3 bg-white">
                              <h4 className="text-[13px] font-medium text-gray-900 truncate mb-1" title={file.fileName}>{file.fileName}</h4>
                              <div className="flex justify-between items-center text-[11px] text-gray-500">
                                <span className="uppercase">{file.fileType?.split('/')[1] || 'FILE'}</span>
                                <MoreVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Details Drawer */}
        {selectedFile && (
          <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-200 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 bg-white z-10 shrink-0">
              <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" /> Details
              </h3>
              <button onClick={() => setSelectedFile(null)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                {selectedFile.fileType?.startsWith("image/") ? (
                  <img src={selectedFile.cloudinaryUrl} alt={selectedFile.fileName} className="w-full h-full object-cover" />
                ) : (
                  <div className="scale-150">{getFileIcon(selectedFile)}</div>
                )}
              </div>

              <div>
                {editingId === selectedFile.id ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rename File</label>
                    <div className="flex items-center gap-1.5">
                      <input 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        className="flex-1 bg-white border border-blue-500 rounded-md px-2.5 py-1.5 text-[13px] outline-none shadow-sm" 
                        autoFocus 
                        onKeyDown={e => e.key === 'Enter' && handleRename(selectedFile.id)}
                      />
                      <button onClick={() => handleRename(selectedFile.id)} className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"><XIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold text-gray-900 break-words leading-snug">{selectedFile.fileName}</h4>
                    </div>
                    <button onClick={() => { setEditingId(selectedFile.id); setEditName(selectedFile.fileName); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md shrink-0 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-[12px] font-semibold text-gray-900">Properties</h4>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium">Type</span>
                    <span className="text-[13px] text-gray-900 uppercase mt-0.5">{selectedFile.fileType?.split('/')[1] || 'FILE'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium">Size</span>
                    <span className="text-[13px] text-gray-900 mt-0.5">{formatBytes(selectedFile.size || 1500000, 2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium">Location</span>
                    <span className="text-[13px] text-gray-900 mt-0.5 break-all">{selectedFile.category || 'Root'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium">Added</span>
                    <span className="text-[13px] text-gray-900 mt-0.5">{new Date(selectedFile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {selectedFile.metadata?.documentDate && (
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-medium">Document Date</span>
                      <span className="text-[13px] text-gray-900 mt-0.5">{selectedFile.metadata.documentDate}</span>
                    </div>
                  )}
                  {selectedFile.metadata?.priority && (
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-medium">Priority</span>
                      <span className="text-[13px] text-gray-900 mt-0.5 capitalize">{selectedFile.metadata.priority}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile.metadata?.tags && selectedFile.metadata.tags.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h4 className="text-[12px] font-semibold text-gray-900">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFile.metadata.tags.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedFile.metadata?.confidential && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-lg">
                    <Info className="w-4 h-4" />
                    <span className="text-[12px] font-semibold">Marked Confidential</span>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100"></div>

              <div className="flex flex-col gap-2 pt-2">
                <a 
                  href={selectedFile.cloudinaryUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  download
                  className="w-full flex items-center justify-center gap-2 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 text-[13px] font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-500" /> Download
                </a>
                <button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-2 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 text-[13px] font-medium rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 text-gray-500" /> Copy Link
                </button>
                <button 
                  onClick={() => handleDelete(selectedFile.id)}
                  className="w-full flex items-center justify-center gap-2 h-9 mt-2 hover:bg-red-50 text-red-600 text-[13px] font-medium rounded-lg transition-colors"
                >
                  <Trash className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleCreateFolder}
      />

      <UploadManagerModal
        isOpen={isUploadManagerOpen}
        onClose={() => setIsUploadManagerOpen(false)}
        onUploadSuccess={refetch}
        patients={patients}
        initialPatientId={selectedPatientId}
        currentPath={currentPath}
      />
    </div>
  );
}
