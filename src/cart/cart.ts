import { getProductById, isPurchasable } from "@/catalog/catalog";

export type Cart = string[];

export function addItem(cart: Cart, productId: string): Cart {
  const product = getProductById(productId);
  if (!product || !isPurchasable(product) || cart.includes(productId)) return cart;
  return [...cart, productId];
}

export const removeItem = (cart: Cart, productId: string): Cart => cart.filter((id) => id !== productId);

export function hydrateCart(raw: string | null): Cart {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.reduce<Cart>((cart, id) => (typeof id === "string" ? addItem(cart, id) : cart), []);
  } catch {
    return [];
  }
}

export const cartTotalMinor = (cart: Cart) =>
  cart.reduce((total, id) => {
    const product = getProductById(id);
    return total + (product && isPurchasable(product) ? product.priceMinor! : 0);
  }, 0);

export function getCartPrimaryAction(staticDemo: boolean) {
  return staticDemo
    ? { href: "/contacts/", label: "Обсудить заказ" }
    : { href: "/checkout/", label: "Перейти к оформлению" };
}
