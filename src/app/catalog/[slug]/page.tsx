import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { availabilityLabel, catalog, formatCompareAtPrice, formatPrice, getAdjacentProducts, getProductBySlug, getPurchaseCue, isPurchasable } from "@/catalog/catalog";
import { AddToCartButton } from "@/cart/cart-ui";
import { launchConfig } from "@/config/launch-gates";

export function generateStaticParams() { return catalog.map((product) => ({ slug: product.slug })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  return product ? { title: product.title, description: product.shortDescription } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProductBySlug((await params).slug);
  if (!product) notFound();
  const price = formatPrice(product);
  const compareAtPrice = formatCompareAtPrice(product);
  const purchaseCue = getPurchaseCue(product);
  const isPreview = launchConfig.mode === "preview";
  const adjacent = getAdjacentProducts(product.slug)!;
  const [leadImage, ...extraImages] = product.images;
  return (
    <main className="product-page page-main">
      <div className="breadcrumbs"><Link href="/catalog/">Все работы</Link><span>/</span><span>{product.title}</span></div>
      <div className="product-layout">
        <div className="product-gallery product-gallery-lead">
          <Image src={leadImage.src} alt={leadImage.alt} width={leadImage.width} height={leadImage.height} priority sizes="(max-width: 900px) 100vw, 58vw" />
          <span className="gallery-count">01 / {String(product.images.length).padStart(2, "0")}</span>
        </div>
        <aside className="product-info">
          <p className="eyebrow">{product.category} · {product.sku}</p>
          <h1>{product.title}</h1>
          <p className={`status-line status-${product.availability}`}>{availabilityLabel[product.availability]}</p>
          <p className="pdp-price">
            {compareAtPrice && <del className="former-price" aria-label={`Цена до скидки ${compareAtPrice}`}>{compareAtPrice}</del>}
            {price ? <span className="current-price" aria-label={`Текущая цена ${price}`}>{price}</span> : <span>{product.availability === "sold" ? "Архивная работа" : "Цена после согласования"}</span>}
          </p>
          {purchaseCue && <p className="purchase-cue purchase-cue-pdp"><span aria-hidden="true">✦</span> {purchaseCue}</p>}
          <p className="pdp-description">{product.shortDescription}</p>
          {isPreview && <div className="preview-fact"><strong>Preview-данные</strong><span>Состав, размеры, цена и наличие требуют подтверждения владельца.</span></div>}
          {isPurchasable(product) ? (
            <AddToCartButton productId={product.id} />
          ) : (
            <Link className="button button-primary button-wide" href={`/contacts/?product=${product.sku}`}>Запросить похожее</Link>
          )}
          <dl className="facts"><div><dt>Материал</dt><dd>{product.materials ?? "Уточняется"}</dd></div><div><dt>Размер</dt><dd>{product.dimensions ?? "Уточняется"}</dd></div>{isPreview && <div><dt>Статус данных</dt><dd>Демонстрационные</dd></div>}</dl>
          <details><summary>Доставка и оплата</summary><p>География — Россия и СНГ. Способ, тариф и срок появятся после утверждения shipping matrix.</p></details>
          <details><summary>Уход</summary><p>Храните украшение отдельно и избегайте контакта с водой и косметикой. Точные рекомендации зависят от подтверждённого состава.</p></details>
        </aside>
        <div className="product-gallery product-gallery-more">
          {extraImages.map((image, index) => (
            <figure key={image.src}>
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 900px) 100vw, 58vw" />
              <figcaption>{String(index + 2).padStart(2, "0")} / {String(product.images.length).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <nav className="collection-neighbors" aria-label="Соседние работы коллекции">
        <Link href={`/catalog/${adjacent.previous.slug}/`} aria-label={`Предыдущая работа — ${adjacent.previous.title}`}><span>← Предыдущая</span><strong>{adjacent.previous.title}</strong></Link>
        <Link href={`/catalog/${adjacent.next.slug}/`} aria-label={`Следующая работа — ${adjacent.next.title}`}><span>Следующая →</span><strong>{adjacent.next.title}</strong></Link>
      </nav>
    </main>
  );
}
