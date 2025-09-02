// backend/plans.js
export const PLANS = {
    FREE:    { monthlyRequests: 50,  maxTokens: 200_000 }, // ~ 200K tokens/month
    BETA:    { monthlyRequests: 250, maxTokens: 1_000_000 },
    LTD:     { monthlyRequests: 5_000, maxTokens: 10_000_000 },
    PRO:     { monthlyRequests: 2_000, maxTokens: 5_000_000 }, // monthly subscription
  };
   