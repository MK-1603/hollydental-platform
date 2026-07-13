"use client";

import { useState, useEffect } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Search, Filter, Plus, PackageOpen, Download, LayoutGrid, List, AlertCircle, ChevronRight, Phone, Mail, FileText, X, Building2, Edit3, Trash2, Save, Calendar, RefreshCw
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const { confirm } = useDialog();
  const { data: suppliers, loading, error, refetch } = useLiveData<any[]>("/suppliers", { initialData: [], intervalMs: 60000 });
  
  // Drawer state
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Edit/Add state
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", contactName: "", phone: "", email: "", status: "active" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (error) toast.error("Failed to load suppliers.");
  }, [error]);

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const handleOpenDetails = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({ 
      name: supplier.name || "", 
      contactName: supplier.contactName || "", 
      phone: supplier.phone || "", 
      email: supplier.email || "", 
      status: supplier.status || "active" 
    });
    setIsEditing(false);
    setIsAdding(false);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setFormData({ name: "", contactName: "", phone: "", email: "", status: "active" });
    setIsEditing(true);
    setIsAdding(true);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedSupplier(null);
      setIsEditing(false);
      setIsAdding(false);
    }, 300);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Supplier name is required.");
    setIsSaving(true);
    try {
      if (isAdding) {
        await apiRequest("/suppliers", { method: "POST", body: JSON.stringify(formData) });
        toast.success("Supplier added.");
      } else if (selectedSupplier) {
        await apiRequest(`/suppliers/${selectedSupplier.id}`, { method: "PUT", body: JSON.stringify(formData) });
        toast.success("Supplier updated.");
      }
      refetch();
      handleCloseDrawer();
    } catch (err: any) {
      toast.error(err.message || "Failed to save supplier.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Supplier",
      description: "Are you sure you want to delete this supplier? This action cannot be undone.",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      await apiRequest(`/suppliers/${id}`, { method: "DELETE" });
      toast.success("Supplier deleted.");
      refetch();
      handleCloseDrawer();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete supplier.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-3 p-4 md:p-6 border-b border-gray-200 bg-white shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] md:text-[20px] font-bold text-gray-900 font-serif truncate">Supplier Management</h1>
          <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5 truncate hidden sm:block">Manage vendor profiles, purchase history, and contact details.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="justify-center flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[12px] md:text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={handleOpenAdd} className="justify-center flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-[8px] text-[12px] md:text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Search & Filters */}
        <div className="flex flex-row items-center justify-between gap-2 mb-4 shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-[8px] pl-9 pr-8 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative shrink-0">
            <select
              className="appearance-none pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
          </div>
        </div>

        {/* Responsive Content Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {loading ? (
             <div className="flex-1 flex items-center justify-center text-[14px] text-gray-500 bg-white md:bg-transparent rounded-[16px] md:border md:border-gray-200 min-h-[200px]">
               Loading suppliers...
             </div>
          ) : filteredSuppliers.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[16px] border border-gray-200 shadow-sm min-h-[200px]">
               <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
               <p className="text-[16px] font-bold text-gray-900">No suppliers found</p>
               <p className="text-[14px] text-gray-500 mt-1 max-w-[250px]">Add a new supplier to get started.</p>
             </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden flex-1 overflow-y-auto flex flex-col gap-3 pb-[120px] custom-scrollbar pt-2 px-1">
                {filteredSuppliers.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => handleOpenDetails(s)}
                    className="bg-white rounded-[12px] border border-gray-200 shadow-sm cursor-pointer active:scale-[0.98] transition-transform p-4 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[8px] bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-1">{s.name}</h3>
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">ID: {s.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wide border ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 border-t border-gray-100 pt-3 mt-auto">
                       <p className="text-[12px] font-bold text-gray-900">{s.contactName || "No Contact Person"}</p>
                       <div className="flex items-center gap-3">
                         {s.phone && <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/> {s.phone}</p>}
                         {s.email && <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3"/> {s.email}</p>}
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:flex flex-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden flex-col">
                <div className="overflow-x-auto w-full custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50/80 sticky top-0 z-10 shadow-[0_1px_0_0_#e5e7eb]">
                      <tr>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact Details</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Order</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSuppliers.map((s) => (
                        <tr key={s.id} onClick={() => handleOpenDetails(s)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[10px] bg-blue-50/50 border border-blue-100 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{s.name}</p>
                                <p className="text-[12px] text-gray-500 font-mono mt-0.5">ID: {s.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-[13px] font-bold text-gray-700">{s.contactName || "No Contact Person"}</p>
                              <div className="flex items-center gap-3 text-[12px] text-gray-500">
                                {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>}
                                {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-medium text-gray-700">
                              {s.lastOrder ? new Date(s.lastOrder).toLocaleDateString() : "No Orders"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide border ${
                              s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}>
                              {s.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-[12px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-gray-700 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* iOS Style Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={handleCloseDrawer} />
          
          <div className="relative w-full max-w-md bg-white rounded-[20px] shadow-2xl flex flex-col max-h-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <h2 className="text-[18px] md:text-[20px] font-serif font-bold text-gray-900">
                {isAdding ? "New Supplier" : isEditing ? "Edit Supplier" : "Supplier Details"}
              </h2>
              <div className="flex items-center gap-2">
                {!isAdding && !isEditing && (
                  <>
                    <button onClick={() => handleDelete(selectedSupplier?.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[8px] transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={handleCloseDrawer} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[8px] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm" placeholder="e.g. Dentsply Sirona" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Contact Person</label>
                    <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm" placeholder="e.g. John Doe" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm" placeholder="+44..." />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Status</label>
                      <div className="relative">
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm" placeholder="orders@company.com" />
                  </div>
                </div>
              ) : selectedSupplier ? (
                <div className="space-y-8">
                  {/* Read-Only Profile */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[12px] bg-blue-50/50 border border-blue-100 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-gray-900">{selectedSupplier.name}</h3>
                      <p className="text-[13px] text-gray-500">Supplier ID: {selectedSupplier.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold mt-1 tracking-wide border ${
                          selectedSupplier.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {selectedSupplier.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4 space-y-4">
                    <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-2">Contact Information</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase">Phone</p>
                        <p className="text-[13px] font-bold text-gray-900">{selectedSupplier.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase">Email</p>
                        <p className="text-[13px] font-bold text-gray-900">{selectedSupplier.email || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                     <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-3">Recent Activity</h4>
                     <div className="border border-gray-100 rounded-[12px] overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center"><Calendar className="w-4 h-4 text-gray-400" /></div>
                              <div>
                                 <p className="text-[13px] font-bold text-gray-900">Last Order Date</p>
                                 <p className="text-[12px] text-gray-500">{selectedSupplier.lastOrder ? new Date(selectedSupplier.lastOrder).toLocaleDateString() : "No history"}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            {isEditing && (
              <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
                <button 
                  onClick={() => isAdding ? handleCloseDrawer() : setIsEditing(false)} 
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-[8px] text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C51DF] hover:bg-[#1542C2] text-white rounded-[8px] text-[13px] font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Supplier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
