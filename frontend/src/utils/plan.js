// treat PRO, ANNUAL, and any LTD_* as paid
export function isPaid(plan) {
    const p = String(plan || "").toUpperCase();
    return p === "PRO" || p === "ANNUAL" || p.startsWith("LTD_");
  }