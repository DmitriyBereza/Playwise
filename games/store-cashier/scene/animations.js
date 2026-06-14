export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

export const WALK_DURATION = 1.4;
export const CUSTOMER_START_Z = -4;
export const CUSTOMER_END_Z = 0;
