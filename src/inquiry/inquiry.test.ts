import { describe, expect, it } from "vitest";
import { buildInquiryText, buildWhatsAppLink } from "./inquiry";

describe("product inquiry", () => {
  it("includes the product identity and canonical URL", () => {
    expect(buildInquiryText({ sku: "MU-FIX-002", title: "Синий ритм", url: "https://shop.test/catalog/siniy-ritm/" }))
      .toContain("MU-FIX-002 — «Синий ритм»");
    expect(buildInquiryText({ sku: "MU-FIX-002", title: "Синий ритм", url: "https://shop.test/catalog/siniy-ritm/" }))
      .toContain("https://shop.test/catalog/siniy-ritm/");
  });

  it("preserves an approved WhatsApp destination while adding encoded context", () => {
    const link = buildWhatsAppLink("https://wa.me/70000000000", "Работа MU-FIX-002");
    expect(link).toBe("https://wa.me/70000000000?text=%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%20MU-FIX-002");
  });
});
