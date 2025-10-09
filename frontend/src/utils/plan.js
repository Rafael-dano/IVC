// treat PRO, ANNUAL, any ANNUAL_* promo tier, and any LTD_* as paid
export function isPaid(plan) {
  const p = String(plan || "").toUpperCase();
  return (
    p === "PRO" ||
    p === "ANNUAL" ||
    p.startsWith("ANNUAL_") ||
    p.startsWith("LTD_")
  );
}