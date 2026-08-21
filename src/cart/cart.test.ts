import { describe, expect, it } from "vitest";
import { addItem, cartTotalMinor, getCartPrimaryAction, hydrateCart, removeItem } from "./cart";

describe("cart", () => {
  it("adds a purchasable unique item once", () => {
    expect(addItem([], "work-01")).toEqual(["work-01"]);
    expect(addItem(["work-01"], "work-01")).toEqual(["work-01"]);
  });

  it("rejects sold, made-to-order and unknown IDs during add and hydration", () => {
    expect(addItem([], "work-02")).toEqual([]);
    expect(addItem([], "work-03")).toEqual([]);
    expect(hydrateCart('["work-01","work-02","unknown"]')).toEqual(["work-01"]);
  });

  it("calculates price from the catalog rather than cached client values", () => {
    expect(cartTotalMinor(["work-01", "work-05"])).toBe(1419900);
  });

  it("removes an item without changing siblings", () => {
    expect(removeItem(["work-01", "work-05"], "work-01")).toEqual(["work-05"]);
  });

  it("routes a static demo inquiry away from the unavailable server checkout", () => {
    expect(getCartPrimaryAction(true)).toEqual({ href: "/contacts/", label: "Обсудить заказ" });
    expect(getCartPrimaryAction(false)).toEqual({ href: "/checkout/", label: "Перейти к оформлению" });
  });
});
