import { catalogIsProductionReady } from "../catalog/catalog";

export type SiteMode = "preview" | "production";
export type PaymentProvider = "mock" | "yookassa";

export type LaunchConfig = {
  mode: SiteMode;
  staticDemo: boolean;
  origin: string;
  paymentProvider: PaymentProvider;
  yookassaMode: "test" | "live";
  checkoutEnabled: boolean;
  telegramUrl: string | null;
  whatsappUrl: string | null;
  robots: "noindex, nofollow" | "index, follow";
};

type Env = Record<string, string | undefined>;

const enabled = (value: string | undefined) => value === "true";
const present = (value: string | undefined) => Boolean(value?.trim());

export function readLaunchConfig(env: Env, productCatalogReady = catalogIsProductionReady): LaunchConfig {
  const mode: SiteMode = env.SITE_MODE === "production" ? "production" : "preview";
  const paymentProvider: PaymentProvider = env.PAYMENT_PROVIDER === "yookassa" ? "yookassa" : "mock";
  const staticDemo = enabled(env.STATIC_DEMO);
  const checkoutEnabled = !staticDemo && enabled(env.CHECKOUT_ENABLED);

  if (mode === "production") {
    const requiredFlags = [
      "SELLER_REQUISITES_APPROVED",
      "LEGAL_PAGES_APPROVED",
      "RECEIPT_CONFIG_APPROVED",
      "SHIPPING_CONFIG_APPROVED",
      "PRODUCT_DATA_APPROVED",
      "PHOTO_RIGHTS_APPROVED",
    ] as const;
    const failedFlag = requiredFlags.find((key) => !enabled(env[key]));
    if (failedFlag) throw new Error(`Production launch gate failed: ${failedFlag}`);
    if (!productCatalogReady) throw new Error("Production launch gate failed: catalog contains draft, fixture, or incomplete product data");
    if (!checkoutEnabled) throw new Error("Production launch gate failed: CHECKOUT_ENABLED");
    if (paymentProvider !== "yookassa" || env.YOOKASSA_MODE !== "live") {
      throw new Error("Production launch gate failed: live YooKassa is required");
    }
    for (const key of [
      "SITE_ORIGIN",
      "YOOKASSA_SHOP_ID",
      "YOOKASSA_SECRET_KEY",
      "TELEGRAM_URL",
      "WHATSAPP_URL",
      "SESSION_SECRET",
      "DATABASE_URL",
    ] as const) {
      if (!present(env[key])) throw new Error(`Production launch gate failed: ${key}`);
    }
    if (!env.SITE_ORIGIN?.startsWith("https://")) {
      throw new Error("Production launch gate failed: SITE_ORIGIN must use HTTPS");
    }
  }

  return {
    mode,
    staticDemo,
    origin: env.SITE_ORIGIN?.replace(/\/$/, "") || "http://localhost:3000",
    paymentProvider,
    yookassaMode: env.YOOKASSA_MODE === "live" ? "live" : "test",
    checkoutEnabled,
    telegramUrl: present(env.TELEGRAM_URL) ? env.TELEGRAM_URL!.trim() : null,
    whatsappUrl: present(env.WHATSAPP_URL) ? env.WHATSAPP_URL!.trim() : null,
    robots: mode === "production" ? "index, follow" : "noindex, nofollow",
  };
}

export const launchConfig = readLaunchConfig(process.env);
