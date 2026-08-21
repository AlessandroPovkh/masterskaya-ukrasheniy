import Image from "next/image";
import Link from "next/link";
import { availabilityLabel, formatCompareAtPrice, formatPrice, getPurchaseCue, type Product } from "@/catalog/catalog";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = formatPrice(product);
  const compareAtPrice = formatCompareAtPrice(product);
  const purchaseCue = getPurchaseCue(product);
  return (
    <article className="product-card">
      <Link href={`/catalog/${product.slug}/`} className="product-image-wrap" aria-label={`${product.title} — открыть изделие`}>
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          width={product.images[0].width}
          height={product.images[0].height}
          sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
          priority={priority}
        />
        <span className={`status status-${product.availability}`}>{availabilityLabel[product.availability]}</span>
      </Link>
      <div className="product-card-copy">
        <p className="eyebrow">{product.category} · {product.sku}</p>
        <h3><Link href={`/catalog/${product.slug}/`}>{product.title}</Link></h3>
        <p className="product-price">
          {compareAtPrice && <del className="former-price" aria-label={`Цена до скидки ${compareAtPrice}`}>{compareAtPrice}</del>}
          {price ? <span className="current-price" aria-label={`Текущая цена ${price}`}>{price}</span> : <span>{product.availability === "sold" ? "Архивная работа" : "Цена после согласования"}</span>}
        </p>
        {purchaseCue && <p className="purchase-cue">{purchaseCue}</p>}
      </div>
    </article>
  );
}
