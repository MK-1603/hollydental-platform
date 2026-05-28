"use client";

import { useEffect, useState } from "react";
import { apiRequest, apiUpload } from "@/lib/api";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "@/lib/toast";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  priceTo?: string | null;
  imageUrl?: string | null;
  stockCount: number;
  category?: "procedure" | "extra" | string;
  displayOrder?: number;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600";

function formatPrice(price: string, priceTo?: string | null) {
  const lower = parseFloat(price).toFixed(2);
  if (priceTo && priceTo !== "" && priceTo !== "0.00") {
    return `€${lower} – €${parseFloat(priceTo).toFixed(2)}`;
  }
  return `€${lower}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<"procedure" | "extra">(
    "extra"
  );
  const [formPrice, setFormPrice] = useState("");
  const [formPriceTo, setFormPriceTo] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formDisplayOrder, setFormDisplayOrder] = useState("0");
  const [btnLoading, setBtnLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = await apiUpload("/products/upload", { file });
      if (data?.imageUrl) {
        setFormImageUrl(data.imageUrl);
        toast.success("Image uploaded successfully.");
      } else {
        throw new Error("Invalid response payload");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("extra");
    setFormPrice("");
    setFormPriceTo("");
    setFormImageUrl("");
    setFormStock("0");
    setFormDisplayOrder("0");
  };

  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setEditId(product.id);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormCategory(
      (product.category as "procedure" | "extra") || "extra"
    );
    setFormPrice(product.price);
    setFormPriceTo(product.priceTo || "");
    setFormImageUrl(product.imageUrl || "");
    setFormStock(String(product.stockCount));
    setFormDisplayOrder(String(product.displayOrder ?? 0));
  };

  const handleAddNew = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: "Delete Product?",
      message: "Are you sure you want to delete this product? This action is permanent.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted successfully.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete product.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      toast.error("Product name and price are required.");
      return;
    }
    if (formPriceTo && parseFloat(formPriceTo) < parseFloat(formPrice)) {
      toast.error("Upper price must be greater than or equal to price.");
      return;
    }
    setBtnLoading(true);
    try {
      const payload: Record<string, any> = {
        name: formName,
        description: formDescription,
        category: formCategory,
        price: formPrice,
        priceTo: formPriceTo || null,
        imageUrl: formImageUrl || PLACEHOLDER_IMAGE,
        stockCount: parseInt(formStock, 10) || 0,
        displayOrder: parseInt(formDisplayOrder, 10) || 0,
      };

      if (editId) {
        const result = (await apiRequest(`/products/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })) as Product;
        setProducts((prev) => prev.map((p) => (p.id === editId ? result : p)));
        toast.success("Product details updated.");
      } else {
        const result = (await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        })) as Product;
        setProducts((prev) => [result, ...prev]);
        toast.success("New product registered successfully.");
      }
      setIsEditing(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save product.");
    } finally {
      setBtnLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <header className="border-b border-gray-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <ShoppingBag className="w-3 h-3" /> Catalog Manager
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy mt-1">
            Clinical Products
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Manage chairside procedures (with price ranges) and take-home
            extras patients can reserve.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            className="bg-gold hover:bg-gold-dark text-navy font-bold px-4 py-2.5 rounded-lg text-xs shadow flex items-center gap-1.5 focus:outline-none"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </header>

      {isEditing ? (
        <div className="border border-gray-200 bg-white rounded-2xl p-6 max-w-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-serif text-base font-bold text-navy">
              {editId ? `Editing: ${formName}` : "Add new product"}
            </h3>
            <button
              onClick={() => {
                setIsEditing(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-navy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-4 text-xs text-navy font-semibold"
          >
            <div className="space-y-1.5">
              <label>Product Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Pola Light Teeth Whitening Kit"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label>Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) =>
                    setFormCategory(e.target.value as "procedure" | "extra")
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold"
                >
                  <option value="extra">Extra (retail item)</option>
                  <option value="procedure">Procedure (chairside)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label>Display Order</label>
                <input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label>Description</label>
              <textarea
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Indications, ingredients, what's included…"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label>Price (&euro;) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label>Upper price (&euro;)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPriceTo}
                  onChange={(e) => setFormPriceTo(e.target.value)}
                  placeholder="optional"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label>Stock count</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="0"
                  disabled={formCategory === "procedure"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-navy focus:outline-none focus:bg-white focus:border-gold disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label>Product Image</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="w-16 h-16 border border-gray-200 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                  {formImageUrl ? (
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="product-image-file"
                    />
                    <label
                      htmlFor="product-image-file"
                      className="cursor-pointer bg-white hover:bg-gray-50 text-navy border border-gray-200 hover:border-gold font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-gold" /> Upload Image
                    </label>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl("")}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Or enter image URL manually..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-navy focus:outline-none focus:border-gold placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  resetForm();
                }}
                className="border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={btnLoading}
                className="bg-gold hover:bg-gold-dark text-navy font-bold px-6 py-2.5 rounded-lg text-xs shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {btnLoading ? "Saving…" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 shimmer rounded-xl bg-gray-50" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No products yet. Add the clinic's first item to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full group">
                  <div>
                    {/* Product Image and Category */}
                    <div className="relative aspect-video w-full rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center mb-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      )}
                      <span className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider shadow-sm ${
                        product.category === "procedure" ? "bg-navy text-white" : "bg-gold text-navy"
                      }`}>
                        {product.category === "procedure" ? "Procedure" : "Retail Extra"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="font-serif text-sm font-bold text-navy group-hover:text-gold transition-colors truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-normal line-clamp-2 h-8 leading-relaxed" title={product.description || ""}>
                        {product.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-50 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Price</span>
                        <span className="font-serif font-bold text-navy text-sm mt-0.5">{formatPrice(product.price, product.priceTo)}</span>
                      </div>
                      {product.category !== "procedure" && (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Stock</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] mt-0.5 ${
                            product.stockCount === 0 ? "bg-red-50 text-red-600"
                            : product.stockCount <= 5 ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {product.stockCount} left
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gold/30 text-gold text-[10px] font-bold hover:bg-gold/5 active:scale-[0.98] transition-all duration-150">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 text-red-500 text-[10px] font-bold hover:bg-red-50 active:scale-[0.98] transition-all duration-150">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
