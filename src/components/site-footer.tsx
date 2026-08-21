import Link from "next/link";
import Image from "next/image";
import { launchConfig } from "@/config/launch-gates";
import { withBasePath } from "@/config/paths";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <div className="footer-logo-field"><Image src={withBasePath("/brand/logo-stacked.svg")} alt="Мастерская украшений" width={230} height={220} /></div>
        <p>Живая материя — форма, цвет и видимый след ручной сборки.</p>
      </div>
      <div className="footer-links">
        <Link href="/catalog/">Все работы</Link>
        <Link href="/delivery/">Доставка и оплата</Link>
        <Link href="/care/">Уход</Link>
        <Link href="/contacts/">Контакты</Link>
      </div>
      <div className="footer-meta">{launchConfig.mode === "preview" ? <><p>Preview 2026</p><p>Данные изделий требуют утверждения перед публикацией.</p></> : <p>© Мастерская украшений</p>}</div>
    </footer>
  );
}
