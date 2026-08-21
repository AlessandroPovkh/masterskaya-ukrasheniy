import { randomUUID } from "node:crypto";
import { getProductById, isPurchasable } from "@/catalog/catalog";
import type { PaymentProvider, VerifiedPayment } from "@/payments/types";
import { PaymentUnknownError } from "@/payments/yookassa";
import { CheckoutError, type OrderStore, type WebhookReceipt } from "./types";

export async function createCheckout(input: { itemIds: string[]; idempotenceKey: string }, dependencies: { store: OrderStore; provider: PaymentProvider }) {
  if (!input.idempotenceKey || input.itemIds.length === 0 || input.itemIds.length > 5 || new Set(input.itemIds).size !== input.itemIds.length) throw new CheckoutError("INVALID_CART", "Cart is invalid");
  const existing = await dependencies.store.getByIdempotenceKey(input.idempotenceKey);
  if (existing && (existing.itemIds.length !== input.itemIds.length || [...existing.itemIds].sort().some((id, index) => id !== [...input.itemIds].sort()[index]))) {
    throw new CheckoutError("INVALID_CART", "Idempotence key is already bound to a different cart");
  }
  if (existing?.payment) return { orderId: existing.id, paymentId: existing.payment.paymentId, confirmationUrl: existing.payment.confirmationUrl, amountMinor: existing.amountMinor, currency: existing.currency };
  const products = input.itemIds.map(getProductById);
  if (products.some((product) => !product || !isPurchasable(product))) throw new CheckoutError("NOT_PURCHASABLE", "One or more products cannot be purchased");
  const amountMinor = products.reduce((sum, product) => sum + product!.priceMinor!, 0);
  const order = existing ?? await dependencies.store.reserveAndCreate({ id: randomUUID(), itemIds: [...input.itemIds], amountMinor, currency: "RUB", idempotenceKey: input.idempotenceKey, status: "awaiting_payment", createdAt: new Date().toISOString() });
  let payment;
  try {
    payment = await dependencies.provider.create({ orderId: order.id, amountMinor: order.amountMinor, currency: order.currency, idempotenceKey: order.idempotenceKey, description: `Заказ ${order.id}` });
  } catch (error) {
    if (!(error instanceof PaymentUnknownError)) await dependencies.store.releaseUnpaidOrder(order.id);
    throw error;
  }
  if (payment.amountMinor !== order.amountMinor || payment.currency !== order.currency) {
    await dependencies.store.attachPayment(order.id, payment, true);
    throw new CheckoutError("PAYMENT_MISMATCH", "Provider amount mismatch; order requires reconciliation");
  }
  await dependencies.store.attachPayment(order.id, payment);
  return { orderId: order.id, paymentId: payment.paymentId, confirmationUrl: payment.confirmationUrl, amountMinor: order.amountMinor, currency: order.currency };
}

export async function applyVerifiedPayment(payment: VerifiedPayment, store: OrderStore, expectedTest: boolean, receipt?: WebhookReceipt) {
  const order = await store.getByPaymentId(payment.paymentId);
  if (!order || order.id !== payment.orderId || order.amountMinor !== payment.amountMinor || order.currency !== payment.currency || payment.test !== expectedTest) throw new CheckoutError("PAYMENT_MISMATCH", "Verified payment does not match order or environment");
  if (payment.status === "canceled") return store.markCanceled(order.id, receipt);
  if (payment.status !== "succeeded") return order;
  if (order.status === "paid") return order;
  return store.markPaid(order.id, receipt);
}
