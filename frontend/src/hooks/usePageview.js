import { useEffect } from "react";
import posthog from "posthog-js";
import { useLocation } from "react-router-dom";

export function usePageview() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview");
  }, [location.pathname, location.search]);
}
