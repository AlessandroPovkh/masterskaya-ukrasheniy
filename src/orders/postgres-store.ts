import { and, eq, inArray, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { inventoryReservations, orders, payments, webhookReceipts } from "@/db/schema";
import { CheckoutError, type Order, type OrderStore, type WebhookReceipt } from "./types";
import type { CreatedPayment } from "@/payments/types";

const mapOrder = (row: typeof orders.$inferSelect): Order => ({ ...row, currency: "RUB", payment: (row.payment as CreatedPayment | null) ?? null, status: row.status as Order["status"] });

export class PostgresOrderStore implements OrderStore {
  private readonly db;
  constructor(databaseUrl: string) { this.db = drizzle(new Pool({ connectionString: databaseUrl, max: 5 })); }

  private async cleanupExpiredReservations() {
    await this.db.transaction(async (tx) => {
      const expired = await tx.select({ orderId: inventoryReservations.orderId }).from(inventoryReservations).where(and(eq(inventoryReservations.status, "active"), lt(inventoryReservations.expiresAt, new Date().toISOString())));
      if (!expired.length) return;
      const orderIds = [...new Set(expired.map(({ orderId }) => orderId))];
      await tx.delete(inventoryReservations).where(and(eq(inventoryReservations.status, "active"), inArray(inventoryReservations.orderId, orderIds)));
      await tx.delete(orders).where(and(eq(orders.status, "awaiting_payment"), inArray(orders.id, orderIds)));
    });
  }

  async getByIdempotenceKey(key: string) { await this.cleanupExpiredReservations(); const rows = await this.db.select().from(orders).where(eq(orders.idempotenceKey, key)).limit(1); return rows[0] ? mapOrder(rows[0]) : null; }

  async reserveAndCreate(input: Omit<Order, "payment">) {
    await this.cleanupExpiredReservations();
    try {
      return await this.db.transaction(async (tx) => {
        const [row] = await tx.insert(orders).values({ ...input, payment: null }).returning();
        const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
        await tx.insert(inventoryReservations).values(input.itemIds.map((productId) => ({ productId, orderId: input.id, expiresAt })));
        return mapOrder(row);
      });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new CheckoutError("OUT_OF_STOCK", "An item is already reserved");
      throw error;
    }
  }

  async attachPayment(orderId: string, payment: CreatedPayment, reviewRequired = false) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx.update(orders).set({ payment, status: reviewRequired ? "review_required" : "payment_pending" }).where(eq(orders.id, orderId)).returning();
      if (!row) throw new Error("Order not found");
      await tx.insert(payments).values({ orderId, providerPaymentId: payment.paymentId, idempotenceKey: row.idempotenceKey, amountMinor: payment.amountMinor, currency: payment.currency, status: reviewRequired ? "review_required" : payment.status, test: payment.test }).onConflictDoNothing({ target: payments.providerPaymentId });
      await tx.update(inventoryReservations).set({ status: "payment_pending" }).where(eq(inventoryReservations.orderId, orderId));
      return mapOrder(row);
    });
  }

  async getById(orderId: string) { const rows = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1); return rows[0] ? mapOrder(rows[0]) : null; }
  async getByPaymentId(paymentId: string) { const paymentRows = await this.db.select().from(payments).where(eq(payments.providerPaymentId, paymentId)).limit(1); return paymentRows[0] ? this.getById(paymentRows[0].orderId) : null; }

  async markPaid(orderId: string, receipt?: WebhookReceipt) {
    return this.db.transaction(async (tx) => {
      if (receipt) await tx.insert(webhookReceipts).values(receipt).onConflictDoNothing({ target: webhookReceipts.bodyHash });
      const [current] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for("update");
      if (!current) throw new Error("Order not found");
      if (current.status === "paid") return mapOrder(current);
      if (current.status === "canceled" || current.status === "review_required") {
        const [review] = await tx.update(orders).set({ status: "review_required" }).where(eq(orders.id, orderId)).returning();
        await tx.update(payments).set({ status: "review_required" }).where(eq(payments.orderId, orderId));
        return mapOrder(review);
      }
      const [paid] = await tx.update(orders).set({ status: "paid" }).where(eq(orders.id, orderId)).returning();
      await tx.update(payments).set({ status: "succeeded" }).where(eq(payments.orderId, orderId));
      await tx.update(inventoryReservations).set({ status: "consumed" }).where(eq(inventoryReservations.orderId, orderId));
      return mapOrder(paid);
    });
  }

  async markCanceled(orderId: string, receipt?: WebhookReceipt) {
    return this.db.transaction(async (tx) => {
      if (receipt) await tx.insert(webhookReceipts).values(receipt).onConflictDoNothing({ target: webhookReceipts.bodyHash });
      const [current] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for("update");
      if (!current) throw new Error("Order not found");
      if (current.status === "paid" || current.status === "canceled" || current.status === "review_required") return mapOrder(current);
      const [canceled] = await tx.update(orders).set({ status: "canceled" }).where(eq(orders.id, orderId)).returning();
      await tx.update(payments).set({ status: "canceled" }).where(eq(payments.orderId, orderId));
      await tx.delete(inventoryReservations).where(and(eq(inventoryReservations.orderId, orderId), eq(inventoryReservations.status, "payment_pending")));
      return mapOrder(canceled);
    });
  }

  async releaseUnpaidOrder(orderId: string) { await this.db.transaction(async (tx) => { const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for("update"); if (!row || row.payment) return; await tx.delete(inventoryReservations).where(and(eq(inventoryReservations.orderId, orderId), eq(inventoryReservations.status, "active"))); await tx.delete(orders).where(eq(orders.id, orderId)); }); }
  async listPaymentPendingBefore(cutoffIso: string, limit: number) { const rows = await this.db.select().from(orders).where(and(eq(orders.status, "payment_pending"), lt(orders.createdAt, cutoffIso))).limit(limit); return rows.map(mapOrder); }
}
