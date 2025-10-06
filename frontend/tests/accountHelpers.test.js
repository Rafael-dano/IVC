import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const fetchCalls = [];

const RESPONSE_BY_PATH = {
  "/api/checkout/annual": "https://checkout.test/annual",
  "/api/checkout/annual-promo": "https://checkout.test/annual-promo",
  "/api/checkout/lifetime-400": "https://checkout.test/lifetime-400",
};

globalThis.window = { location: { href: "about:blank" } };

globalThis.fetch = async (url, options = {}) => {
  fetchCalls.push({ url, options });
  const target = typeof url === "string" ? url : String(url);
  const path = target.startsWith("http")
    ? new URL(target).pathname
    : new URL(target, "https://placeholder.local").pathname;
  const checkoutUrl = RESPONSE_BY_PATH[path] || "https://checkout.test/unknown";
  return {
    ok: true,
    async json() {
      return { url: checkoutUrl };
    },
  };
};

process.env.VITE_API_BASE = "https://backend.test";

const supabaseModule = await import("../src/api/supabaseClient.js");
supabaseModule.supabase.auth.getSession = async () => ({
  data: { session: { access_token: "test-token" } },
});

const accountModule = await import("../src/api/account.js");
const { openAnnualCheckout, openAnnualPromo, openLifetime400 } = accountModule;

beforeEach(() => {
  fetchCalls.length = 0;
  window.location.href = "about:blank";
});

test("openAnnualCheckout posts region and redirects", async () => {
  await openAnnualCheckout("br");
  assert.strictEqual(window.location.href, "https://checkout.test/annual");
  assert.strictEqual(fetchCalls.length, 1);
  const [{ url, options }] = fetchCalls;
  assert.strictEqual(url, "https://backend.test/api/checkout/annual");
  assert.strictEqual(options.method, "POST");
  assert.strictEqual(options.headers.Authorization, "Bearer test-token");
  assert.deepStrictEqual(JSON.parse(options.body), { region: "br" });
});

test("openAnnualPromo posts code and redirects", async () => {
  await openAnnualPromo("annual_99");
  assert.strictEqual(window.location.href, "https://checkout.test/annual-promo");
  assert.strictEqual(fetchCalls.length, 1);
  const [{ url, options }] = fetchCalls;
  assert.strictEqual(url, "https://backend.test/api/checkout/annual-promo");
  assert.strictEqual(options.method, "POST");
  assert.deepStrictEqual(JSON.parse(options.body), { code: "annual_99" });
});

test("openLifetime400 posts and redirects", async () => {
  await openLifetime400();
  assert.strictEqual(window.location.href, "https://checkout.test/lifetime-400");
  assert.strictEqual(fetchCalls.length, 1);
  const [{ url, options }] = fetchCalls;
  assert.strictEqual(url, "https://backend.test/api/checkout/lifetime-400");
  assert.strictEqual(options.method, "POST");
  assert.strictEqual(options.body, undefined);
});

test.after(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete globalThis.fetch;
  }
  if (originalWindow) {
    globalThis.window = originalWindow;
  } else {
    delete globalThis.window;
  }
  delete process.env.VITE_API_BASE;
});