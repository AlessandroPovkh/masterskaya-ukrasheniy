import Image from "next/image";
import Link from "next/link";
import { catalog } from "@/catalog/catalog";
import { ProductCard } from "@/components/product-card";
import { launchConfig } from "@/config/launch-gates";
import { withBasePath } from "@/config/paths";

export default function HomePage() {
  const available = catalog.filter((product) => product.availability === "in_stock");
  const archived = catalog.filter((product) => product.availability !== "in_stock");
  const isPreview = launchConfig.mode === "preview";
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Авторские украшения · ручная сборка</p>
          <h1>Украшения с <em>видимым</em> характером.</h1>
          <p className="hero-lead">Форма рождается из материала, соединения и следа ручной сборки. Каждая работа живёт чуть иначе.</p>
          <div className="actions">
            <Link className="button button-primary" href="#available">Смотреть в наличии</Link>
            <Link className="button button-ghost" href="/catalog/">Все работы</Link>
          </div>
        </div>
        <div className="hero-image organic-frame">
          <Image src={withBasePath("/products/work-05-view-01.jpg")} alt="Крупное авторское кольцо на руке" width={720} height={1280} priority loading="eager" sizes="(max-width: 800px) 100vw, 45vw" />
          <span className="image-note">Живая материя · 01</span>
        </div>
        <Image className="hero-mark" src={withBasePath("/brand/mark.svg")} alt="" width={150} height={150} />
      </section>

      <section className="section products-section" id="available">
        <div className="section-heading"><p className="eyebrow">Сейчас</p><h2>В наличии</h2><p>{isPreview ? "Три демонстрационные работы показывают будущую логику магазина. Перед запуском данные будут заменены на подтверждённые." : "Работы, которые сейчас можно выбрать и оплатить."}</p></div>
        <div className="product-grid">{available.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}</div>
        <section className="collection-ledger" aria-labelledby="collection-ledger-title">
          <div className="collection-ledger-intro">
            <p className="eyebrow">Малая коллекция</p>
            <h2 id="collection-ledger-title">Коллекция 01—05</h2>
            <p>Пять форм складываются в один живой архив: доступные работы соседствуют с проданными и заказными.</p>
          </div>
          <div className="collection-ledger-list">
            {catalog.map((product, index) => (
              <Link href={`/catalog/${product.slug}/`} key={product.id} className="collection-ledger-row">
                <span className="collection-ledger-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="collection-ledger-name">{product.title}</span>
                <span className="collection-ledger-category">{product.category}</span>
                <span className={`collection-ledger-status status-${product.availability}`}>{product.availability === "in_stock" ? "В наличии" : product.availability === "sold" ? "Продано" : "Похожее на заказ"}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="manifest-section">
        <div className="manifest-orbit" aria-hidden="true"><Image src={withBasePath("/brand/mark.svg")} alt="" width={240} height={240} /></div>
        <p className="eyebrow">Живая материя</p>
        <h2>Неровность становится частью композиции.</h2>
        <p>Мы смотрим не только на блеск, но на линию, вес, ритм и то, как украшение встречается с телом.</p>
      </section>

      <section className="editorial-split section">
        <div className="editorial-image organic-frame"><Image src={withBasePath("/products/work-01-view-02.jpg")} alt="Макро светлого ожерелья" width={960} height={1280} sizes="(max-width: 800px) 100vw, 48vw" /></div>
        <div className="editorial-copy"><p className="eyebrow">Ручная пластика</p><h2>Деталь не прячется.</h2><p>Соединение, асимметрия и природный ритм становятся частью образа, а не техническим фоном.</p><Link className="text-link" href="/about/">О подходе мастерской →</Link></div>
      </section>

      <section className="how-section section">
        <div className="section-heading"><p className="eyebrow">Два пути</p><h2>Выбрать или продолжить историю</h2></div>
        <div className="steps"><article><span>01</span><h3>Работа в наличии</h3><p>Откройте карточку, добавьте изделие в корзину и {launchConfig.staticDemo ? "обсудите заказ с мастерской" : isPreview ? "пройдите безопасный тестовый checkout" : "перейдите к защищённой оплате"}.</p></article><article><span>02</span><h3>Работа продана</h3><p>Сохраните настроение и отправьте запрос на похожую работу. Точное повторение не обещается.</p></article></div>
      </section>

      <section className="section archive-section">
        <div className="section-heading"><p className="eyebrow">Архив формы</p><h2>Проданные и заказные работы</h2></div>
        <div className="product-grid product-grid-small">{archived.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </main>
  );
}
