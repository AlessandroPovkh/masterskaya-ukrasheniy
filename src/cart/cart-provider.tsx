"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { addItem, hydrateCart, removeItem, type Cart } from "./cart";

const STORAGE_KEY = "masterskaya-cart-v1";
const EMPTY_CART: Cart = [];
let currentCart: Cart = EMPTY_CART;
let loaded = false;
const listeners = new Set<() => void>();

function loadCart() {
  if (!loaded && typeof window !== "undefined") { currentCart = hydrateCart(localStorage.getItem(STORAGE_KEY)); loaded = true; }
}
function subscribe(listener: () => void) { loadCart(); listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { loadCart(); return currentCart; }
function setCart(next: Cart) { currentCart = next; loaded = true; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); listeners.forEach((listener) => listener()); }
type CartContextValue = { items: Cart; add: (id: string) => void; remove: (id: string) => void; clear: () => void; ready: boolean };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CART);
  const ready = true;
  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (id) => setCart(addItem(currentCart, id)),
    remove: (id) => setCart(removeItem(currentCart, id)),
    clear: () => setCart([]),
    ready,
  }), [items, ready]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
