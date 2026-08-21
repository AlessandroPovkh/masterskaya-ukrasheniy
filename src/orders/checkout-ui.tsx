"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, getProductById } from "@/catalog/catalog";
import { cartTotalMinor } from "@/cart/cart";
import { useCart } from "@/cart/cart-provider";

export function CheckoutClient({ isPreview }: { isPreview: boolean }) {
  const { items, ready } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef<string>("");
  const products = items.map(getProductById).filter(Boolean);
  const total = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(cartTotalMinor(items) / 100);

  const begin = async () => {
    if (!attempt.current) attempt.current = crypto.randomUUID();
    setPending(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemIds: items, idempotenceKey: attempt.current }) });
      const result = await response.json() as { confirmationUrl?: string; error?: string };
      if (!response.ok || !result.confirmationUrl) throw new Error(result.error || "Не удалось открыть оплату");
      const destination = new URL(result.confirmationUrl, window.location.origin);
      if (destination.origin === window.location.origin) router.push(`${destination.pathname}${destination.search}`);
      else window.location.assign(destination.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать оплату");
      setPending(false);
    }
  };

  if (!ready) return <p>Проверяем корзину…</p>;
  if (!products.length) return <div className="empty-cart"><h2>Корзина пуста.</h2><Link className="button button-primary" href="/catalog/?availability=in_stock">Вернуться к изделиям</Link></div>;
  return <div className="checkout-layout"><section><h2>Ваш выбор</h2>{products.map((product) => product && <div className="checkout-row" key={product.id}><span>{product.title}</span><span>{formatPrice(product)}</span></div>)}<div className="checkout-total"><span>Итого</span><strong>{total}</strong></div></section><aside className="checkout-panel"><p className="eyebrow">{isPreview ? "Без личных данных" : "Защищённая оплата"}</p><h2>{isPreview ? "Тестовая оплата" : "Оплата заказа"}</h2><p>{isPreview ? "Preview не собирает имя, телефон или адрес. После подтверждения документов здесь появятся доставка по России/СНГ и чековые данные." : "Платёж откроется на защищённой странице ЮKassa. Итог и наличие повторно проверяются сервером."}</p><button className="button button-primary button-wide" type="button" disabled={pending} onClick={begin}>{pending ? "Создаём платёж…" : `${isPreview ? "Перейти к тестовой оплате" : "Перейти к оплате"} · ${total}`}</button>{error && <p className="form-error" role="alert">{error}</p>}<p className="fine-print">Итог пересчитывается сервером. Повторный клик не создаёт второй платёж.</p></aside></div>;
}

export function MockPaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const complete = async () => { setPending(true); const response = await fetch("/api/payments/mock/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) }); if (response.ok) router.push(`/checkout/return/?order=${encodeURIComponent(orderId)}`); else { setError("Не удалось завершить тестовый платёж"); setPending(false); } };
  return <div className="mock-card"><span className="mock-seal">TEST</span><p className="eyebrow">Mock provider</p><h1>Подтвердить тестовый платёж</h1><p>Деньги не списываются. Это проверка полного пути заказа, статуса и возврата.</p><button className="button button-primary button-wide" type="button" disabled={pending} onClick={complete}>{pending ? "Подтверждаем…" : "Оплатить тестовый заказ"}</button>{error&&<p role="alert" className="form-error">{error}</p>}<Link className="text-link" href="/cart/">Вернуться в корзину</Link></div>;
}

export function ReturnStatusClient({ orderId, isPreview }: { orderId: string; isPreview: boolean }) {
  const { clear } = useCart(); const [status, setStatus] = useState("payment_pending"); const [error, setError] = useState("");
  const check = async () => { try { const response = await fetch(`/api/orders/status?order=${encodeURIComponent(orderId)}`, { cache: "no-store" }); const result = await response.json() as { status?: string; error?: string }; if (!response.ok) throw new Error(result.error); setStatus(result.status || "payment_pending"); if (result.status === "paid") clear(); } catch { setError("Не удалось проверить статус. Заказ сохранён — повторите проверку."); } };
  return <div className="return-state"><p className="eyebrow">Заказ {orderId.slice(0,8)}</p><h1>{status === "paid" ? "Оплата подтверждена." : "Проверяем оплату."}</h1><p>{status === "paid" ? (isPreview ? "Тестовый путь завершён. В live-версии здесь появятся данные отправки." : "Заказ оплачен. Дальнейшие сведения об отправке придут по указанным контактам.") : "Возврат на сайт сам по себе не означает успех — статус подтверждает сервер."}</p>{error&&<p role="alert" className="form-error">{error}</p>}<div className="actions"><button type="button" className="button button-primary" onClick={check}>Проверить статус</button><Link className="button button-ghost" href="/catalog/">Вернуться к работам</Link></div></div>;
}
