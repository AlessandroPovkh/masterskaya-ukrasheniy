import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function loadLazyImages(page: import("@playwright/test").Page) {
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, 0));
}

const viewports = [
  { name: "320", width: 320, height: 720 },
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
  { name: "1920", width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`home has no horizontal overflow at ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "one deterministic screenshot set");
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await loadLazyImages(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await mkdir("artifacts/qa/screenshots", { recursive: true });
    await page.screenshot({ path: `artifacts/qa/screenshots/home-${viewport.name}.png`, fullPage: true });
  });
}

test("product and checkout layouts stay inside a 375px viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "one deterministic screenshot set");
  await page.setViewportSize({ width: 375, height: 812 });
  for (const [name, path] of [["product", "/catalog/svetlaya-orbita/"], ["checkout", "/checkout/"]] as const) {
    await page.goto(path);
    await loadLazyImages(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/qa/screenshots/${name}-375.png`, fullPage: true });
  }
});
