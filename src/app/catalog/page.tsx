import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogPageClient } from "@/catalog/catalog-page-client";
import { launchConfig } from "@/config/launch-gates";

export const metadata: Metadata = { title: "Все работы" };

export default function CatalogPage() {
  const isPreview = launchConfig.mode === "preview";
  return (
    <main className="page-main">
      <Suspense fallback={<p aria-live="polite">Открываем каталог…</p>}><CatalogPageClient isPreview={isPreview} /></Suspense>
    </main>
  );
}
