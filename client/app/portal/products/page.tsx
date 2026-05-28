"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import {
  ShoppingBag,
  Search,
  Phone,
  MapPin,
  Sparkles,
  Plus,
  Minus,
  ShoppingCart,
  Calendar,
  Check,
} from "lucide-react";
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
}

function formatPrice(price: string, priceTo?: string | null) {
  const lower = parseFloat(price).toFixed(2);
  if (priceTo && priceTo !== "" && priceTo !== "0.00") {
    return `€${lower} – €${parseFloat(priceTo).toFixed(2)}`;
  }
  return `€${lower}`;
}

export default function PatientProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = useCartStore((s) => s.count());

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

  const filteredProducts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [products, searchQuery]);

  const procedures = filteredProducts.filter(
    (p) => (p.category || "extra") === "procedure"
  );
  const extras = filteredProducts.filter(
    (p) => (p.category || "extra") !== "procedure"
  );

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Clinic header card */}
      <header className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-7 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-sans text-3xl md:text-4xl font-bold text-navy">
            {CLINIC.name}
          </h1>
          <a
            href={CLINIC.phoneHref}
            className="inline-flex items-center gap-2 border border-gray-200 hover:border-gold hover:text-gold text-navy text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-gold" /> {CLINIC.phone}
          </a>
        </div>
        <p className="inline-flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>{CLINIC.address}</span>
        </p>
      </header>

      {/* Search + Cart pill */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative max-w-md flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products & treatments…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>

        <Link
          href="/portal/products/cart"
          className="relative inline-flex items-center gap-2 bg-navy hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
        >
          <ShoppingCart className="w-4 h-4" /> Cart
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-gold text-navy text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[340px] shimmer rounded-2xl bg-gray-50" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
          No products match your search.
        </div>
      ) : (
        <div className="space-y-12">
          {procedures.length > 0 && (
            <ProductSection
              title="Dental Procedures"
              subtitle="Chairside treatments — book a consultation to schedule"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              products={procedures}
              variant="procedure"
            />
          )}

          {extras.length > 0 && (
            <ProductSection
              title="Shop"
              subtitle="Take-home oral care — add to cart and pay on pickup"
              icon={<ShoppingBag className="w-3.5 h-3.5" />}
              products={extras}
              variant="extra"
            />
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------- Section -------------------- */

function ProductSection({
  title,
  subtitle,
  icon,
  products,
  variant,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  products: Product[];
  variant: "procedure" | "extra";
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-gray-100 pb-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gold">
            {icon}
            {title}
          </span>
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-navy mt-1">
            {title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) =>
          variant === "procedure" ? (
            <ProcedureCard key={product.id} product={product} />
          ) : (
            <ShopCard key={product.id} product={product} />
          )
        )}
      </div>
    </section>
  );
}

/* -------------------- Procedure card -------------------- */

function ProcedureCard({ product }: { product: Product }) {
  return (
    <article className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gold/40 transition-all flex flex-col">
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-off-white">
            <Sparkles className="w-10 h-10 text-gold/40" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Procedure
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-sans text-base font-bold text-navy leading-snug">
          {product.name}
        </h3>
        <span className="font-sans text-lg font-bold text-gold">
          {formatPrice(product.price, product.priceTo)}
        </span>
        {product.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-4">
            {product.description}
          </p>
        )}

        <Link
          href="/portal/booking"
          className="mt-auto bg-navy hover:bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-4 h-4" /> Book consultation
        </Link>
      </div>
    </article>
  );
}

/* -------------------- Shop card with cart controls -------------------- */

function ShopCard({ product }: { product: Product }) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);

  const inCart = items.find((i) => i.productId === product.id);
  const stock = product.stockCount;
  const outOfStock = stock !== null && stock <= 0;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        imageUrl: product.imageUrl ?? null,
        stockCount: stock ?? null,
      },
      1
    );
    toast.success(`Added ${product.name} to cart.`);
  };

  return (
    <article className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gold/40 transition-all flex flex-col">
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-off-white">
            <ShoppingBag className="w-10 h-10 text-gold/40" />
          </div>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Out of stock
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-sans text-base font-bold text-navy leading-snug">
          {product.name}
        </h3>
        <span className="font-sans text-lg font-bold text-gold">
          {formatPrice(product.price, product.priceTo)}
        </span>
        {product.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          {!inCart ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-2.5 px-4 rounded-lg text-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              {outOfStock ? "Unavailable" : "Add to cart"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => decrement(product.id)}
                  className="px-3 py-2 hover:bg-gray-100 text-navy"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-sm font-bold text-navy w-8 text-center">
                  {inCart.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => increment(product.id)}
                  disabled={
                    !!stock && inCart.quantity >= (stock as number)
                  }
                  className="px-3 py-2 hover:bg-gray-100 text-navy disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> In cart
              </span>
            </div>
          )}
          {stock !== null && stock > 0 && (
            <span className="block text-[10px] text-gray-400 font-semibold mt-2">
              {stock} in stock
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
