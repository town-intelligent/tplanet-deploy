export function computeFakeProgress(elapsedMs) {
  const s = elapsedMs / 1000;
  if (s <= 60) return Math.min(0.7, (s / 60) * 0.7);
  const base = 0.82;
  const wobble = 0.02 * Math.sin(s);
  return Math.max(0.68, Math.min(0.95, base + wobble));
}
