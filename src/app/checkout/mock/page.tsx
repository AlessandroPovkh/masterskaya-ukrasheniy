import { notFound } from "next/navigation";
import { launchConfig } from "@/config/launch-gates";
import { MockPaymentClient } from "@/orders/checkout-ui";

export default async function MockPage({searchParams}:{searchParams:Promise<{order?:string}>}){const order=(await searchParams).order;if(launchConfig.mode!=="preview"||!order)notFound();return <main className="payment-stage"><MockPaymentClient orderId={order}/></main>}
