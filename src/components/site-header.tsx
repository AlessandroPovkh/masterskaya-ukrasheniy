import Link from "next/link";
import Image from "next/image";
import { CartCount } from "@/cart/cart-ui";
import { withBasePath } from "@/config/paths";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-link" aria-label="Мастерская украшений — на главную">
        <Image src={withBasePath("/brand/logo-primary.svg")} alt="" width={360} height={104} priority />
      </Link>
      <nav aria-label="Основная навигация">
        <Link href="/catalog/?availability=in_stock">В наличии</Link>
        <Link href="/catalog/">Все работы</Link>
        <Link href="/about/">О мастерской</Link>
      </nav>
      <Link href="/cart/" className="cart-link">Корзина <CartCount /></Link>
    </header>
  );
}
