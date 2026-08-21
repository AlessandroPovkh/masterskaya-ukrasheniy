import { NextResponse } from "next/server";
import { services } from "@/orders/runtime";
import { YooKassaProvider } from "@/payments/yookassa";
import { applyVerifiedPayment } from "@/orders/service";
import { launchConfig } from "@/config/launch-gates";
import { createHash } from "node:crypto";

export async function POST(request: Request) {
  if (!(services.provider instanceof YooKassaProvider)) return NextResponse.json({ ok: true });
  if (Number(request.headers.get("content-length") ?? 0) > 32_768) return NextResponse.json({ error: "Notification too large" }, { status: 413 });
  const rawBody = await request.text();
  let body: { event?: string; object?: { id?: string } };
  try { body = JSON.parse(rawBody) as typeof body; } catch { return NextResponse.json({ error: "Invalid notification" }, { status: 400 }); }
  if (!body.object?.id) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  try {
    const verified = await services.provider.get(body.object.id);
    await applyVerifiedPayment(verified, services.store, launchConfig.yookassaMode === "test", { bodyHash: createHash("sha256").update(rawBody).digest("hex"), eventType: body.event ?? "unknown", providerObjectId: body.object.id, result: verified.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("yookassa_webhook_failed", { paymentId: body.object.id, message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }
}
