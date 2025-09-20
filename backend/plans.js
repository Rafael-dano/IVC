   // backend/plans.js
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
// backend/plans.js (append this at the end of the file)
const isBeta = process.env.BETA_MODE === "1";
// Temporarily boost FREE transcription minutes during beta:
if (isBeta && PLANS?.FREE) {
  PLANS.FREE.maxTranscriptSeconds = 30 * 60; // 30 minutes
}

export const LTD_PRICE_IDS = {
    LTD_99: {
      USD: "price_usd_ltd99",
      EUR: "price_eur_ltd99",
      GBP: "price_gbp_ltd99",
      CAD: "price_cad_ltd99",
      AUD: "price_aud_ltd99",
      INR: "price_inr_ltd99",
      JPY: "price_jpy_ltd99",
      BRL: "price_brl_ltd99",
      MXN: "price_mxn_ltd99",
      ZAR: "price_zar_ltd99",
      SGD: "price_sgd_ltd99",
      HKD: "price_hkd_ltd99",
      SEK: "price_sek_ltd99",
      CHF: "price_chf_ltd99",
      NZD: "price_nzd_ltd99",
    },
    LTD_149: {
      USD: "price_usd_ltd149",
      EUR: "price_eur_ltd149",
      GBP: "price_gbp_ltd149",
      CAD: "price_cad_ltd149",
      AUD: "price_aud_ltd149",
      INR: "price_inr_ltd149",
      JPY: "price_jpy_ltd149",
      BRL: "price_brl_ltd149",
      MXN: "price_mxn_ltd149",
      ZAR: "price_zar_ltd149",
      SGD: "price_sgd_ltd149",
      HKD: "price_hkd_ltd149",
      SEK: "price_sek_ltd149",
      CHF: "price_chf_ltd149",
      NZD: "price_nzd_ltd149",
    },
    LTD_199: {
      USD: "price_usd_ltd199",
      EUR: "price_eur_ltd199",
      GBP: "price_gbp_ltd199",
      CAD: "price_cad_ltd199",
      AUD: "price_aud_ltd199",
      INR: "price_inr_ltd199",
      JPY: "price_jpy_ltd199",
      BRL: "price_brl_ltd199",
      MXN: "price_mxn_ltd199",
      ZAR: "price_zar_ltd199",
      SGD: "price_sgd_ltd199",
      HKD: "price_hkd_ltd199",
      SEK: "price_sek_ltd199",
      CHF: "price_chf_ltd199",
      NZD: "price_nzd_ltd199",
    },
  };
  
  export const SUPPORTED_LTD_CURRENCIES = Object.freeze([
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "INR",
    "JPY",
    "BRL",
    "MXN",
    "ZAR",
    "SGD",
    "HKD",
    "SEK",
    "CHF",
    "NZD",
  ]);
  
  export default PLANS;
