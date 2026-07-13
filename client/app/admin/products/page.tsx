"use client";

import { useState, useEffect } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { apiRequest, apiUpload } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useDialog } from "@/components/DialogProvider";
import { 
  Search, Plus, Package, Edit3, Trash2, X, Filter, Download, 
  Image as ImageIcon, RefreshCw, Save, Archive, History, Check, Copy, ChevronDown
} from "lucide-react";
import { generateTablePDF } from "@/lib/pdf";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const { confirm } = useDialog();
  const { data: products, loading, error, refetch } = useLiveData<any[]>("/products", { initialData: [], intervalMs: 60000 });
  
  // Drawer state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Edit/Add state
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", category: "extra",
    price: "", priceTo: "", imageUrl: "", stockCount: "0", displayOrder: "0"
  });

  useEffect(() => {
    if (error) toast.error("Failed to load clinical catalog.");
  }, [error]);

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesFilter;
  }) || [];

  const handleOpenDetails = (product: any) => {
    setSelectedProduct(product);
    setFormData({ 
      name: product.name || "", 
      description: product.description || "", 
      category: product.category || "extra", 
      price: product.price || "", 
      priceTo: product.priceTo || "", 
      imageUrl: product.imageUrl || "", 
      stockCount: (product.stockCount || 0).toString(),
      displayOrder: (product.displayOrder || 0).toString()
    });
    setIsEditing(false);
    setIsAdding(false);
    setIsDrawerOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setFormData({ name: "", description: "", category: "extra", price: "", priceTo: "", imageUrl: "", stockCount: "0", displayOrder: "0" });
    setIsEditing(true);
    setIsAdding(true);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
      setIsEditing(false);
      setIsAdding(false);
    }, 300);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = await apiUpload("/products/upload", { file });
      if (data?.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
        toast.success("Image uploaded successfully.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) return toast.error("Name and price are required.");
    setIsSaving(true);
    try {
      if (isAdding) {
        await apiRequest("/products", { method: "POST", body: JSON.stringify(formData) });
        toast.success("Item added to catalog.");
      } else if (selectedProduct) {
        await apiRequest(`/products/${selectedProduct.id}`, { method: "PUT", body: JSON.stringify(formData) });
        toast.success("Item updated.");
      }
      refetch();
      handleCloseDrawer();
    } catch (err: any) {
      toast.error(err.message || "Failed to save item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Product",
      description: "Are you sure you want to permanently delete this item?",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE" });
      toast.success("Item deleted.");
      refetch();
      handleCloseDrawer();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item.");
    }
  };

  const handleDuplicate = () => {
    if (!selectedProduct) return;
    setIsAdding(true);
    setIsEditing(true);
    setFormData(prev => ({ ...prev, name: prev.name + " (Copy)" }));
    toast.success("Item duplicated. Make your changes and save.");
  };

  const handleExport = () => {
    generateTablePDF({
      title: "Clinical Catalog & Inventory",
      columns: ["Product/Service", "Category", "Price", "Stock"],
      rows: filteredProducts.map((p) => [
        p.name,
        p.category,
        p.price ? `€${Number(p.price).toFixed(2)}` : "—",
        p.stockCount || "0",
      ]),
      filename: "HollyDental-Catalog",
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] relative overflow-hidden h-full">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 border-b border-gray-200 bg-white shrink-0">
        <div className="min-w-0">
          <h1 className="text-[18px] md:text-[20px] font-bold text-gray-900 font-serif truncate">Clinical Catalog & Inventory</h1>
          <p className="text-[12px] md:text-[13px] text-gray-500 mt-1 truncate">Manage procedures, materials, and retail items.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[12px] md:text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleOpenAdd} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-[8px] text-[12px] md:text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Item
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
              placeholder="Search catalog..."
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
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              <option value="all">All</option>
              <option value="procedure">Clinical</option>
              <option value="extra">Retail</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Responsive Content Container */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          
          {loading ? (
             <div className="flex-1 flex items-center justify-center text-[14px] text-gray-500 bg-white md:bg-transparent rounded-[16px] md:border md:border-gray-200">
               <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading catalog...
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[16px] border border-gray-200 shadow-sm">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-[16px] font-bold text-gray-900">No items found</p>
                <p className="text-[14px] text-gray-500 mt-1 max-w-[250px]">Try adjusting your search or filter, or add a new item.</p>
             </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-[80px] custom-scrollbar -mx-1 px-1">
                {filteredProducts.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => handleOpenDetails(p)}
                    className="bg-white rounded-[16px] p-4 border border-gray-200 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start gap-4">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-[12px] object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-[12px] bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-[14px] font-bold text-gray-900 leading-tight">{p.name}</h3>
                          <span className="text-[14px] font-bold text-gray-900 shrink-0">
                            €{parseFloat(p.price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-1 mb-2">SKU: {p.id.slice(0, 8).toUpperCase()}</p>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wide border ${
                            p.category === 'procedure' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {p.category === 'procedure' ? 'Procedure' : 'Retail'}
                          </span>
                          
                          {p.category === 'procedure' ? (
                            <span className="text-[11px] font-medium text-gray-500 italic">Unlimited</span>
                          ) : (
                            <span className={`text-[11px] font-bold ${p.stockCount > 10 ? 'text-emerald-600' : p.stockCount > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                              {p.stockCount} in stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:flex flex-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-gray-50/80 sticky top-0 z-10 shadow-[0_1px_0_0_#e5e7eb]">
                      <tr>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Details</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type / Category</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Inventory / Stock</th>
                        <th className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} onClick={() => handleOpenDetails(p)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-[8px] object-cover border border-gray-200 shadow-sm" />
                              ) : (
                                <div className="w-10 h-10 rounded-[8px] bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">SKU: {p.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide border ${
                              p.category === 'procedure' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {p.category === 'procedure' ? 'Clinical Procedure' : 'Retail Extra'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-bold text-gray-900">
                              €{parseFloat(p.price).toFixed(2)}
                              {p.priceTo ? ` - €${parseFloat(p.priceTo).toFixed(2)}` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {p.category === 'procedure' ? (
                              <span className="text-[12px] font-medium text-gray-500 italic">Unlimited</span>
                            ) : (
                              <div className="flex flex-col">
                                <span className={`text-[13px] font-bold ${p.stockCount > 10 ? 'text-emerald-600' : p.stockCount > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {p.stockCount} in stock
                                </span>
                                {p.stockCount <= 5 && <span className="text-[11px] text-red-500 font-medium mt-0.5">Low inventory</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-[12px] font-bold px-3 py-1.5 border border-gray-200 rounded-[8px] bg-white text-gray-700 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                              View
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

      {/* Right Drawer Slide-over */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={handleCloseDrawer} />
          
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[16px] font-bold text-gray-900">
                {isAdding ? "New Item" : isEditing ? "Edit Item" : "Item Details"}
              </h2>
              <div className="flex items-center gap-2">
                {!isAdding && !isEditing && (
                  <>
                    <button onClick={handleDuplicate} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[8px] transition-colors" title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(selectedProduct?.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[8px] transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={handleCloseDrawer} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[8px] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {isEditing ? (
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-[16px] bg-gray-50 hover:bg-gray-100 transition-colors relative group overflow-hidden">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-[13px] font-bold text-gray-700">Upload Image</p>
                        <p className="text-[11px] text-gray-500 mt-1 text-center">SVG, PNG, JPG (Max 5MB)</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Item Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="e.g. Ultrasonic Scaling" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none">
                        <option value="procedure">Procedure</option>
                        <option value="extra">Retail Extra</option>
                      </select>
                    </div>
                    {formData.category === "extra" && (
                      <div>
                        <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Stock Count</label>
                        <input type="number" min="0" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Price (€) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Max Price (Optional)</label>
                      <input type="number" step="0.01" min="0" value={formData.priceTo} onChange={e => setFormData({...formData, priceTo: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" placeholder="0.00" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Description / Clinical Notes</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[10px] text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm resize-none" placeholder="Provide clinical details or usage instructions..."></textarea>
                  </div>
                </div>
              ) : selectedProduct ? (
                <div className="space-y-8">
                  {/* Read-Only Profile */}
                  {selectedProduct.imageUrl ? (
                    <div className="w-full h-48 rounded-[16px] overflow-hidden border border-gray-200 shadow-sm relative">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-[16px] bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[20px] font-bold text-gray-900">{selectedProduct.name}</h3>
                        <p className="text-[13px] text-gray-500 font-mono mt-1">SKU: {selectedProduct.id.slice(0, 12).toUpperCase()}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-[8px] text-[12px] font-bold tracking-wide border ${
                          selectedProduct.category === 'procedure' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {selectedProduct.category === 'procedure' ? 'Procedure' : 'Retail'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4">
                      <p className="text-[11px] font-bold text-gray-500 uppercase">Pricing</p>
                      <p className="text-[18px] font-bold text-gray-900 mt-1">
                        €{parseFloat(selectedProduct.price).toFixed(2)}
                        {selectedProduct.priceTo ? ` - €${parseFloat(selectedProduct.priceTo).toFixed(2)}` : ''}
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-[12px] p-4">
                      <p className="text-[11px] font-bold text-gray-500 uppercase">Inventory</p>
                      <p className="text-[18px] font-bold text-gray-900 mt-1">
                        {selectedProduct.category === 'procedure' ? '∞' : selectedProduct.stockCount}
                      </p>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-[13px] text-gray-600 leading-relaxed bg-white border border-gray-100 p-4 rounded-[12px] shadow-sm">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  <div>
                     <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider mb-3">Item History</h4>
                     <div className="border border-gray-100 rounded-[12px] overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center"><History className="w-4 h-4 text-gray-400" /></div>
                              <div>
                                 <p className="text-[13px] font-bold text-gray-900">Created At</p>
                                 <p className="text-[12px] text-gray-500">{new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Drawer Footer */}
            {isEditing && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button 
                  onClick={() => isAdding ? handleCloseDrawer() : setIsEditing(false)} 
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-[10px] text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-[10px] text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Item
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
