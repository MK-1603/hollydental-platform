"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  /** Quantity available the last time we synced — used to clamp the input. */
  stockCount?: number | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  /** Add a product. If it already exists, bump its quantity. */
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  /** Set an exact quantity. Removes the line when qty <= 0. */
  setQuantity: (productId: string, qty: number) => void;
  /** Increment / decrement helpers. */
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Derived totals. */
  count: () => number;
  subtotal: () => number;
}

const clampQty = (qty: number, max?: number | null) => {
  const safe = Math.max(0, Math.floor(qty || 0));
  if (max && max > 0) return Math.min(safe, max);
  return Math.min(safe, 99);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: clampQty(
                        i.quantity + qty,
                        item.stockCount ?? i.stockCount
                      ),
                      // Refresh stock + price snapshots on every add.
                      stockCount: item.stockCount ?? i.stockCount,
                      price: item.price,
                      imageUrl: item.imageUrl ?? i.imageUrl,
                      name: item.name ?? i.name,
                    }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: clampQty(qty, item.stockCount) },
            ],
          };
        }),

      setQuantity: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: clampQty(qty, i.stockCount) }
                : i
            ),
          };
        }),

      increment: (productId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: clampQty(i.quantity + 1, i.stockCount) }
              : i
          ),
        })),

      decrement: (productId) =>
        set((state) => {
          const next = state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            )
            .filter((i) => i.quantity > 0);
          return { items: next };
        }),

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clear: () => set({ items: [] }),

      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    {
      name: "hollyhill-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
