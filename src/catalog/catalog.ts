export type Availability = "in_stock" | "sold" | "made_to_order";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Product = {
  id: string;
  sku: string;
  slug: string;
  publicationStatus: "draft" | "published";
  dataStatus: "fixture" | "approved";
  availability: Availability;
  title: string;
  category: string;
  shortDescription: string;
  materials: string | null;
  dimensions: string | null;
  priceMinor: number | null;
  compareAtPriceMinor?: number | null;
  comparisonPriceStatus?: "fixture" | "approved" | null;
  currency: "RUB";
  stockOnHand: number;
  images: ProductImage[];
  contentVersion: number;
};

const image = (name: string, alt: string, width = 720): ProductImage => ({
  src: withBasePath(`/products/${name}`),
  alt,
  width,
  height: 1280,
});

export const catalog: readonly Product[] = [
  {
    id: "work-01",
    sku: "MU-FIX-001",
    slug: "svetlaya-orbita",
    publicationStatus: "draft",
    dataStatus: "fixture",
    availability: "in_stock",
    title: "Светлая орбита",
    category: "Ожерелье",
    shortDescription: "Ритм округлых форм и спокойная линия, собранные в один выразительный силуэт.",
    materials: null,
    dimensions: null,
    priceMinor: 699900,
    compareAtPriceMinor: 800000,
    comparisonPriceStatus: "fixture",
    currency: "RUB",
    stockOnHand: 1,
    images: [
      image("work-01-view-01.jpg", "Светлое ожерелье с округлыми элементами на зелёном листе", 960),
      image("work-01-view-02.jpg", "Макро светлого ожерелья с округлыми элементами", 960),
    ],
    contentVersion: 1,
  },
  {
    id: "work-02",
    sku: "MU-FIX-002",
    slug: "siniy-ritm",
    publicationStatus: "draft",
    dataStatus: "fixture",
    availability: "sold",
    title: "Синий ритм",
    category: "Ожерелье",
    shortDescription: "Глубокий цвет и неровный природный ритм делают форму живой и собранной.",
    materials: null,
    dimensions: null,
    priceMinor: null,
    currency: "RUB",
    stockOnHand: 0,
    images: [image("work-02-view-01.jpg", "Ожерелье с синими округлыми элементами на светлой ткани")],
    contentVersion: 1,
  },
  {
    id: "work-03",
    sku: "MU-FIX-003",
    slug: "teplyy-obereg",
    publicationStatus: "draft",
    dataStatus: "fixture",
    availability: "made_to_order",
    title: "Тёплый оберег",
    category: "Подвеска",
    shortDescription: "Пластичная линия обрамляет центр и сохраняет видимый след ручного движения.",
    materials: null,
    dimensions: null,
    priceMinor: null,
    currency: "RUB",
    stockOnHand: 0,
    images: [image("work-03-view-01.jpg", "Подвеска с овальной вставкой и проволочным обрамлением")],
    contentVersion: 1,
  },
  {
    id: "work-04",
    sku: "MU-FIX-004",
    slug: "yagodnaya-nit",
    publicationStatus: "draft",
    dataStatus: "fixture",
    availability: "in_stock",
    title: "Ягодная нить",
    category: "Ожерелье",
    shortDescription: "Насыщенный цвет следует мягкой дуге и превращает украшение в самостоятельный жест.",
    materials: null,
    dimensions: null,
    priceMinor: 890000,
    currency: "RUB",
    stockOnHand: 1,
    images: [image("work-04-view-01.jpg", "Тёмно-красное ожерелье на ветви")],
    contentVersion: 1,
  },
  {
    id: "work-05",
    sku: "MU-FIX-005",
    slug: "rozovoe-okno",
    publicationStatus: "draft",
    dataStatus: "fixture",
    availability: "in_stock",
    title: "Розовое окно",
    category: "Кольцо",
    shortDescription: "Крупная композиция держится на контрасте прозрачности, цвета и естественного масштаба.",
    materials: null,
    dimensions: null,
    priceMinor: 720000,
    currency: "RUB",
    stockOnHand: 1,
    images: [image("work-05-view-01.jpg", "Крупное кольцо с розовой и прозрачной вставками на руке")],
    contentVersion: 1,
  },
] as const;

export const getProductBySlug = (slug: string) => catalog.find((product) => product.slug === slug);
export const getProductById = (id: string) => catalog.find((product) => product.id === id);
export const getProductBySku = (sku: string) => catalog.find((product) => product.sku === sku);
export const filterCatalog = (availability: string | null) =>
  availability === "in_stock" ? catalog.filter((product) => product.availability === "in_stock") : catalog;
export const getAdjacentProducts = (slug: string) => {
  const index = catalog.findIndex((product) => product.slug === slug);
  if (index === -1) return null;
  return {
    previous: catalog[(index - 1 + catalog.length) % catalog.length],
    next: catalog[(index + 1) % catalog.length],
  };
};
export const isPurchasable = (product: Product) =>
  product.availability === "in_stock" && product.stockOnHand > 0 && product.priceMinor !== null;
export const getPurchaseCue = (product: Product) =>
  isPurchasable(product) && product.stockOnHand === 1 ? "Единственный экземпляр" : null;

export const comparisonPriceIsProductionReady = (product: Product) =>
  product.compareAtPriceMinor == null ||
  (product.comparisonPriceStatus === "approved" &&
    product.priceMinor !== null &&
    product.compareAtPriceMinor > product.priceMinor);

export const catalogIsProductionReady = catalog.every(
  (product) =>
    product.publicationStatus === "published" &&
    product.dataStatus === "approved" &&
    product.materials &&
    product.dimensions &&
    comparisonPriceIsProductionReady(product),
);

export const formatPrice = (product: Product) =>
  product.priceMinor === null
    ? null
    : new Intl.NumberFormat("ru-RU", { style: "currency", currency: product.currency, maximumFractionDigits: 0 }).format(
        product.priceMinor / 100,
      );

export const formatCompareAtPrice = (product: Product) =>
  product.compareAtPriceMinor == null
    ? null
    : new Intl.NumberFormat("ru-RU", { style: "currency", currency: product.currency, maximumFractionDigits: 0 }).format(
        product.compareAtPriceMinor / 100,
      );

export const availabilityLabel: Record<Availability, string> = {
  in_stock: "В наличии",
  sold: "Продано",
  made_to_order: "Похожее на заказ",
};
import { withBasePath } from "../config/paths";
