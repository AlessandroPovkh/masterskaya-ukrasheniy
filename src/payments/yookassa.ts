import type { CreatePaymentInput, CreatedPayment, PaymentProvider, VerifiedPayment } from "./types";

type Fetch = typeof fetch;
type YooKassaConfig = { shopId: string; secretKey: string; returnUrl: string; mode: "test" | "live"; fetch?: Fetch };
type YooKassaPayment = { id: string; status: "pending" | "succeeded" | "canceled"; paid: boolean; test: boolean; amount: { value: string; currency: "RUB" }; confirmation?: { confirmation_url?: string }; metadata?: { order_id?: string } };

export class PaymentUnknownError extends Error {}

const amountToMinor = (value: string) => {
  if (!/^\d+\.\d{2}$/.test(value)) throw new Error("YooKassa returned an invalid amount");
  return Math.round(Number(value) * 100);
};

export class YooKassaProvider implements PaymentProvider {
  private readonly request: Fetch;
  constructor(private readonly config: YooKassaConfig) { this.request = config.fetch ?? fetch; }

  private headers(idempotenceKey?: string) {
    const headers = new Headers({ Authorization: `Basic ${Buffer.from(`${this.config.shopId}:${this.config.secretKey}`).toString("base64")}`, "Content-Type": "application/json" });
    if (idempotenceKey) headers.set("Idempotence-Key", idempotenceKey);
    return headers;
  }

  async create(input: CreatePaymentInput): Promise<CreatedPayment> {
    let response: Response;
    try {
      response = await this.request("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: this.headers(input.idempotenceKey),
        body: JSON.stringify({
          amount: { value: (input.amountMinor / 100).toFixed(2), currency: input.currency },
          capture: true,
          confirmation: { type: "redirect", return_url: `${this.config.returnUrl}?order=${encodeURIComponent(input.orderId)}` },
          description: input.description.slice(0, 128),
          metadata: { order_id: input.orderId },
        }),
      });
    } catch {
      throw new PaymentUnknownError("YooKassa network result is unknown; retry with the same idempotence key");
    }
    if (response.status >= 500) throw new PaymentUnknownError("YooKassa result is unknown; retry with the same idempotence key");
    if (!response.ok) throw new Error(`YooKassa rejected payment creation (${response.status})`);
    try {
      const payment = (await response.json()) as YooKassaPayment;
      if (payment.test !== (this.config.mode === "test")) throw new Error("environment mismatch");
      const confirmationUrl = payment.confirmation?.confirmation_url;
      if (!confirmationUrl) throw new Error("missing confirmation URL");
      return { paymentId: payment.id, status: "pending", confirmationUrl, amountMinor: amountToMinor(payment.amount.value), currency: payment.amount.currency, test: payment.test };
    } catch (error) {
      throw new PaymentUnknownError(`YooKassa created an unverifiable payment response: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  async get(paymentId: string): Promise<VerifiedPayment> {
    const response = await this.request(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, { headers: this.headers() });
    if (!response.ok) throw new Error(`Unable to verify YooKassa payment (${response.status})`);
    const payment = (await response.json()) as YooKassaPayment;
    if (payment.test !== (this.config.mode === "test")) throw new Error("YooKassa payment environment mismatch");
    if (payment.status === "succeeded" && !payment.paid) throw new Error("YooKassa returned an unpaid succeeded payment");
    const orderId = payment.metadata?.order_id;
    if (!orderId) throw new Error("Verified payment has no order metadata");
    return { paymentId: payment.id, orderId, status: payment.status, amountMinor: amountToMinor(payment.amount.value), currency: payment.amount.currency, test: payment.test };
  }
}
