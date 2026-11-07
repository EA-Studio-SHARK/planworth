import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** A new page starts at the top instead of keeping the last page's scroll position. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
