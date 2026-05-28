"use client";

import { useEffect, useState, use } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useCartStore } from "@/store/useCartStore";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  CheckCircle2,
  AlertCircle,
  Star,
  Shield,
  Clock,
  ChevronRight,
  Minus,
  Plus,
  Calendar,
  Sparkles,
} from "lucide-react";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const setQty = useCartStore((s) => s.setQuantity);

  const inCart = product
    ? items.find((i) => i.productId === product.id)
    : undefined;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/products/${id}`);
      setProduct(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const isProcedure = product?.category === "procedure";
  const isOutOfStock = !isProcedure && (product?.stockCount ?? 0) === 0;
  const stock = product?.stockCount ?? 0;

  const handleAdd = () => {
    if (!product) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        imageUrl: product.imageUrl ?? null,
        stockCount: stock,
      },
      quantity
    );
    toast.success(`Added ${quantity} × ${product.name} to cart.`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    router.push(`/portal/products/checkout?productId=${product.id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <div className="h-8 shimmer rounded-xl w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square shimmer rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 shimmer rounded-xl w-3/4" />
            <div className="h-6 shimmer rounded-xl w-1/3" />
            <div className="h-24 shimmer rounded-xl" />
            <div className="h-12 shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center font-sans">
        <AlertCircle className="w-12 h-12 text-gray-200" />
        <h2 className="font-sans text-xl font-bold text-navy">
          Product not found
        </h2>
        <p className="text-gray-400 text-sm">
          This product may have been removed.
        </p>
        <Link
          href="/portal/products"
          className="bg-gold text-navy font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-gold-dark transition-colors"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans relative">
      
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.03),_transparent_65%)] pointer-events-none" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link
          href="/portal/products"
          className="hover:text-gold transition-colors flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Products
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-navy font-bold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Luxury Presentation showcase card */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xs hover:shadow-xl transition-all duration-500 relative overflow-hidden">
        
        {/* Hologram aesthetic lines */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-navy via-gold to-navy" />
        <div className="absolute right-4 top-4 text-gray-50 pointer-events-none">
          <Sparkles className="w-32 h-32 opacity-10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Left Column: Image Showcase & Benefit Badges (Spans 5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Aspect Square Image showcase container */}
            <div className="relative aspect-square bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner p-2 group">
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gold/5">
                    <Package className="w-16 h-16 text-gold/30" />
                    <p className="text-xs text-gray-400 font-semibold">No image available</p>
                  </div>
                )}

                {/* Floating stock availability tag */}
                <div className="absolute top-3 left-3 z-10">
                  {isProcedure ? (
                    <span className="bg-gradient-to-r from-navy to-slate-900 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      Chairside Treatment
                    </span>
                  ) : isOutOfStock ? (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                      Out of Stock
                    </span>
                  ) : stock <= 5 ? (
                    <span className="bg-amber-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md animate-pulse">
                      Only {stock} Left
                    </span>
                  ) : (
                    <span className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                      In Stock
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Benefit Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Shield, label: "Clinic Approved", desc: "Dentist verified" },
                { icon: Star, label: "Quality Assured", desc: "Premium grade" },
                { icon: Clock, label: "Fast Pickup", desc: "Ready in 24h" },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 text-center shadow-2xs hover:border-gold/30 hover:bg-gold/5 transition-all duration-300"
                >
                  <Icon className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-[9px] font-bold text-navy uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-[7px] text-gray-400 font-semibold mt-0.5">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Info, Specifications, & Payment Forms (Spans 7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Title & Metadata */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {isProcedure ? "Dental Procedure" : "Oral Care Shop Product"}
              </span>
              
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy leading-snug">
                {product.name}
              </h1>

              {/* Glowing Ratings */}
              <div className="flex items-center gap-1.5 text-xs text-gold font-bold">
                <div className="flex gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                </div>
                <span className="text-gray-400 font-sans font-medium">4.9 (48 verified patient reviews)</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4.5 flex items-baseline justify-between">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Unit Price / Fee</span>
                <span className="font-serif text-2xl font-bold text-navy">
                  {formatPrice(product.price, product.priceTo)}
                </span>
              </div>
              
              {isProcedure ? (
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">Consultation Required</span>
              ) : (
                <span className="text-xs text-gold font-bold bg-gold/10 px-2.5 py-1 rounded border border-gold/20">Free Counter Pickup</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-navy uppercase tracking-widest">Clinical description</span>
                <p className="text-sm text-gray-500 leading-relaxed font-light">
                  {product.description}
                </p>
              </div>
            )}

            {/* Booking or Retail Purchase Actions wrapper */}
            {isProcedure ? (
              
              /* Procedures Actions block */
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center border border-gold/20">
                    <Sparkles className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy">Book Clinic Appointment</p>
                    <p className="text-[9px] text-gray-400">Treatment conducted chairside at Cork clinic</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed">
                  To undergo this procedure, book a dental consultation appointment. Final treatment plans, pricing, and timing coordinates will be verified by clinical staff at checkout.
                </p>
                
                <Link
                  href="/portal/booking"
                  className="w-full bg-navy hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Calendar className="w-4 h-4 text-gold shrink-0" />
                  <span>Book Dental Appointment</span>
                </Link>
              </div>
            ) : (
              
              /* Retail Products Actions block */
              <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-4">
                {isOutOfStock ? (
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 text-center space-y-1">
                    <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                    <p className="text-sm font-bold text-red-650">Out of Stock</p>
                    <p className="text-xs text-red-400">Please contact our Hollyhill reception desk to request this item.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider">
                        Quantity Selection
                      </label>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-navy hover:border-navy hover:bg-navy/5 transition-colors disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span className="font-bold text-navy text-lg min-w-[32px] text-center">
                          {quantity}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                          disabled={quantity >= stock}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-navy hover:border-navy hover:bg-navy/5 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        
                        <span className="text-[10px] text-gray-400 font-semibold ml-1">
                          ({stock} units available at front counter)
                        </span>
                      </div>
                    </div>

                    {/* Calculated subtotal indicator */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-semibold">Subtotal</span>
                      <span className="font-bold text-navy text-xl">
                        €{(parseFloat(product.price) * quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Integrated Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="bg-white border-2 border-gold text-navy hover:bg-gold/5 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-4 h-4 text-gold shrink-0" />
                        <span>Add to Cart</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        className="bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-navy font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
                      >
                        <Sparkles className="w-4 h-4 text-navy shrink-0 animate-pulse" />
                        <span>Buy Now Instantly</span>
                      </button>
                    </div>

                    {inCart && (
                      <p className="text-[11px] text-emerald-600 text-center font-semibold border-t border-gray-50 pt-3">
                        Currently {inCart.quantity} of this item in your shopping cart.{" "}
                        <button
                          type="button"
                          onClick={() => setQty(product.id, 0)}
                          className="underline hover:text-emerald-700 font-bold ml-1"
                        >
                          Remove all
                        </button>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <Link
              href="/portal/orders"
              className="text-center text-xs text-gray-400 hover:text-gold transition-colors flex items-center justify-center gap-1 mt-2"
            >
              <Package className="w-3.5 h-3.5" /> View your direct e-commerce orders
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
