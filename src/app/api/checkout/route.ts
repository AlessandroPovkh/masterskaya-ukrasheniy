import { NextResponse } from "next/server";
import { launchConfig } from "@/config/launch-gates";
import { createCheckout } from "@/orders/service";
import { services } from "@/orders/runtime";
import { CheckoutError } from "@/orders/types";

export async function POST(request: Request) {
  if (!launchConfig.checkoutEnabled) return NextResponse.json({ error: "Checkout is disabled" }, { status: 503 });
  try {
    const body = await request.json() as { itemIds?: unknown; idempotenceKey?: unknown };
    if (!Array.isArray(body.itemIds) || !body.itemIds.every((id) => typeof id === "string") || typeof body.idempotenceKey !== "string" || body.idempotenceKey.length > 64) {
      return NextResponse.json({ error: "Некорректная корзина" }, { status: 400 });
    }
    return NextResponse.json(await createCheckout({ itemIds: body.itemIds, idempotenceKey: body.idempotenceKey }, services));
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === "OUT_OF_STOCK" ? 409 : 400 });
    console.error("checkout_failed", { message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Не удалось создать оплату. Корзина сохранена — попробуйте ещё раз." }, { status: 502 });
  }
}
