import { describe, expect, it } from "vitest";
import {
  catalog,
  comparisonPriceIsProductionReady,
  formatCompareAtPrice,
  formatPrice,
  filterCatalog,
  getAdjacentProducts,
  getProductBySlug,
  getPurchaseCue,
  isPurchasable,
} from "./catalog";

describe("fixture catalog", () => {
  it("represents five works without turning seven photos into seven SKUs", () => {
    expect(catalog).toHaveLength(5);
    expect(catalog[0].images).toHaveLength(2);
    expect(new Set(catalog.map((product) => product.sku)).size).toBe(5);
  });

  it("keeps every product explicitly draft and fixture-backed", () => {
    expect(catalog.every((product) => product.publicationStatus === "draft")).toBe(true);
    expect(catalog.every((product) => product.dataStatus === "fixture")).toBe(true);
  });

  it("never references the rejected artificial-grass photograph", () => {
    expect(JSON.stringify(catalog)).not.toContain("photo_4");
    expect(JSON.stringify(catalog)).not.toContain("work-04-view-02");
  });

  it("only permits stocked, priced in-stock work", () => {
    const available = getProductBySlug("svetlaya-orbita");
    const sold = getProductBySlug("siniy-ritm");
    const madeToOrder = getProductBySlug("teplyy-obereg");
    expect(isPurchasable(available!)).toBe(true);
    expect(isPurchasable(sold!)).toBe(false);
    expect(isPurchasable(madeToOrder!)).toBe(false);
  });

  it("keeps previous and next collection navigation circular", () => {
    expect(getAdjacentProducts("svetlaya-orbita")).toEqual({
      previous: catalog[4],
      next: catalog[1],
    });
    expect(getAdjacentProducts("teplyy-obereg")).toEqual({
      previous: catalog[1],
      next: catalog[3],
    });
    expect(getAdjacentProducts("rozovoe-okno")).toEqual({
      previous: catalog[3],
      next: catalog[0],
    });
  });

  it("does not invent collection navigation for an unknown slug", () => {
    expect(getAdjacentProducts("missing-work")).toBeNull();
  });

  it("shows a single-piece cue only for a purchasable one-of-one work", () => {
    expect(getPurchaseCue(catalog[0])).toBe("Единственный экземпляр");
    expect(getPurchaseCue(catalog[1])).toBeNull();
    expect(getPurchaseCue({ ...catalog[0], stockOnHand: 2 })).toBeNull();
    expect(getPurchaseCue({ ...catalog[0], availability: "sold" })).toBeNull();
    expect(getPurchaseCue({ ...catalog[0], availability: "made_to_order" })).toBeNull();
  });

  it("formats a preview comparison price without approving it for production", () => {
    expect(formatPrice(catalog[0])).toBe("6 999 ₽");
    expect(formatCompareAtPrice(catalog[0])).toBe("8 000 ₽");
    expect(comparisonPriceIsProductionReady(catalog[0])).toBe(false);
    expect(comparisonPriceIsProductionReady({ ...catalog[0], comparisonPriceStatus: "approved" })).toBe(true);
  });

  it("filters the catalog from the availability query used by the static client", () => {
    expect(filterCatalog("in_stock").map((product) => product.id)).toEqual(["work-01", "work-04", "work-05"]);
    expect(filterCatalog(null)).toEqual(catalog);
  });
});
