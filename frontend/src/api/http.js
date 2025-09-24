// frontend/src/api/http.js
export async function httpJson(url, opts={}) {
    const res = await fetch(url, opts);
    if (res.ok) return res.json();
    let msg = "Unexpected error";
    try { const b = await res.json(); msg = b.error || msg; } catch {}
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
  