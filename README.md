# Мастерская украшений — storefront preview

Локальная, закрытая от индексации витрина авторских украшений. Внутри — главная, каталог, пять карточек изделий, корзина, запрос похожей работы и полностью проходимая тестовая оплата. Названия, цены, статусы и описания сейчас являются демонстрационными и явно помечены как preview.

## Быстрый старт

Требуется Node.js 20.9+.

```bash
npm install
npm run dev
```

Открыть `http://localhost:3000`. Тестовый checkout включён скриптом запуска и не обращается к реальным платёжным системам.

## Проверка

```bash
npm run check
npm run test:e2e
npm audit
```

Браузерные тесты проверяют основные маршруты, запрет покупки проданного изделия, mock checkout, noindex, работу без JavaScript, accessibility в Chromium/WebKit и отсутствие горизонтального overflow на 320–1920 px.

## GitHub Pages demo

Публичная Pages-версия остаётся `noindex`-демонстрацией и не включает server API, YooKassa webhook или базу заказов. Корзина сохраняет визуальный сценарий, но ведёт к обсуждению заказа вместо оплаты.

```bash
PAGES_BASE_PATH=/masterskaya-ukrasheniy \
SITE_ORIGIN=https://OWNER.github.io/masterskaya-ukrasheniy \
npm run build:pages
```

Результат появляется в `out/`; workflow `.github/workflows/pages.yml` собирает и публикует его автоматически.

## Архитектура оплаты

- Клиент передаёт только идентификаторы изделий; цена и доступность определяются серверным каталогом.
- Уникальная работа резервируется на сервере до создания платежа.
- В preview используется in-memory store и mock provider.
- Production-конфигурация использует PostgreSQL, SQL-миграцию `drizzle/0000_storefront.sql` и серверный адаптер YooKassa.
- Idempotence-Key стабилен для повторного создания платежа, а возврат пользователя не считается подтверждением: статус повторно проверяется у провайдера.
- Webhook обрабатывается идемпотентно; секреты не попадают в клиентский bundle.
- Защищённый `POST /api/internal/reconcile` повторно проверяет зависшие платежи у YooKassa; в production его следует вызывать планировщиком каждые 5 минут с `Authorization: Bearer $SESSION_SECRET`.

## Подключение YooKassa test

1. Создать PostgreSQL и применить `psql "$DATABASE_URL" -f drizzle/0000_storefront.sql`.
2. Скопировать `.env.example` в `.env.local`.
3. Указать `PAYMENT_PROVIDER=yookassa`, `YOOKASSA_MODE=test`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `DATABASE_URL` и HTTPS `SITE_ORIGIN`.
4. Для реального production дополнительно закрыть все approval-флаги ниже. До этого production-сборка намеренно завершается ошибкой.

## Обязательные данные до публикации

- подтверждённые названия, цены, статусы, состав, размеры и сроки изготовления;
- права на фотографии;
- реквизиты продавца, оферта, политика конфиденциальности и согласия;
- правила доставки по России и СНГ, возврата и чеков;
- рабочие Telegram/WhatsApp ссылки;
- PostgreSQL, домен с HTTPS, YooKassa keys, `SESSION_SECRET`, `LOG_REDACTION_SALT`;
- все флаги `*_APPROVED=true` только после фактической проверки владельцем.

Не переводите fixture-каталог в production простым изменением флагов: сначала замените данные в `src/catalog/catalog.ts` на подтверждённые.

## Основные файлы

- `src/catalog/catalog.ts` — серверный каталог и availability-модель;
- `src/config/launch-gates.ts` — fail-closed production gates;
- `src/orders/` — заказ, резерв и хранилища;
- `src/payments/` — mock/YooKassa adapters;
- `src/app/api/` — checkout, status, mock completion и webhook;
- `public/brand/` и `public/fonts/` — нормативные бренд-активы;
- `artifacts/qa/` — скриншоты и итоговый QA-отчёт.
