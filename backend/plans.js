   // backend/plans.js
export const PLANS = {
  FREE: {
    label: "FREE",
    monthlyRequests: 50,
    maxTokens: 100_000,         
  },
  LTD_99: {
    label: "LTD (99)",
    monthlyRequests: 10_000,
    maxTokens: 10_000_000,
  },
  LTD_149: {
    label: "LTD (149)",
    monthlyRequests: 10_000,
    maxTokens: 10_000_000,
  },
  LTD_199: {
    label: "LTD (199)",
    monthlyRequests: 10_000,
    maxTokens: 10_000_000,
  },
  PRO: {
    label: "PRO",
    monthlyRequests: 10_000,
    maxTokens: 10_000_000,
  },
};