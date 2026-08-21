import { describe, expect, it } from "vitest";
import { readLaunchConfig } from "./launch-gates";

describe("launch gates", () => {
  it("defaults to a locked preview", () => {
    const config = readLaunchConfig({});
    expect(config.mode).toBe("preview");
    expect(config.checkoutEnabled).toBe(false);
    expect(config.robots).toBe("noindex, nofollow");
  });

  it("forces checkout off for a public static demo", () => {
    const config = readLaunchConfig({ STATIC_DEMO: "true", CHECKOUT_ENABLED: "true" });

    expect(config.staticDemo).toBe(true);
    expect(config.checkoutEnabled).toBe(false);
    expect(config.robots).toBe("noindex, nofollow");
  });

  it("rejects fixture-backed production", () => {
    expect(() =>
      readLaunchConfig({
        SITE_MODE: "production",
        SITE_ORIGIN: "https://example.ru",
        PAYMENT_PROVIDER: "yookassa",
        YOOKASSA_MODE: "live",
        YOOKASSA_SHOP_ID: "real-shop",
        YOOKASSA_SECRET_KEY: "real-secret",
        CHECKOUT_ENABLED: "true",
        SELLER_REQUISITES_APPROVED: "true",
        LEGAL_PAGES_APPROVED: "true",
        RECEIPT_CONFIG_APPROVED: "true",
        SHIPPING_CONFIG_APPROVED: "true",
        PRODUCT_DATA_APPROVED: "false",
        PHOTO_RIGHTS_APPROVED: "true",
        TELEGRAM_URL: "https://t.me/approved",
        WHATSAPP_URL: "https://wa.me/70000000000",
        SESSION_SECRET: "a-production-secret-with-enough-length",
      }),
    ).toThrow(/PRODUCT_DATA_APPROVED/);
  });

  it("accepts production only when every public and payment gate passes", () => {
    const config = readLaunchConfig({
      SITE_MODE: "production",
      SITE_ORIGIN: "https://example.ru",
      PAYMENT_PROVIDER: "yookassa",
      YOOKASSA_MODE: "live",
      YOOKASSA_SHOP_ID: "real-shop",
      YOOKASSA_SECRET_KEY: "real-secret",
      CHECKOUT_ENABLED: "true",
      SELLER_REQUISITES_APPROVED: "true",
      LEGAL_PAGES_APPROVED: "true",
      RECEIPT_CONFIG_APPROVED: "true",
      SHIPPING_CONFIG_APPROVED: "true",
      PRODUCT_DATA_APPROVED: "true",
      PHOTO_RIGHTS_APPROVED: "true",
      TELEGRAM_URL: "https://t.me/approved",
      WHATSAPP_URL: "https://wa.me/70000000000",
      SESSION_SECRET: "a-production-secret-with-enough-length",
      DATABASE_URL: "postgres://store:secret@db/store",
    }, true);
    expect(config.robots).toBe("index, follow");
    expect(config.checkoutEnabled).toBe(true);
  });

  it("rejects production while the compiled catalog is still draft fixture data", () => {
    expect(() => readLaunchConfig({
      SITE_MODE: "production", SITE_ORIGIN: "https://example.ru", PAYMENT_PROVIDER: "yookassa", YOOKASSA_MODE: "live",
      YOOKASSA_SHOP_ID: "real-shop", YOOKASSA_SECRET_KEY: "real-secret", CHECKOUT_ENABLED: "true",
      SELLER_REQUISITES_APPROVED: "true", LEGAL_PAGES_APPROVED: "true", RECEIPT_CONFIG_APPROVED: "true",
      SHIPPING_CONFIG_APPROVED: "true", PRODUCT_DATA_APPROVED: "true", PHOTO_RIGHTS_APPROVED: "true",
      TELEGRAM_URL: "https://t.me/approved", WHATSAPP_URL: "https://wa.me/70000000000",
      SESSION_SECRET: "a-production-secret-with-enough-length", DATABASE_URL: "postgres://store:secret@db/store",
    })).toThrow(/catalog contains draft, fixture, or incomplete/i);
  });

  it("rejects production without durable order storage", () => {
    expect(() => readLaunchConfig({
      SITE_MODE: "production", SITE_ORIGIN: "https://example.ru", PAYMENT_PROVIDER: "yookassa", YOOKASSA_MODE: "live",
      YOOKASSA_SHOP_ID: "real-shop", YOOKASSA_SECRET_KEY: "real-secret", CHECKOUT_ENABLED: "true",
      SELLER_REQUISITES_APPROVED: "true", LEGAL_PAGES_APPROVED: "true", RECEIPT_CONFIG_APPROVED: "true",
      SHIPPING_CONFIG_APPROVED: "true", PRODUCT_DATA_APPROVED: "true", PHOTO_RIGHTS_APPROVED: "true",
      TELEGRAM_URL: "https://t.me/approved", WHATSAPP_URL: "https://wa.me/70000000000",
      SESSION_SECRET: "a-production-secret-with-enough-length",
    }, true)).toThrow(/DATABASE_URL/);
  });
});
