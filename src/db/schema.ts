import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  itemIds: text("item_ids").array().notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  idempotenceKey: text("idempotence_key").notNull().unique(),
  status: text("status").notNull(),
  payment: jsonb("payment"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const inventoryReservations = pgTable("inventory_reservations", {
  productId: text("product_id").primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  providerPaymentId: text("provider_payment_id").notNull().unique(),
  idempotenceKey: text("idempotence_key").notNull().unique(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  test: boolean("test").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const webhookReceipts = pgTable("webhook_receipts", {
  bodyHash: text("body_hash").primaryKey(),
  eventType: text("event_type").notNull(),
  providerObjectId: text("provider_object_id").notNull(),
  result: text("result").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
