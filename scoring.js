// Trend Scoring Formula (MVP)
// Normalize to 0..1 and combine with weights, then apply velocity boost.
export function normalize(value, min, max, invert=false) {
  if (max === min) return 0;
  const n = (value - min) / (max - min);
  return invert ? 1 - Math.min(Math.max(n, 0), 1) : Math.min(Math.max(n, 0), 1);
}

export function computeTrendScore(signals, weights) {
  // signals: { g, t, tt, a, s } already normalized (0..1)
  const { g=0, t=0, tt=0, a=0, s=0 } = signals || {};
  const { wg=0.25, wt=0.20, wtt=0.25, wa=0.25, ws=0.05 } = weights || {};
  return (wg*g) + (wt*t) + (wtt*tt) + (wa*a) + (ws*s);
}

export function featuredScore(currentScore, prevScore, alpha=0.5) {
  const velocity = currentScore - prevScore; // assume Δt = 1 hour for MVP
  return currentScore * (1 + alpha * velocity);
}
