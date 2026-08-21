"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { filterCatalog } from "./catalog";
import { ProductCard } from "@/components/product-card";

export function CatalogPageClient({ isPreview }: { isPreview: boolean }) {
  const onlyAvailable = useSearchParams().get("availability") === "in_stock";
  const products = filterCatalog(onlyAvailable ? "in_stock" : null);

  return (
    <>
      <header className="page-intro">
        <p className="eyebrow">Каталог{isPreview ? " · preview" : ""}</p>
        <h1>{onlyAvailable ? "В наличии" : "Все работы"}</h1>
        <p>{isPreview ? "Выберите форму, которая останется с вами. Товарные данные на этой версии демонстрационные." : "Выберите форму, которая останется с вами."}</p>
      </header>
      <nav className="catalog-tabs" aria-label="Фильтр работ">
        <Link className={!onlyAvailable ? "active" : ""} href="/catalog/">Все</Link>
        <Link className={onlyAvailable ? "active" : ""} href="/catalog/?availability=in_stock">В наличии</Link>
      </nav>
      <section className="product-grid catalog-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</section>
    </>
  );
}
