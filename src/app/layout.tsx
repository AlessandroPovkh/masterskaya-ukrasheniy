import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { launchConfig } from "@/config/launch-gates";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/cart/cart-provider";

const prata = localFont({ src: "../../public/fonts/prata-cyrillic.woff2", variable: "--font-prata", display: "swap" });
const manrope = localFont({ src: "../../public/fonts/manrope-cyrillic.woff2", variable: "--font-manrope", display: "swap" });
const cormorant = localFont({ src: "../../public/fonts/cormorant-garamond-italic-cyrillic.woff2", variable: "--font-cormorant", display: "swap", style: "italic", weight: "500" });

export const metadata: Metadata = {
  title: { default: "Мастерская украшений — Живая материя", template: "%s — Мастерская украшений" },
  description: "Авторские украшения с видимым характером формы.",
  robots: launchConfig.mode === "production" ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className={`${prata.variable} ${manrope.variable} ${cormorant.variable}`}>
        <a className="skip-link" href="#main-content">К содержанию</a>
        {launchConfig.mode === "preview" && (
          <div className="preview-bar" role="status">
            Preview · названия, цены и статусы изделий демонстрационные · реальные платежи отключены
          </div>
        )}
        <CartProvider>
          <SiteHeader />
          <div id="main-content" tabIndex={-1}>{children}</div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
