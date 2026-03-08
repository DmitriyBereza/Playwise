export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBounce(t) {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Timing constants
export const CELL_SIZE = 1.2;
export const PIECE_PLACE_DURATION = 0.35;
export const PIECE_PLACE_START_Y = 2.0;
export const PIECE_PLACE_END_Y = 0.075;
export const TRAIN_STEP_DURATION = 0.5; // seconds per cell
export const STEAM_SPAWN_INTERVAL = 2; // every N cells
