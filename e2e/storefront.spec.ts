import { expect, test } from "@playwright/test";

test("storefront explains the product and exposes available work", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Украшения с/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Смотреть в наличии" })).toBeVisible();
  await expect(page.locator("#available .product-card")).toHaveCount(3);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
  expect(errors).toEqual([]);
});

test("collection ledger and adjacent work links keep the five-object cabinet connected", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Коллекция 01—05" }).getByRole("link")).toHaveCount(5);
  expect(await page.locator(".status").first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(11);

  await page.goto("/catalog/svetlaya-orbita/");
  const leadImage = page.locator(".product-gallery-lead");
  const productInfo = page.locator(".product-info");
  const extraImages = page.locator(".product-gallery-more");
  expect(await leadImage.evaluate((element) => element.compareDocumentPosition(document.querySelector(".product-info")!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  expect(await productInfo.evaluate((element) => element.compareDocumentPosition(document.querySelector(".product-gallery-more")!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  const [leadBox, infoBox, extraBox] = await Promise.all([leadImage.boundingBox(), productInfo.boundingBox(), extraImages.boundingBox()]);
  expect(leadBox!.y + leadBox!.height).toBeLessThanOrEqual(infoBox!.y + 1);
  expect(infoBox!.y + infoBox!.height).toBeLessThanOrEqual(extraBox!.y + 1);
  await expect(extraImages.getByRole("img")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Предыдущая.*Розовое окно/ })).toHaveAttribute("href", "/catalog/rozovoe-okno");
  await expect(page.getByRole("link", { name: /Следующая.*Синий ритм/ })).toHaveAttribute("href", "/catalog/siniy-ritm");
});

test("preview comparison price is visible only where fixture data provides it", async ({ page }) => {
  await page.goto("/");
  const firstAvailableCard = page.locator("#available .product-card").first();
  await expect(firstAvailableCard.locator("del")).toHaveText(/8\s*000/);
  await expect(firstAvailableCard.locator(".current-price")).toHaveText(/6\s*999/);

  await page.goto("/catalog/svetlaya-orbita/");
  await expect(page.locator(".pdp-price del")).toHaveText(/8\s*000/);
  await expect(page.locator(".pdp-price .current-price")).toHaveText(/6\s*999/);

  await page.goto("/catalog/siniy-ritm/");
  await expect(page.locator(".pdp-price del")).toHaveCount(0);
});

test("sold work cannot enter cart and offers a similar-work path", async ({ page }) => {
  await page.goto("/catalog/siniy-ritm/");
  await expect(page.getByText("Продано", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Добавить в корзину/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Запросить похожее" })).toHaveAttribute("href", /MU-FIX-002/);
});

test("mock checkout completes without trusting the return URL", async ({ page }, testInfo) => {
  const product = testInfo.project.name === "webkit"
    ? { slug: "yagodnaya-nit", title: "Ягодная нить" }
    : { slug: "svetlaya-orbita", title: "Светлая орбита" };
  await page.goto(`/catalog/${product.slug}/`);
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await page.getByRole("link", { name: /Корзина/ }).first().click();
  await expect(page.getByRole("heading", { name: product.title })).toBeVisible();
  await page.getByRole("link", { name: "Перейти к оформлению" }).click();
  await page.getByRole("button", { name: /Перейти к тестовой оплате/ }).click();
  await expect(page.getByRole("heading", { name: "Подтвердить тестовый платёж" })).toBeVisible();
  await page.getByRole("button", { name: "Оплатить тестовый заказ" }).click();
  await expect(page.getByRole("heading", { name: "Проверяем оплату." })).toBeVisible();
  await page.getByRole("button", { name: "Проверить статус" }).click();
  await expect(page.getByRole("heading", { name: "Оплата подтверждена." })).toBeVisible();
  await page.goto("/cart/");
  await expect(page.getByRole("heading", { name: "Пока здесь тихо." })).toBeVisible();
});

test("robots blocks preview crawling", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(await response.text()).toContain("Disallow: /");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
});

test("core content remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/catalog/");
  await expect(page.getByRole("heading", { name: "Все работы" })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(5);
  await context.close();
});
