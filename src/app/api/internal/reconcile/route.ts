import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { launchConfig } from "@/config/launch-gates";
import { services } from "@/orders/runtime";
import { applyVerifiedPayment } from "@/orders/service";
import { YooKassaProvider } from "@/payments/yookassa";

const authorized = (request: Request) => {
  const expected = process.env.SESSION_SECRET ?? "";
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
};

export async function POST(request: Request) {
  if (launchConfig.mode !== "production" || !(services.provider instanceof YooKassaProvider)) return NextResponse.json({ error: "Not available" }, { status: 404 });
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cutoffIso = new Date(Date.now() - 15 * 60_000).toISOString();
  const pending = await services.store.listPaymentPendingBefore(cutoffIso, 50);
  let reconciled = 0;
  let requiresRetry = 0;
  for (const order of pending) {
    if (!order.payment) continue;
    try {
      const verified = await services.provider.get(order.payment.paymentId);
      await applyVerifiedPayment(verified, services.store, false);
      reconciled += 1;
    } catch (error) {
      requiresRetry += 1;
      console.error("payment_reconciliation_failed", { orderId: order.id, message: error instanceof Error ? error.message : "unknown" });
    }
  }
  return NextResponse.json({ checked: pending.length, reconciled, requiresRetry });
}
