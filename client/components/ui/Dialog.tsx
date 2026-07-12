"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  type = "danger"
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const Icon = type === "danger" || type === "warning" ? AlertTriangle : Info;
  const iconColor = type === "danger" ? "text-red-600 bg-red-100" : type === "warning" ? "text-amber-600 bg-amber-100" : "text-blue-600 bg-blue-100";
  const btnColor = type === "danger" ? "bg-red-600 hover:bg-red-700" : type === "warning" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={!isLoading ? onCancel : undefined} />
      <div className="relative w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6">
          <div className="flex gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
               <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
              <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
           <button 
             onClick={onCancel}
             disabled={isLoading}
             className="px-4 py-2 rounded-[10px] text-[13px] font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
           >
             {cancelText}
           </button>
           <button 
             onClick={onConfirm}
             disabled={isLoading}
             className={`px-4 py-2 rounded-[10px] text-[13px] font-bold text-white flex items-center gap-2 disabled:opacity-50 transition-colors ${btnColor}`}
           >
             {isLoading ? (
               <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
             ) : null}
             {confirmText}
           </button>
        </div>
      </div>
    </div>
  );
}

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  buttonText?: string;
  onClose: () => void;
  type?: "success" | "error" | "info";
}

export function AlertDialog({
  isOpen,
  title,
  description,
  buttonText = "Okay",
  onClose,
  type = "info"
}: AlertDialogProps) {
  if (!isOpen) return null;

  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertTriangle : Info;
  const iconColor = type === "success" ? "text-emerald-600 bg-emerald-100" : type === "error" ? "text-red-600 bg-red-100" : "text-blue-600 bg-blue-100";
  const btnColor = type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : type === "error" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[16px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
           <X className="w-5 h-5" />
        </button>
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${iconColor}`}>
             <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-6">{description}</p>
          <button 
             onClick={onClose}
             className={`w-full py-2.5 rounded-[10px] text-[14px] font-bold text-white transition-colors ${btnColor}`}
           >
             {buttonText}
           </button>
        </div>
      </div>
    </div>
  );
}
