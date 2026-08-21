import type { Metadata } from "next";
import { CheckoutClient } from "@/orders/checkout-ui";
import { launchConfig } from "@/config/launch-gates";

export const metadata: Metadata = { title: "Оформление" };
export default function CheckoutPage(){const isPreview=launchConfig.mode==="preview";return <main className="page-main"><header className="page-intro"><p className="eyebrow">Шаг 1 из 1{isPreview ? " · preview" : ""}</p><h1>Оформление</h1><p>{isPreview ? "Сейчас можно безопасно проверить механику заказа без реального списания и передачи персональных данных." : "Проверьте выбранные изделия и перейдите к защищённой оплате."}</p></header><CheckoutClient isPreview={isPreview} /></main>}
