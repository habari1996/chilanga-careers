import { useState, useEffect } from "react";

/** Returns true when viewport width is below the given breakpoint (default 768px). */
export default function useIsMobile(breakpoint = 768) {
  const getMatch = () =>
    typeof window !== "undefined" && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;

  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [breakpoint]);

  return isMobile;
}
