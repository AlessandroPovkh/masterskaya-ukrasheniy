"use client";

import { useSearchParams } from "next/navigation";
import { getProductBySku } from "@/catalog/catalog";
import { buildInquiryText, buildWhatsAppLink } from "./inquiry";
import { ContactActions } from "./contact-actions";

export function ContactsPageClient({ origin, telegramUrl, whatsappUrl }: { origin: string; telegramUrl: string | null; whatsappUrl: string | null }) {
  const sku = useSearchParams().get("product");
  const product = sku ? getProductBySku(sku) : undefined;
  const url = product ? `${origin}/catalog/${product.slug}/` : origin;
  const text = buildInquiryText({ sku: product?.sku ?? "без артикула", title: product?.title ?? "выбранная форма", url });
  const wa = whatsappUrl ? buildWhatsAppLink(whatsappUrl, text) : null;

  return <>{product&&<p className="selected-work">Выбрана работа: <strong>{product.sku} · {product.title}</strong></p>}<label className="inquiry-copy">Текст запроса<textarea readOnly rows={5} value={text}/></label><ContactActions telegramUrl={telegramUrl} whatsappUrl={wa} text={text}/></>;
}
