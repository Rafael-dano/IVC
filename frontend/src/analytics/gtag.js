const CHECKOUT_STORAGE_KEY = "ivc:pending-checkout";
const CHECKOUT_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

function now() {
  return Date.now ? Date.now() : new Date().getTime();
}

function safeCall(eventName, params) {
  try {
    window.gtag?.("event", eventName, params);
  } catch (err) {
    if (import.meta?.env?.DEV) {
      console.debug("gtag event failed", eventName, err);
    }
  }
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

export function trackSignUp(method = "supabase") {
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
  itemCategory = "membership",
  itemName = "Membership",
  value,
  currency = "USD",
} = {}) {
  const amount = typeof value === "number" ? value : Number(value) || undefined;
  safeCall("begin_checkout", {
    item_category: itemCategory,
    item_name: itemName,
    ...(amount ? { price: amount, value: amount } : {}),
    currency,
  });
}

export function registerCheckoutSession({
  sessionId,
  itemCategory = "membership",
  itemName = "Membership",
  value,
  currency = "USD",
} = {}) {
  if (!sessionId) return;
  const amount = typeof value === "number" ? value : Number(value) || undefined;
  const record = {
    transaction_id: sessionId,
    value: amount,
    currency,
    items: [
      {
        ...(itemName ? { item_name: itemName } : {}),
        ...(itemCategory ? { item_category: itemCategory } : {}),
      },
    ],
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
  value,
  currency = "USD",
  items,
} = {}) {
  const payload = {
    ...(transaction_id ? { transaction_id } : {}),
    ...(typeof value === "number" ? { value } : {}),
    currency,
    ...(Array.isArray(items) && items.length > 0
      ? { items }
      : {}),
  };
  safeCall("purchase", payload);
}

export function maybeTrackPurchaseFromStorage() {
  const record = consumePendingCheckout();
  if (!record) return false;
  trackPurchase(record);
  return true;
}