"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice, getProductById } from "@/catalog/catalog";
import { cartTotalMinor, getCartPrimaryAction } from "./cart";
import { useCart } from "./cart-provider";

export function CartCount() {
  const { items } = useCart();
  return <span aria-label={`${items.length} изделий в корзине`}>{items.length}</span>;
}

export function AddToCartButton({ productId }: { productId: string }) {
  const { add, items, ready } = useCart();
  const [announced, setAnnounced] = useState(false);
  const added = items.includes(productId);
  if (added) return <Link className="button button-primary button-wide" href="/cart/">В корзине · перейти</Link>;
  return <><noscript><p className="form-error">Для корзины нужен JavaScript. Без него можно отправить запрос через страницу контактов.</p></noscript><button className="button button-primary button-wide" type="button" disabled={!ready} onClick={() => { add(productId); setAnnounced(true); }}>{ready ? (announced ? "Добавлено" : "Добавить в корзину") : "Открываем корзину…"}</button></>;
}

export function CartPageClient({ isPreview, staticDemo = false }: { isPreview: boolean; staticDemo?: boolean }) {
  const { items, remove, ready } = useCart();
  const products = items.map(getProductById).filter(Boolean);
  if (!ready) return <p aria-live="polite">Открываем ваш выбор…</p>;
  if (products.length === 0) return <div className="empty-cart"><h2>Пока здесь тихо.</h2><p>Посмотрите изделия и выберите свою форму.</p><Link className="button button-primary" href="/catalog/?availability=in_stock">Смотреть в наличии</Link></div>;
  const total = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(cartTotalMinor(items) / 100);
  const action = getCartPrimaryAction(staticDemo);
  return <div className="cart-layout"><div className="cart-items">{products.map((product) => product && <article className="cart-item" key={product.id}><Image src={product.images[0].src} alt="" width={product.images[0].width} height={product.images[0].height} sizes="150px"/><div><p className="eyebrow">{product.sku}</p><h2>{product.title}</h2><p>{formatPrice(product)}</p><button type="button" className="remove-button" onClick={() => remove(product.id)}>Удалить</button></div></article>)}</div><aside className="cart-summary"><p className="eyebrow">Итого</p><strong>{total}</strong><p>{staticDemo ? "Это публичная демонстрация. Наличие и итог подтверждаются в переписке с мастерской." : isPreview ? "Финальная сумма всегда пересчитывается сервером. Доставка в preview не тарифицируется." : "Финальная сумма и наличие всегда повторно проверяются сервером."}</p><Link className="button button-primary button-wide" href={action.href}>{action.label}</Link></aside></div>;
}
