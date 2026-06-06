import * as React from "react";

/**
 * A ticking "now" clock. Updates on an interval (default 1s) and re-syncs when
 * the tab regains focus (timers throttle in background tabs). Use a coarser
 * interval where seconds aren't needed to avoid extra renders.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs]);

  return now;
}
