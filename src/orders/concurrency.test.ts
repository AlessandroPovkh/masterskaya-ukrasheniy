import { describe, expect, it } from "vitest";
import { MemoryOrderStore } from "./memory-store";
import { createCheckout } from "./service";
import { MockPaymentProvider } from "@/payments/mock-provider";

describe("unique inventory reservation", () => {
  it("allows exactly one concurrent checkout for one unique work", async () => {
    const store = new MemoryOrderStore();
    const provider = new MockPaymentProvider();
    const results = await Promise.allSettled([
      createCheckout({ itemIds: ["work-05"], idempotenceKey: "buyer-a" }, { store, provider }),
      createCheckout({ itemIds: ["work-05"], idempotenceKey: "buyer-b" }, { store, provider }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(provider.createCount).toBe(1);
  });

  it("releases a reservation when payment creation is definitively rejected", async () => {
    const store = new MemoryOrderStore();
    const rejectingProvider = { create: async () => { throw new Error("definitive rejection"); } };
    await expect(createCheckout({ itemIds: ["work-05"], idempotenceKey: "rejected" }, { store, provider: rejectingProvider })).rejects.toThrow("definitive rejection");
    const retry = await createCheckout({ itemIds: ["work-05"], idempotenceKey: "retry" }, { store, provider: new MockPaymentProvider() });
    expect(retry.amountMinor).toBe(720000);
  });

  it("allows a new attempt after an unpaid reservation expires", async () => {
    let now = 1_000;
    const store = new MemoryOrderStore(() => now, 500);
    await store.reserveAndCreate({ id: "abandoned-order", itemIds: ["work-05"], amountMinor: 720000, currency: "RUB", idempotenceKey: "abandoned", status: "awaiting_payment", createdAt: new Date(now).toISOString() });
    now += 501;
    const retry = await createCheckout({ itemIds: ["work-05"], idempotenceKey: "after-expiry" }, { store, provider: new MockPaymentProvider() });
    expect(retry.amountMinor).toBe(720000);
  });

  it("cannot revive an expired order after another buyer reserves the work", async () => {
    let now = 1_000;
    const store = new MemoryOrderStore(() => now, 500);
    await store.reserveAndCreate({ id: "old-order", itemIds: ["work-05"], amountMinor: 720000, currency: "RUB", idempotenceKey: "old-key", status: "awaiting_payment", createdAt: new Date(now).toISOString() });
    now += 501;
    await createCheckout({ itemIds: ["work-05"], idempotenceKey: "new-buyer" }, { store, provider: new MockPaymentProvider() });
    await expect(createCheckout({ itemIds: ["work-05"], idempotenceKey: "old-key" }, { store, provider: new MockPaymentProvider() })).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
  });
});
