import { launchConfig } from "@/config/launch-gates";
import { MockPaymentProvider } from "@/payments/mock-provider";
import { YooKassaProvider } from "@/payments/yookassa";
import { MemoryOrderStore } from "./memory-store";
import { PostgresOrderStore } from "./postgres-store";

const globalServices = globalThis as typeof globalThis & { jewelryServices?: ReturnType<typeof createServices> };

function createServices() {
  const store = launchConfig.mode === "production"
    ? new PostgresOrderStore(process.env.DATABASE_URL!)
    : new MemoryOrderStore();
  const provider = launchConfig.paymentProvider === "yookassa"
    ? new YooKassaProvider({ shopId: process.env.YOOKASSA_SHOP_ID ?? "", secretKey: process.env.YOOKASSA_SECRET_KEY ?? "", returnUrl: `${launchConfig.origin}/checkout/return/`, mode: launchConfig.yookassaMode })
    : new MockPaymentProvider();
  return { store, provider };
}

export const services = globalServices.jewelryServices ?? createServices();
if (process.env.NODE_ENV !== "production") globalServices.jewelryServices = services;
