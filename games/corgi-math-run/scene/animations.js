export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// World layout (units)
export const CORGI_X = 0;
export const OBSTACLE_START_X = 10;
export const OBSTACLE_STOP_X = 1.4;
export const GROUND_Y = 0;
export const PATH_Z = 0.55;

// Timing (seconds)
export const OBSTACLE_APPROACH_DURATION = 1;
export const HOP_DURATION = 0.62;
export const BUMP_DURATION = 0.5;
export const RUN_CYCLE_SPEED = 10;
export const BASE_SCROLL_SPEED = 3.4;

// Parallax factors per depth layer
export const PARALLAX = {
  clouds: 0.12,
  far: 0.24,
  mid: 0.5,
  near: 0.82,
  ground: 1.05,
};
