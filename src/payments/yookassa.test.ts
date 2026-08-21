import { describe, expect, it, vi } from "vitest";
import { YooKassaProvider, PaymentUnknownError } from "./yookassa";

describe("YooKassa adapter", () => {
  it("creates a server-side redirect payment with a stable idempotence key", async () => {
    const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "yk-1", status: "pending", paid: false, test: true, amount: { value: "7800.00", currency: "RUB" }, confirmation: { type: "redirect", confirmation_url: "https://yookassa.test/pay" }, metadata: { order_id: "order-1" } }), { status: 200 }));
    const provider = new YooKassaProvider({ shopId: "shop", secretKey: "secret", returnUrl: "https://shop.test/checkout/return/", mode: "test", fetch: request });
    const result = await provider.create({ orderId: "order-1", amountMinor: 780000, currency: "RUB", idempotenceKey: "stable-key", description: "Заказ order-1" });
    expect(result.confirmationUrl).toBe("https://yookassa.test/pay");
    const [, init] = request.mock.calls[0];
    expect(new Headers(init?.headers).get("Idempotence-Key")).toBe("stable-key");
    expect(JSON.parse(String(init?.body)).amount.value).toBe("7800.00");
  });

  it("treats a provider 5xx as unknown rather than creating a new charge", async () => {
    const provider = new YooKassaProvider({ shopId: "shop", secretKey: "secret", returnUrl: "https://shop.test/checkout/return/", mode: "test", fetch: async () => new Response("error", { status: 500 }) });
    await expect(provider.create({ orderId: "order-1", amountMinor: 10000, currency: "RUB", idempotenceKey: "same-key", description: "Заказ" })).rejects.toBeInstanceOf(PaymentUnknownError);
  });

  it("rejects a test response when configured for live payments", async () => {
    const provider = new YooKassaProvider({
      shopId: "shop",
      secretKey: "secret",
      returnUrl: "https://shop.test/checkout/return/",
      mode: "live",
      fetch: async () => new Response(JSON.stringify({ id: "yk-test", status: "pending", paid: false, test: true, amount: { value: "100.00", currency: "RUB" }, confirmation: { confirmation_url: "https://yookassa.test/pay" }, metadata: { order_id: "order-1" } }), { status: 200 }),
    });
    await expect(provider.create({ orderId: "order-1", amountMinor: 10000, currency: "RUB", idempotenceKey: "live-key", description: "Заказ" })).rejects.toThrow(/environment/i);
  });
});
