import { sendEvent } from "./ga";

const CHECKOUT_STORAGE_KEY = "ivc:pending-checkout";
const CHECKOUT_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

function now() {
  return Date.now ? Date.now() : new Date().getTime();
}

function safeCall(eventName, params) {
  sendEvent(eventName, params);
}

function safeStore(record) {
  try {
    const payload = JSON.stringify(record);
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, payload);
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.debug("Failed to persist checkout record", err);
    }
  }
}

function safeLoad() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.debug("Failed to read checkout record", err);
    }
    return null;
  }
}

function safeClear() {
  try {
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.debug("Failed to clear checkout record", err);
    }
  }
}

export function trackSignUp(method = "email") {
  safeCall("sign_up", { method });
}

export function trackSelectPromotion({
  promotion_name,
  creative_name,
  location_id,
} = {}) {
  safeCall("select_promotion", {
    ...(promotion_name ? { promotion_name } : {}),
    ...(creative_name ? { creative_name } : {}),
    ...(location_id ? { location_id } : {}),
  });
}

export function trackBeginCheckout({
  priceTier,
  region,
  offerType,
  amount,
  currency = "USD",
} = {}) {
  const resolvedPriceTier = priceTier || "unknown";
  const resolvedRegion = region || "unknown";
  const resolvedOfferType = offerType || "unknown";
  safeCall("begin_checkout", {
    price_tier: resolvedPriceTier,
    region: resolvedRegion,
    offer_type: resolvedOfferType,
    ...(typeof amount === "number"
      ? { amount, value: amount, currency }
      : {}),
    ...(!amount && currency ? { currency } : {}),
  });
}

export function registerCheckoutSession({
  sessionId,
  priceTier,
  region,
  offerType,
  amount,
  value,
  currency = "USD",
} = {}) {
  if (!sessionId) return;
  const rawAmount = amount ?? value;
  const numericAmount =
    typeof rawAmount === "number" ? rawAmount : Number(rawAmount) || undefined;
  const record = {
    transaction_id: sessionId,
    priceTier: priceTier || "unknown",
    region: region || "unknown",
    offerType: offerType || "unknown",
    amount: numericAmount,
    currency,
    timestamp: now(),
  };
  safeStore(record);
}

export function consumePendingCheckout() {
  const record = safeLoad();
  if (!record) return null;
  if (record.timestamp && now() - record.timestamp > CHECKOUT_MAX_AGE_MS) {
    safeClear();
    return null;
  }
  safeClear();
  return record;
}

export function trackPurchase({
  transaction_id,
  priceTier,
  region,
  offerType,
  amount,
  value,
  currency = "USD",
} = {}) {
  const rawAmount = amount ?? value;
  const numericAmount =
    typeof rawAmount === "number" ? rawAmount : Number(rawAmount) || undefined;
  const resolvedPriceTier = priceTier || "unknown";
  const resolvedRegion = region || "unknown";
  const resolvedOfferType = offerType || "unknown";
  const payload = {
    ...(transaction_id ? { transaction_id } : {}),
    price_tier: resolvedPriceTier,
    region: resolvedRegion,
    offer_type: resolvedOfferType,
    ...(typeof numericAmount === "number"
      ? { amount: numericAmount, value: numericAmount }
      : {}),
      currency,
  };
  safeCall("purchase", payload);
}

export function maybeTrackPurchaseFromStorage() {
  const record = consumePendingCheckout();
  if (!record) return false;
  trackPurchase(record);
  return true;
}