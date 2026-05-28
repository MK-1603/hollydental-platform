"use client";

import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import {
  FolderOpen, Download, FileText, X, RefreshCw,
  Image, File, Filter, Grid3X3, List, Eye, Shield,
} from "lucide-react";

interface PatientFile {
  id: string;
  fileName: string;
  fileType: string;
  category?: string;
  cloudinaryUrl: string;
  createdAt: string;
}

function normalize(raw: any): PatientFile[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.files)) return raw.files;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "x-ray":      { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  "xray":       { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  "photo":      { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500" },
  "consent":    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  "report":     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "invoice":    { bg: "bg-gold/10",    text: "text-yellow-700",  dot: "bg-gold" },
  "default":    { bg: "bg-gray-50",    text: "text-gray-600",    dot: "bg-gray-400" },
};

function getCategoryStyle(cat?: string) {
  const key = (cat || "").toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

function FileTypeIcon({ fileType, className }: { fileType: string; className?: string }) {
  if (fileType.startsWith("image/")) return <Image className={className || "w-5 h-5"} />;
  return <FileText className={className || "w-5 h-5"} />;
}

export default function PortalFilesPage() {
  const { user } = useAuthStore();
  const patientId = user?.patientProfile?.id;
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: files = [], loading, error, refetch } = useLiveData<PatientFile[]>(
    patientId ? `/files/patient/${patientId}` : null,
    { intervalMs: 30000, select: normalize, initialData: [] }
  );

  const sorted = useMemo(
    () => [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [files]
  );

  const categories = useMemo(() => {
    const cats = new Set(sorted.map((f) => f.category || "Other"));
    return ["All", ...Array.from(cats)];
  }, [sorted]);

  const filtered = activeCategory === "All" ? sorted : sorted.filter((f) => (f.category || "Other") === activeCategory);

  const handleDownload = async (file: PatientFile) => {
    try {
      const res = await fetch(file.cloudinaryUrl, { credentials: "omit" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(file.cloudinaryUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Premium header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Secure Vault</span>
            </div>
            <h1 className="font-serif text-2xl font-bold">My Clinical Files</h1>
            <p className="text-white/60 text-xs mt-1">X-rays, reports, and care documents shared by Dr. Roghay.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={refetch} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {sorted.length > 0 && (
          <div className="relative mt-4 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/10">
            <Shield className="w-4 h-4 text-gold shrink-0" />
            <span className="text-xs text-white/70">{sorted.length} file{sorted.length !== 1 ? "s" : ""} securely stored · End-to-end encrypted via Cloudinary</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
                  activeCategory === cat
                    ? "bg-navy text-white shadow"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow text-navy" : "text-gray-400 hover:text-navy"}`}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow text-navy" : "text-gray-400 hover:text-navy"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {loading && sorted.length === 0 ? (
        <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`shimmer rounded-2xl bg-gray-100 ${viewMode === "grid" ? "h-[240px]" : "h-[72px]"}`} />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-100 bg-red-50/40 rounded-2xl p-6 text-center text-xs text-red-600">
          We couldn&apos;t load your clinical files. Please try again in a moment.
        </div>
      ) : sorted.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl bg-white p-12 text-center space-y-3 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8 text-gray-200" />
          </div>
          <h3 className="font-serif text-base font-semibold text-navy">No Files Yet</h3>
          <p className="text-gray-500 text-xs leading-relaxed">
            Clinical documents and diagnostic photos will appear here once uploaded by Dr. Roghay.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-gray-100 rounded-2xl bg-white p-8 text-center">
          <p className="text-gray-400 text-xs">No files in this category.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((file) => <FileGridCard key={file.id} file={file} onPreview={setActiveImage} onDownload={handleDownload} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((file) => <FileListRow key={file.id} file={file} onPreview={setActiveImage} onDownload={handleDownload} />)}
        </div>
      )}

      {/* Lightbox */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setActiveImage(null)}>
          <button onClick={() => setActiveImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img src={activeImage} alt="Clinical Attachment" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function FileGridCard({ file, onPreview, onDownload }: { file: PatientFile; onPreview: (url: string) => void; onDownload: (f: PatientFile) => void }) {
  const isImage = (file.fileType || "").startsWith("image/");
  const catStyle = getCategoryStyle(file.category);

  return (
    <div className="group border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-gold/30 transition-all flex flex-col">
      {/* Preview area */}
      <div
        className={`relative aspect-video flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-50 ${isImage ? "cursor-pointer" : ""}`}
        onClick={() => isImage && onPreview(file.cloudinaryUrl)}
      >
        {isImage ? (
          <>
            <img src={file.cloudinaryUrl} alt={file.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-navy font-bold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
                <Eye className="w-3 h-3" /> Preview
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
              <FileText className="w-7 h-7 text-gold" />
            </div>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">{file.fileType?.split("/")[1] || "file"}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          {file.category && (
            <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
              {file.category}
            </span>
          )}
          <h4 className="font-serif text-xs font-bold text-navy mt-1.5 truncate" title={file.fileName}>
            {file.fileName}
          </h4>
          <span className="block text-[10px] text-gray-400 mt-0.5">
            {new Date(file.createdAt).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        <div className="flex gap-2 mt-auto">
          {isImage && (
            <button onClick={() => onPreview(file.cloudinaryUrl)} className="flex-1 border border-gray-200 hover:border-navy hover:text-navy text-gray-500 font-semibold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-colors">
              <Eye className="w-3 h-3" /> Preview
            </button>
          )}
          <button onClick={() => onDownload(file)} className={`${isImage ? "flex-1" : "w-full"} bg-navy hover:bg-gray-800 text-white font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-colors`}>
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function FileListRow({ file, onPreview, onDownload }: { file: PatientFile; onPreview: (url: string) => void; onDownload: (f: PatientFile) => void }) {
  const isImage = (file.fileType || "").startsWith("image/");
  const catStyle = getCategoryStyle(file.category);

  return (
    <div className="group border border-gray-100 bg-white rounded-xl hover:border-gold/30 hover:shadow-md transition-all flex items-center gap-4 px-4 py-3">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catStyle.bg}`}>
        <FileTypeIcon fileType={file.fileType} className={`w-5 h-5 ${catStyle.text}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-navy truncate">{file.fileName}</span>
          {file.category && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>{file.category}</span>
          )}
        </div>
        <span className="text-[10px] text-gray-400">
          {new Date(file.createdAt).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {isImage && (
          <button onClick={() => onPreview(file.cloudinaryUrl)} className="p-2 rounded-xl border border-gray-200 hover:border-navy hover:text-navy text-gray-400 transition-colors" title="Preview">
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => onDownload(file)} className="p-2 rounded-xl bg-navy hover:bg-gray-800 text-white transition-colors" title="Download">
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
