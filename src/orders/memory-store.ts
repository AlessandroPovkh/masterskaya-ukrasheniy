import type { CreatedPayment } from "@/payments/types";
import { CheckoutError, type Order, type OrderStore } from "./types";

export class MemoryOrderStore implements OrderStore {
  private readonly orders = new Map<string, Order>();
  private readonly idempotence = new Map<string, string>();
  private readonly reserved = new Map<string, { orderId: string; status: "active" | "payment_pending" | "consumed"; expiresAt: number }>();

  constructor(private readonly now = () => Date.now(), private readonly reservationTtlMs = 15 * 60_000) {}

  private purgeExpiredActiveReservations() {
    const expiredOrderIds = new Set<string>();
    for (const [productId, reservation] of this.reserved) {
      if (reservation.status === "active" && reservation.expiresAt <= this.now()) { this.reserved.delete(productId); expiredOrderIds.add(reservation.orderId); }
    }
    for (const orderId of expiredOrderIds) { const order = this.orders.get(orderId); if (order?.status === "awaiting_payment" && !order.payment) { this.idempotence.delete(order.idempotenceKey); this.orders.delete(orderId); } }
  }

  async getByIdempotenceKey(key: string) { this.purgeExpiredActiveReservations(); const id = this.idempotence.get(key); return id ? this.orders.get(id) ?? null : null; }
  async reserveAndCreate(input: Omit<Order, "payment">) {
    this.purgeExpiredActiveReservations();
    if (input.itemIds.some((id) => this.reserved.has(id))) throw new CheckoutError("OUT_OF_STOCK", "An item is already reserved");
    input.itemIds.forEach((id) => this.reserved.set(id, { orderId: input.id, status: "active", expiresAt: this.now() + this.reservationTtlMs }));
    const order: Order = { ...input, payment: null };
    this.orders.set(order.id, order);
    this.idempotence.set(order.idempotenceKey, order.id);
    return structuredClone(order);
  }
  async attachPayment(orderId: string, payment: CreatedPayment, reviewRequired = false) {
    const order = this.orders.get(orderId); if (!order) throw new Error("Order not found");
    for (const reservation of this.reserved.values()) if (reservation.orderId === orderId) reservation.status = "payment_pending";
    const updated: Order = { ...order, payment, status: reviewRequired ? "review_required" : "payment_pending" };
    this.orders.set(orderId, updated); return structuredClone(updated);
  }
  async getById(orderId: string) { const order = this.orders.get(orderId); return order ? structuredClone(order) : null; }
  async getByPaymentId(paymentId: string) { return [...this.orders.values()].find((order) => order.payment?.paymentId === paymentId) ?? null; }
  async markPaid(orderId: string) { const order = this.orders.get(orderId); if (!order) throw new Error("Order not found"); if (order.status === "paid") return structuredClone(order); if (order.status === "canceled" || order.status === "review_required") { const review = { ...order, status: "review_required" as const }; this.orders.set(orderId, review); return structuredClone(review); } for (const reservation of this.reserved.values()) if (reservation.orderId === orderId) reservation.status = "consumed"; const updated = { ...order, status: "paid" as const }; this.orders.set(orderId, updated); return structuredClone(updated); }
  async markCanceled(orderId: string) { const order = this.orders.get(orderId); if (!order) throw new Error("Order not found"); if (order.status === "paid" || order.status === "canceled" || order.status === "review_required") return structuredClone(order); for (const [productId, reservation] of this.reserved) if (reservation.orderId === orderId && reservation.status !== "consumed") this.reserved.delete(productId); const updated = { ...order, status: "canceled" as const }; this.orders.set(orderId, updated); return structuredClone(updated); }
  async releaseUnpaidOrder(orderId: string) { const order = this.orders.get(orderId); if (!order || order.payment) return; for (const [productId, reservation] of this.reserved) if (reservation.orderId === orderId && reservation.status === "active") this.reserved.delete(productId); this.idempotence.delete(order.idempotenceKey); this.orders.delete(orderId); }
  async listPaymentPendingBefore(cutoffIso: string, limit: number) { return [...this.orders.values()].filter((order) => order.status === "payment_pending" && order.createdAt < cutoffIso).slice(0, limit).map((order) => structuredClone(order)); }
}
