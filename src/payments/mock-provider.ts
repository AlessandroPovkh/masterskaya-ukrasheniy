import type { CreatePaymentInput, CreatedPayment, PaymentProvider, VerifiedPayment } from "./types";

export class MockPaymentProvider implements PaymentProvider {
  createCount = 0;
  private readonly payments = new Map<string, VerifiedPayment>();

  async create(input: CreatePaymentInput): Promise<CreatedPayment> {
    this.createCount += 1;
    const paymentId = `mock-${input.orderId}`;
    this.payments.set(paymentId, { paymentId, orderId: input.orderId, status: "pending", amountMinor: input.amountMinor, currency: input.currency, test: true });
    return { paymentId, status: "pending", confirmationUrl: `/checkout/mock/?order=${encodeURIComponent(input.orderId)}`, amountMinor: input.amountMinor, currency: input.currency, test: true };
  }

  succeed(paymentId: string): VerifiedPayment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error("Unknown mock payment");
    const succeeded = { ...payment, status: "succeeded" as const };
    this.payments.set(paymentId, succeeded);
    return succeeded;
  }
}
