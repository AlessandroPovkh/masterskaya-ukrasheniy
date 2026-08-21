import { describe, expect, it } from "vitest";
import { MemoryOrderStore } from "./memory-store";
import { createCheckout, applyVerifiedPayment } from "./service";
import { MockPaymentProvider } from "@/payments/mock-provider";

describe("trusted checkout", () => {
  it("calculates the amount from catalog product IDs", async () => {
    const store = new MemoryOrderStore();
    const result = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "attempt-1" }, { store, provider: new MockPaymentProvider() });
    expect(result.amountMinor).toBe(699900);
    expect(result.confirmationUrl).toContain(result.orderId);
  });

  it("rejects sold and unknown products", async () => {
    const dependencies = { store: new MemoryOrderStore(), provider: new MockPaymentProvider() };
    await expect(createCheckout({ itemIds: ["work-02"], idempotenceKey: "sold" }, dependencies)).rejects.toMatchObject({ code: "NOT_PURCHASABLE" });
    await expect(createCheckout({ itemIds: ["unknown"], idempotenceKey: "unknown" }, dependencies)).rejects.toMatchObject({ code: "NOT_PURCHASABLE" });
  });

  it("returns the same payment for a repeated idempotent attempt", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const first = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "same" }, { store, provider });
    const second = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "same" }, { store, provider });
    expect(second).toEqual(first);
    expect(provider.createCount).toBe(1);
  });

  it("rejects reuse of an idempotence key for a different cart", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    await createCheckout({ itemIds: ["work-01"], idempotenceKey: "bound-payload" }, { store, provider });
    await expect(createCheckout({ itemIds: ["work-04"], idempotenceKey: "bound-payload" }, { store, provider })).rejects.toMatchObject({ code: "INVALID_CART" });
    expect(provider.createCount).toBe(1);
  });

  it("marks paid only from a verified provider result and is replay-safe", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const checkout = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "pay" }, { store, provider });
    const verified = provider.succeed(checkout.paymentId);
    expect((await applyVerifiedPayment(verified, store, true)).status).toBe("paid");
    expect((await applyVerifiedPayment(verified, store, true)).status).toBe("paid");
  });

  it("never lets a test payment fulfill a live order", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const checkout = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "environment" }, { store, provider });
    const verified = provider.succeed(checkout.paymentId);
    await expect(applyVerifiedPayment(verified, store, false)).rejects.toMatchObject({ code: "PAYMENT_MISMATCH" });
    expect((await store.getById(checkout.orderId))?.status).toBe("payment_pending");
  });

  it("releases inventory after a provider-verified cancellation", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const checkout = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "cancel" }, { store, provider });
    const canceled = { ...(provider.succeed(checkout.paymentId)), status: "canceled" as const };
    expect((await applyVerifiedPayment(canceled, store, true)).status).toBe("canceled");
    await expect(createCheckout({ itemIds: ["work-01"], idempotenceKey: "after-cancel" }, { store, provider })).resolves.toMatchObject({ amountMinor: 699900 });
  });

  it("never reverses a paid order when a late cancellation arrives", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const checkout = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "paid-terminal" }, { store, provider });
    const succeeded = provider.succeed(checkout.paymentId);
    expect((await applyVerifiedPayment(succeeded, store, true)).status).toBe("paid");
    expect((await applyVerifiedPayment({ ...succeeded, status: "canceled" }, store, true)).status).toBe("paid");
  });

  it("routes a late success after cancellation to manual review without consuming new inventory", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const oldCheckout = await createCheckout({ itemIds: ["work-01"], idempotenceKey: "old-cancel" }, { store, provider });
    const providerResult = provider.succeed(oldCheckout.paymentId);
    expect((await applyVerifiedPayment({ ...providerResult, status: "canceled" }, store, true)).status).toBe("canceled");
    await createCheckout({ itemIds: ["work-01"], idempotenceKey: "new-owner" }, { store, provider });
    expect((await applyVerifiedPayment(providerResult, store, true)).status).toBe("review_required");
  });

  it("persists a provider payment for reconciliation when its amount mismatches", async () => {
    const store = new MemoryOrderStore();
    const provider = { create: async (input: { orderId: string; amountMinor: number; currency: "RUB" }) => ({ paymentId: "mismatch-payment", status: "pending" as const, confirmationUrl: "https://pay.test", amountMinor: input.amountMinor + 1, currency: input.currency, test: true }) };
    await expect(createCheckout({ itemIds: ["work-01"], idempotenceKey: "mismatch" }, { store, provider })).rejects.toMatchObject({ code: "PAYMENT_MISMATCH" });
    expect((await store.getByPaymentId("mismatch-payment"))?.status).toBe("review_required");
  });
});
