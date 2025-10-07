const ENV = (typeof import.meta !== "undefined" && import.meta.env)
  ? import.meta.env
  : (typeof process !== "undefined" && process.env ? process.env : {});

// Prefer SAME-ORIGIN. Only honor VITE_API_BASE if it's a full http(s) URL.
const RAW = (ENV.VITE_API_BASE || ENV.API_BASE || "").trim();
const BASE = /^https?:\/\//i.test(RAW) ? RAW.replace(/\/+$/, "") : "";

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

export async function httpJson(path, opts = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) }
  });
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) {
    throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
  }
  return body || {};
}