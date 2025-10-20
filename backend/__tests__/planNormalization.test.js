import test from "node:test";
import assert from "node:assert/strict";

import { PLAN_LIMITS, normalizePlanKey } from "../middleware/authAndLimits.js";
import { isPaidPlan } from "../plans.js";

test("normalizePlanKey maps LTD plans without underscore", () => {
  const normalized = normalizePlanKey("LTD400");
  assert.equal(normalized, "LTD_400");
  assert.equal(PLAN_LIMITS[normalized], PLAN_LIMITS.LTD_400);
});

test("isPaidPlan treats LTD plans with and without underscore as paid", () => {
  assert.equal(isPaidPlan("LTD_400"), true);
  assert.equal(isPaidPlan("LTD400"), true);
});