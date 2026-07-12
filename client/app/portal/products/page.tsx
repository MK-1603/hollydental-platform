"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ShoppingBag, Search, Phone, MapPin, Activity, Plus, Minus, ShoppingCart, Calendar, Check, Star, Shield, CreditCard, AlertCircle } from "lucide-react";
import { CLINIC } from "@/lib/constants";
import { toast } from "@/lib/toast";
import { useCartStore } from "@/store/useCartStore";

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

function formatPrice(price: string, priceTo?: string | null) {
  const lower = parseFloat(price).toFixed(2);
  if (priceTo && priceTo !== "" && priceTo !== "0.00") {
    return `€${lower} – €${parseFloat(priceTo).toFixed(2)}`;
  }
  return `€${lower}`;
}

const CATEGORY_FILTERS = ["All", "Procedures", "Shop"] as const;
type Filter = (typeof CATEGORY_FILTERS)[number];

export default function PatientProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const cartCount = useCartStore((s) => s.count());

  useEffect(() => {
    apiRequest("/products")
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "Procedures") list = list.filter((p) => p.category === "procedure");
    if (filter === "Shop") list = list.filter((p) => p.category !== "procedure");
    if (search.trim()) {
      const t = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(t) || p.description?.toLowerCase().includes(t)
      );
    }
    return list;
  }, [products, filter, search]);

  const procedures = filtered.filter((p) => p.category === "procedure");
  const extras = filtered.filter((p) => p.category !== "procedure");

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      
      {/* Immersive Storefront Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-navy text-white p-8 md:p-10 shadow-xl border border-navy/80">
        {/* Glowing Backdrops */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.15),_transparent_60%)] pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-gold/15 text-gold border border-gold/30 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
              <Activity className="w-3 h-3" />
              <span>HollyHill Clinical Storefront</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              Premium Oral Care Products
            </h1>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-light">
              Enhance your dental routine with professional treatments and dentist-approved retail products. 
              Enjoy free counter pickup and secure checkout verification.
            </p>
            
            {/* E-Commerce Benefits badges */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-gold shrink-0" /> Clinic Approved Quality</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gold shrink-0" /> Free counter Pickup</span>
              <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-gold shrink-0" /> Secure Card/UPI checkout</span>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3 shrink-0 self-start md:self-auto mt-2 sm:mt-0">
            <a
              href={CLINIC.phoneHref}
              className="w-10 h-10 rounded-xl border border-white/20 hover:border-gold hover:bg-gold/10 text-white transition-all bg-white/5 flex items-center justify-center shrink-0 shadow-sm"
              title={`Call Clinic: ${CLINIC.phone}`}
            >
              <Phone className="w-4 h-4 text-gold" />
            </a>
            
            {/* Highly visual Floating Cart badge */}
            <Link
              href="/portal/products/cart"
              className="relative h-10 inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-navy font-bold px-5 rounded-xl text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <ShoppingCart className="w-4 h-4 text-navy shrink-0 animate-bounce" /> 
              <span>Shopping Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Search & category filters toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search our catalog for treatments or products…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-medium shadow-2xs"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4.5 py-3 rounded-xl text-xs font-bold transition-all flex-1 md:flex-none ${
                filter === f
                  ? "bg-navy text-white shadow-md shadow-navy/10 scale-102"
                  : "bg-white border border-gray-200 text-navy hover:border-gold hover:text-gold"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Shimmer Loader */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[280px] shimmer rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-3xl p-16 text-center text-gray-400 text-xs shadow-2xs bg-white space-y-3">
          <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto" />
          <h3 className="font-serif text-base font-bold text-navy">No products matched search</h3>
          <p className="text-gray-400 max-w-xs mx-auto">Try typing another query or change your active category filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Dental Procedures grid section */}
          {(filter === "All" || filter === "Procedures") && procedures.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                icon={<Activity className="w-3.5 h-3.5" />}
                title="Dental Procedures"
                subtitle="Chairside treatments — book a consultation to schedule"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {procedures.map((p) => <ProcedureCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* Oral Care Retail Shop grid section */}
          {(filter === "All" || filter === "Shop") && extras.length > 0 && (
            <section className="space-y-5">
              <SectionHeader
                icon={<ShoppingBag className="w-3.5 h-3.5" />}
                title="Oral Care Shop"
                subtitle="Take-home products — add to cart and collect at the clinic"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {extras.map((p) => <ShopCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-end gap-3 border-b border-gray-100 pb-3 mt-4">
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-gold">
          {icon} {title}
        </span>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ── Procedure card — compact premium ── */
function ProcedureCard({ product }: { product: Product }) {
  return (
    <article className="group bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-gold/45 hover:-translate-y-1 transition-all duration-300 flex flex-col relative">
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(201,169,110,0.02),_transparent_60%)] pointer-events-none" />

      {/* Image showcasing */}
      <div className="relative aspect-square bg-gray-50/50 overflow-hidden p-2">
        <div className="w-full h-full rounded-2xl overflow-hidden relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gold/5">
              <Activity className="w-8 h-8 text-gold/30" />
            </div>
          )}
          
          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-navy via-slate-900 to-navy text-white text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md border border-white/10 flex items-center gap-1 z-10">
            <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
            Procedure
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4.5 flex-1 flex flex-col gap-2.5 relative z-10">
        <h3 className="font-serif text-xs font-bold text-navy leading-snug line-clamp-2 min-h-[32px] group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase">Fee:</span>
          <span className="text-base font-bold text-gold">{formatPrice(product.price, product.priceTo)}</span>
        </div>
        
        {/* Glowing Star Feedback */}
        <div className="flex items-center gap-1.5 text-[10px] text-gold font-bold">
          <div className="flex gap-0.5">
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
          </div>
          <span className="text-gray-400 font-sans font-medium">4.9 (18 consults)</span>
        </div>

        {product.description && (
          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{product.description}</p>
        )}
        
        <Link
          href="/portal/booking"
          className="mt-auto bg-navy hover:bg-gray-800 text-white font-bold py-3 px-3 rounded-xl text-[9px] uppercase tracking-widest transition-all duration-300 inline-flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
        >
          <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>Book Consultation</span>
        </Link>
      </div>
    </article>
  );
}

/* ── Shop card — compact premium ── */
function ShopCard({ product }: { product: Product }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);

  const inCart = items.find((i) => i.productId === product.id);
  const outOfStock = product.stockCount !== null && product.stockCount <= 0;

  const handleAdd = () => {
    addItem({ productId: product.id, name: product.name, price: parseFloat(product.price) || 0, imageUrl: product.imageUrl ?? null, stockCount: product.stockCount ?? null }, 1);
    toast.success(`Added ${product.name} to cart.`);
  };

  const handleBuyNow = () => {
    router.push(`/portal/products/checkout?productId=${product.id}`);
  };

  return (
    <article className={`group bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col relative ${
      outOfStock ? "opacity-60 grayscale-[35%] cursor-not-allowed border-red-50 bg-red-50/5" : "hover:border-gold/45 hover:-translate-y-1"
    }`}>
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(201,169,110,0.02),_transparent_60%)] pointer-events-none" />

      {/* Image container */}
      <div className="relative aspect-square bg-gray-50/50 overflow-hidden p-2">
        <div className="w-full h-full rounded-2xl overflow-hidden relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className={`w-full h-full object-cover transition-transform duration-500 ${!outOfStock && "group-hover:scale-106"}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gold/5">
              <ShoppingBag className="w-8 h-8 text-gold/30" />
            </div>
          )}
          
          {outOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="text-[9px] font-bold bg-red-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-red-400/20">
                Out of Stock
              </span>
            </div>
          )}
          
          {inCart && !outOfStock && (
            <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-emerald-400/20 animate-pulse z-10">
              In Cart
            </span>
          )}
          
          {product.stockCount > 0 && product.stockCount <= 5 && (
            <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-amber-400/20 animate-pulse z-10">
              Only {product.stockCount} Left
            </span>
          )}
        </div>
      </div>

      {/* Body details */}
      <div className="p-4.5 flex-1 flex flex-col gap-2.5 relative z-10">
        <h3 className="font-serif text-xs font-bold text-navy leading-snug line-clamp-2 min-h-[32px] group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase">Price:</span>
          <span className="text-base font-bold text-gold">{formatPrice(product.price, product.priceTo)}</span>
        </div>
        
        {/* Glowing star ratings */}
        <div className="flex items-center gap-1.5 text-[10px] text-gold font-bold">
          <div className="flex gap-0.5">
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
            <Star className="w-3 h-3 fill-gold text-gold shrink-0" />
          </div>
          <span className="text-gray-400 font-sans font-medium">4.9 (24 reviews)</span>
        </div>

        {product.description && (
          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{product.description}</p>
        )}

        <div className="mt-auto pt-1">
          {outOfStock ? (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl text-[9px] cursor-not-allowed flex items-center justify-center gap-1 border border-gray-200 uppercase tracking-widest"
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Unavailable</span>
            </button>
          ) : !inCart ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={handleAdd}
                className="w-full sm:flex-1 bg-navy hover:bg-gray-800 text-white font-bold py-3 px-2 rounded-xl text-[9px] uppercase tracking-widest transition-all duration-300 inline-flex items-center justify-center gap-1"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>Add</span>
              </button>
              
              <button
                onClick={handleBuyNow}
                className="w-full sm:flex-1 bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-navy font-bold py-3 px-2 rounded-xl text-[9px] transition-all duration-300 inline-flex items-center justify-center gap-1 shadow-sm hover:shadow font-sans uppercase tracking-widest"
              >
                <Activity className="w-3.5 h-3.5 text-navy shrink-0 animate-pulse" />
                <span>Buy Now</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl overflow-hidden w-full sm:w-auto shrink-0 h-10">
                <button onClick={() => decrement(product.id)} className="px-3 py-2 hover:bg-gray-100 text-navy flex-1 sm:flex-initial flex justify-center items-center">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 text-xs font-bold text-navy flex-1 sm:flex-initial text-center">{inCart.quantity}</span>
                <button
                  onClick={() => increment(product.id)}
                  disabled={!!product.stockCount && inCart.quantity >= product.stockCount}
                  className="px-3 py-2 hover:bg-gray-100 text-navy disabled:opacity-40 flex-1 sm:flex-initial flex justify-center items-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <button
                onClick={handleBuyNow}
                className="bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-navy font-bold py-3 px-2 rounded-xl text-[9px] transition-all duration-300 inline-flex items-center justify-center gap-1 shadow-sm w-full sm:flex-1 font-sans uppercase tracking-widest h-10"
              >
                <Activity className="w-3.5 h-3.5 text-navy shrink-0" />
                <span>Buy Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
