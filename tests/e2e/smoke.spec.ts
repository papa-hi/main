/**
 * E2E smoke tests using Playwright.
 *
 * These tests require a running app (npm run dev) and browser binaries.
 * Install browsers once with: npx playwright install chromium
 *
 * Run with: npm run test:e2e
 */
import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page loads and shows PaPa-Hi branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PaPa-Hi/i);
  });

  test("places page is publicly accessible without login", async ({ page }) => {
    await page.goto("/places");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("community page is publicly accessible without login", async ({ page }) => {
    await page.goto("/community");
    await expect(page.locator("body")).toBeVisible();
  });

  test("about page renders", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("body")).toBeVisible();
  });

  test("auth page is reachable", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: /sign in|log in|inloggen/i })).toBeVisible();
  });
});

test.describe("PWA metadata", () => {
  test("has web app manifest linked", async ({ page }) => {
    await page.goto("/");
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
  });
});

test.describe("API smoke tests", () => {
  test("GET /api/config returns 200 with expected keys", async ({ request }) => {
    const res = await request.get("/api/config");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("vapidPublicKey");
    expect(body).not.toHaveProperty("weatherApiKey");
  });

  test("GET /api/user returns 401 when not authenticated", async ({ request }) => {
    const res = await request.get("/api/user");
    expect(res.status()).toBe(401);
  });

  test("GET /api/public/places returns 200", async ({ request }) => {
    const res = await request.get("/api/public/places?limit=5");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

test.describe("Navigation", () => {
  test("clicking login button navigates to auth page", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.getByRole("link", { name: /login|sign in|inloggen/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/auth/);
    }
  });
});
