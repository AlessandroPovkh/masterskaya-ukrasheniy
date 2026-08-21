import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const basePath = (process.env.PAGES_BASE_PATH || "/masterskaya-ukrasheniy").replace(/\/$/, "");
const contentTypes = { ".css": "text/css", ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2" };
let server;
let baseUrl = process.env.PAGES_TEST_URL;

if (!baseUrl) {
  const outRoot = join(projectRoot, "out");
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      if (!pathname.startsWith(`${basePath}/`)) { response.writeHead(404).end(); return; }
      const relativePath = normalize(pathname.slice(basePath.length + 1));
      let filePath = join(outRoot, relativePath);
      if (!filePath.startsWith(outRoot)) { response.writeHead(403).end(); return; }
      const details = await stat(filePath);
      if (details.isDirectory()) filePath = join(filePath, "index.html");
      const body = await readFile(filePath);
      response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream" }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}${basePath}/`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const failures = [];
const apiRequests = [];

page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });
page.on("response", (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
page.on("request", (request) => { if (new URL(request.url()).pathname.includes("/api/")) apiRequests.push(request.url()); });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  if (!(await page.getByRole("heading", { level: 1, name: /Украшения с/ }).isVisible())) throw new Error("homepage heading is missing");
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error("homepage overflows at 375px");

  await page.goto(new URL("catalog/?availability=in_stock", baseUrl).href, { waitUntil: "networkidle" });
  if (await page.locator(".product-card").count() !== 3) throw new Error("availability filter did not retain exactly three demo works");

  await page.goto(new URL("delivery/", baseUrl).href, { waitUntil: "networkidle" });
  const deliveryCopy = await page.locator("main").innerText();
  if (deliveryCopy.includes("работает mock checkout") || !deliveryCopy.includes("Оплата в публичной демонстрации отключена")) {
    throw new Error("delivery page incorrectly presents server checkout as available");
  }

  await page.goto(new URL("catalog/svetlaya-orbita/", baseUrl).href, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await page.locator("a.cart-link").click();
  await page.waitForURL(/\/cart\/$/);
  const contactLink = page.getByRole("link", { name: "Обсудить заказ" });
  if (!(await contactLink.isVisible())) throw new Error("static cart did not replace checkout with the contact action");
  await contactLink.click();
  await page.waitForURL(/\/contacts\/$/);
  if (!page.url().includes("/contacts/")) throw new Error("contact action did not open the contacts page");
  if (!(await page.locator('meta[name="robots"]').first().getAttribute("content"))?.includes("noindex")) throw new Error("noindex metadata is missing");
  if ((await page.locator("textarea").inputValue()).includes("http://localhost")) throw new Error("inquiry text contains localhost");

  if (apiRequests.length) throw new Error(`static demo requested server API: ${apiRequests.join(", ")}`);
  if (failures.length) throw new Error(`browser failures:\n${failures.join("\n")}`);
  console.log("GitHub Pages browser verification passed");
} finally {
  await browser.close();
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
