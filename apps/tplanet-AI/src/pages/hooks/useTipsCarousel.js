import { useEffect, useRef, useState } from "react";
export function useTipsCarousel(total, intervalMs = 8000) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % total), intervalMs);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [total, intervalMs]);
  return index;
}
