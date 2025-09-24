// frontend/src/api/http.js
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

export async function httpJson(pathOrUrl, opts = {}) {
  const isAbs = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbs ? pathOrUrl : `${API_BASE}${pathOrUrl}`;

  // Default headers + JSON body support
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  let body = opts.body;

  // If body is a plain object, auto-JSON it
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method: opts.method || (body ? "POST" : "GET"),
    headers,
    credentials: opts.credentials ?? "include", // include if you ever use cookies/session
    body,
  });

  if (res.ok) {
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  // --- your original friendly errors ---
  let msg = "Unexpected error";
  try {
    const b = await res.json();
    msg = b.error || msg;
  } catch {}

  switch (res.status) {
    case 401: msg = "Please sign in to continue."; break;
    case 403: msg = "Your plan has reached its limit."; break;
    case 409: msg = "Looks like that sold out just now."; break;
    case 429: msg = "You’re going too fast. Try again in a minute."; break;
    case 500: msg = "Something went wrong on our side. Please try again."; break;
  }
  const e = new Error(msg);
  e.status = res.status;
  throw e;
}
