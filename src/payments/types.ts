export type CreatePaymentInput = {
  orderId: string;
  amountMinor: number;
  currency: "RUB";
  idempotenceKey: string;
  description: string;
};

export type CreatedPayment = {
  paymentId: string;
  status: "pending";
  confirmationUrl: string;
  amountMinor: number;
  currency: "RUB";
  test: boolean;
};

export type VerifiedPayment = {
  paymentId: string;
  orderId: string;
  status: "pending" | "succeeded" | "canceled";
  amountMinor: number;
  currency: "RUB";
  test: boolean;
};

export interface PaymentProvider {
  create(input: CreatePaymentInput): Promise<CreatedPayment>;
}
