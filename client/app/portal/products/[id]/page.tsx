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

  const goToCart = () => {
    handleAdd();
    router.push("/portal/products/cart");
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
    <div className="space-y-6 pb-16 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400">
        <Link
          href="/portal/products"
          className="hover:text-gold transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Products
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-navy font-semibold truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Image */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Package className="w-16 h-16 text-gray-200" />
                <p className="text-xs text-gray-300">No image available</p>
              </div>
            )}

            <div className="absolute top-4 left-4">
              {isProcedure ? (
                <span className="bg-navy text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Chairside procedure
                </span>
              ) : isOutOfStock ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Out of stock
                </span>
              ) : stock <= 5 ? (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Only {stock} left
                </span>
              ) : (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  In stock
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: "Clinic approved" },
              { icon: Star, label: "Quality assured" },
              { icon: Clock, label: "Fast pickup" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm"
              >
                <Icon className="w-4 h-4 text-gold mx-auto mb-1" />
                <p className="text-[9px] font-bold text-navy uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">
              {isProcedure ? "Dental procedure" : "Oral care product"}
            </p>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-navy leading-tight">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-2xl font-bold text-gold">
                {formatPrice(product.price, product.priceTo)}
              </span>
              {isProcedure && (
                <span className="text-sm text-gray-400">per session</span>
              )}
            </div>
          </div>

          {product.description && (
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {isProcedure ? (
            /* Procedure → book consultation only */
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                <div className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-navy" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy">
                    Book consultation
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Treatment is performed at the clinic
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Use the appointment booking system to schedule this procedure.
                Final pricing and treatment plan are confirmed at consultation.
              </p>
              <Link
                href="/portal/booking"
                className="w-full bg-navy hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4" /> Book consultation
              </Link>
            </div>
          ) : (
            /* Retail → add to cart */
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              {isOutOfStock ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center space-y-1">
                  <AlertCircle className="w-5 h-5 text-red-400 mx-auto" />
                  <p className="text-sm font-bold text-red-600">
                    Out of stock
                  </p>
                  <p className="text-xs text-red-400">
                    Contact the clinic to request this item.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider">
                      Quantity
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
                        onClick={() =>
                          setQuantity((q) => Math.min(stock, q + 1))
                        }
                        disabled={quantity >= stock}
                        className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-navy hover:border-navy hover:bg-navy/5 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-gray-400 font-semibold ml-1">
                        {stock} available
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between border border-gray-100">
                    <span className="text-xs text-gray-500 font-semibold">
                      Subtotal
                    </span>
                    <span className="font-bold text-navy text-xl">
                      €{(parseFloat(product.price) * quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="bg-white border border-gold text-navy hover:bg-gold/5 font-bold py-3 rounded-xl text-sm transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-4 h-4 text-gold" /> Add to
                      cart
                    </button>
                    <button
                      type="button"
                      onClick={goToCart}
                      className="bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-xl text-sm transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Buy now
                    </button>
                  </div>

                  {inCart && (
                    <p className="text-[11px] text-emerald-600 text-center font-semibold">
                      Currently {inCart.quantity} of this item in your cart.{" "}
                      <button
                        type="button"
                        onClick={() => setQty(product.id, 0)}
                        className="underline hover:text-emerald-700"
                      >
                        Remove
                      </button>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <Link
            href="/portal/orders"
            className="text-center text-xs text-gray-400 hover:text-gold transition-colors flex items-center justify-center gap-1"
          >
            <Package className="w-3.5 h-3.5" /> View your orders
          </Link>
        </div>
      </div>
    </div>
  );
}
