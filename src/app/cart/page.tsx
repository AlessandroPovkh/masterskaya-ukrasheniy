import type { Metadata } from "next";
import { CartPageClient } from "@/cart/cart-ui";
import { launchConfig } from "@/config/launch-gates";

export const metadata: Metadata = { title: "Корзина" };
export default function CartPage(){const isPreview=launchConfig.mode==="preview";return <main className="page-main"><header className="page-intro"><p className="eyebrow">Ваш выбор</p><h1>Корзина</h1><p>{isPreview ? "Уникальные работы добавляются по одной. Данные и оплата на этой версии демонстрационные." : "Уникальные работы добавляются по одной и резервируются при переходе к оплате."}</p></header><CartPageClient isPreview={isPreview} staticDemo={launchConfig.staticDemo} /></main>}
