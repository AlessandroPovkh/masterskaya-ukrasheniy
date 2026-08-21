import { NextResponse } from "next/server";
import { services } from "@/orders/runtime";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("order");
  if (!orderId) return NextResponse.json({ error: "Order is required" }, { status: 400 });
  const order = await services.store.getById(orderId);
  return order ? NextResponse.json({ orderId: order.id, status: order.status, amountMinor: order.amountMinor, currency: order.currency }) : NextResponse.json({ error: "Order not found" }, { status: 404 });
}
