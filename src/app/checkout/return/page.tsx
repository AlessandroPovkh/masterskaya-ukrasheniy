import { notFound } from "next/navigation";
import { ReturnStatusClient } from "@/orders/checkout-ui";
import { launchConfig } from "@/config/launch-gates";

export default async function ReturnPage({searchParams}:{searchParams:Promise<{order?:string}>}){const order=(await searchParams).order;if(!order)notFound();return <main className="payment-stage"><ReturnStatusClient orderId={order} isPreview={launchConfig.mode==="preview"}/></main>}
