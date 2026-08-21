import { NextResponse } from "next/server";
import { launchConfig } from "@/config/launch-gates";
import { services } from "@/orders/runtime";
import { MockPaymentProvider } from "@/payments/mock-provider";
import { applyVerifiedPayment } from "@/orders/service";

export async function POST(request: Request) {
  if (launchConfig.mode !== "preview" || !(services.provider instanceof MockPaymentProvider)) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const body = await request.json() as { orderId?: string };
  const order = body.orderId ? await services.store.getById(body.orderId) : null;
  if (!order?.payment) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const verified = services.provider.succeed(order.payment.paymentId);
  const updated = await applyVerifiedPayment(verified, services.store, true);
  return NextResponse.json({ orderId: updated.id, status: updated.status });
}
