"use client";

import { useState, useEffect } from "react";
import { Folder, X, FolderPlus, Tag } from "lucide-react";
import { toast } from "@/lib/toast";

export interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderData: any) => Promise<void>;
  initialData?: any;
}

export default function FolderModal({ isOpen, onClose, onSave, initialData }: FolderModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("blue");
  const [folderType, setFolderType] = useState("other");
  const [visibility, setVisibility] = useState("private");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setDescription(initialData?.description || "");
      setColor(initialData?.color || "blue");
      setFolderType(initialData?.folderType || "other");
      setVisibility(initialData?.visibility || "private");
      setTags(initialData?.tags || []);
      setTagInput("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Folder name is required.");
    
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        color,
        folderType,
        visibility,
        tags
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    { value: "blue", hex: "bg-blue-500" },
    { value: "red", hex: "bg-red-500" },
    { value: "green", hex: "bg-green-500" },
    { value: "yellow", hex: "bg-yellow-500" },
    { value: "purple", hex: "bg-purple-500" },
    { value: "gray", hex: "bg-gray-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100 text-${color}-600 shadow-sm`}>
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">
                {initialData ? "Edit Folder" : "Create New Folder"}
              </h2>
              <p className="text-[13px] text-gray-500 font-medium">Organize patient documents securely.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="folder-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Folder Name *</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2024 Lab Reports"
                className="w-full bg-white border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some context about what belongs in this folder..."
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Folder Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-6 h-6 rounded-full ${c.hex} transition-transform hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                      title={c.value}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Visibility</label>
                <div className="flex bg-gray-100 p-1 rounded-[10px]">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-colors ${visibility === 'private' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("shared")}
                    className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-colors ${visibility === 'shared' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Shared
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Folder Type</label>
              <select
                value={folderType}
                onChange={(e) => setFolderType(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[14px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="images">Images</option>
                <option value="xrays">X-Rays</option>
                <option value="reports">Reports</option>
                <option value="consent">Consent Forms</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </label>
              <div className="border border-gray-200 rounded-[10px] p-2 bg-white flex flex-wrap gap-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[12px] font-medium rounded-md">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-indigo-400 hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter"
                  className="flex-1 min-w-[120px] outline-none text-[13px] bg-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 mt-auto shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[14px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-[10px] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="folder-form"
            disabled={loading}
            className="px-6 py-2 text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-[10px] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-indigo-600/20"
          >
            {loading ? "Saving..." : (initialData ? "Save Changes" : "Create Folder")}
          </button>
        </div>
      </div>
    </div>
  );
}
