export const PLANS = {
  FREE: {
    label: "FREE",
    monthlyRequests: 50,
    maxTokens: 100_000,
    maxTranscriptSeconds: 15 * 60,
  },
  ANNUAL_99: {
    label: "ANNUAL (99)",
    monthlyRequests: 4_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 5 * 60 * 60,
  },
  ANNUAL_149: {
    label: "ANNUAL (149)",
    monthlyRequests: 5_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 5 * 60 * 60,
  },
  LTD_400: {
    label: "LTD (400)",
    monthlyRequests: 20_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 5 * 60 * 60,
  },
  ANNUAL: {
    label: "ANNUAL",
    monthlyRequests: 4_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 5 * 60 * 60,
  },
  PRO: {
    label: "PRO",
    monthlyRequests: 4_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 5 * 60 * 60,
  },
  BETA_FREE: {
    name: "Beta Free",
    monthlyRequests: 2_000,
    maxTokens: 1_000_000,
    maxTranscriptSeconds: 30 * 60,
  },
};
const isBeta = process.env.BETA_MODE === "1";
if (isBeta && PLANS?.FREE) {
  PLANS.FREE.maxTranscriptSeconds = 30 * 60;
}

// treat PRO, ANNUAL, and any LTD_* as paid
export function isPaidPlan(plan) {
  const p = String(plan || "").toUpperCase();
  return (
    p === "PRO" ||
    p === "ANNUAL" ||
    p.startsWith("ANNUAL_") ||
    p.startsWith("LTD_") ||
    p.startsWith("LTD")
  );
}

export default PLANS;