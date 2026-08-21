import type { CreatedPayment } from "@/payments/types";

export type OrderStatus = "awaiting_payment" | "payment_pending" | "paid" | "canceled" | "review_required";
export type Order = {
  id: string;
  itemIds: string[];
  amountMinor: number;
  currency: "RUB";
  idempotenceKey: string;
  status: OrderStatus;
  payment: CreatedPayment | null;
  createdAt: string;
};

export type WebhookReceipt = { bodyHash: string; eventType: string; providerObjectId: string; result: string };

export interface OrderStore {
  getByIdempotenceKey(key: string): Promise<Order | null>;
  reserveAndCreate(input: Omit<Order, "payment">): Promise<Order>;
  attachPayment(orderId: string, payment: CreatedPayment, reviewRequired?: boolean): Promise<Order>;
  getById(orderId: string): Promise<Order | null>;
  getByPaymentId(paymentId: string): Promise<Order | null>;
  markPaid(orderId: string, receipt?: WebhookReceipt): Promise<Order>;
  markCanceled(orderId: string, receipt?: WebhookReceipt): Promise<Order>;
  releaseUnpaidOrder(orderId: string): Promise<void>;
  listPaymentPendingBefore(cutoffIso: string, limit: number): Promise<Order[]>;
}

export class CheckoutError extends Error {
  constructor(public readonly code: "NOT_PURCHASABLE" | "OUT_OF_STOCK" | "INVALID_CART" | "PAYMENT_MISMATCH", message: string) { super(message); }
}
