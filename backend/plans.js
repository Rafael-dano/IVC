export const PLANS = {
  FREE: {
    label: "FREE",
    monthlyRequests: 50,
    maxTokens: 100_000, 
    maxTranscriptSeconds: 15 * 60,        
  },
  LTD_99: {
    label: "LTD (99)",
    monthlyRequests: 4_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 3 * 60 * 60,
  },
  LTD_149: {
    label: "LTD (149)",
    monthlyRequests: 5_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 3 * 60 * 60,
  },
  LTD_199: {
    label: "LTD (199)",
    monthlyRequests: 10_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 3 * 60 * 60,
  },
  PRO: {
    label: "PRO",
    monthlyRequests: 4_000,
    maxTokens: 3_000_000,
    maxTranscriptSeconds: 5 * 60 * 60,
  },
  BETA_FREE: {
    name: "Beta Free",
    monthlyRequests: 5_000,
    maxTokens: 10_000_000,
    maxTranscriptSeconds: 30 * 60, 
  },
};
const isBeta = process.env.BETA_MODE === "1";
if (isBeta && PLANS?.FREE) {
  PLANS.FREE.maxTranscriptSeconds = 30 * 60; 
}

export default PLANS;
