export function buildTrackedUrl(baseUrl, {
    source,
    medium,
    campaign,
    content,
    term,
    extras = {}, // any extra params you want (e.g., ref, creative_id)
  } = {}) {
    if (!baseUrl) throw new Error("buildTrackedUrl: baseUrl required");
    const url = new URL(baseUrl, window.location.origin);
  
    // Preserve existing query params
    const params = url.searchParams;
  
    // Core UTMs
    if (source)   params.set("utm_source",   String(source).toLowerCase());
    if (medium)   params.set("utm_medium",   String(medium).toLowerCase());
    if (campaign) params.set("utm_campaign", String(campaign).toLowerCase());
    if (content)  params.set("utm_content",  String(content).toLowerCase());
    if (term)     params.set("utm_term",     String(term));
  
    // Any extras
    Object.entries(extras || {}).forEach(([k, v]) => {
      if (v == null) return;
      params.set(k, String(v));
    });
  
    url.search = params.toString();
    return url.toString();
  }
  