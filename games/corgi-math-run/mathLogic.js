export const DIFFICULTIES = {
  easy: { count: 10, maxNumber: 6 },
  middle: { count: 15, maxNumber: 9 },
  complex: { count: 20, maxNumber: 12 },
};

const MAX_GENERATION_ATTEMPTS = 240;
const SUBTRACTION_PROBABILITY = 0.32;
const OPTIONS_COUNT_LOW = 3;
const OPTIONS_COUNT_MID = 4;
const OPTIONS_COUNT_HIGH = 5;
const MID_PROGRESS_THRESHOLD = 0.45;
const HIGH_PROGRESS_THRESHOLD = 0.8;
const MIN_OPTION_SPREAD = 2;
const OPTION_SPREAD_MULTIPLIER = 1.8;

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function optionCountFor(progressRatio) {
  if (progressRatio >= HIGH_PROGRESS_THRESHOLD) return OPTIONS_COUNT_HIGH;
  if (progressRatio >= MID_PROGRESS_THRESHOLD) return OPTIONS_COUNT_MID;
  return OPTIONS_COUNT_LOW;
}

function makeCandidate(usedKeys, difficulty, { widen = 0, forceAddition = false } = {}) {
  const { maxNumber } = DIFFICULTIES[difficulty];
  const ceiling = maxNumber + widen;

  for (let i = 0; i < MAX_GENERATION_ATTEMPTS; i += 1) {
    const operation = forceAddition || Math.random() > SUBTRACTION_PROBABILITY ? '+' : '-';
    let a = randomInt(1, ceiling);
    let b = randomInt(0, ceiling);

    if (operation === '-' && b > a) {
      [a, b] = [b, a];
    }

    const key = `${a}${operation}${b}`;
    if (usedKeys.has(key)) {
      continue;
    }

    const answer = operation === '+' ? a + b : a - b;
    return { key, text: `${a} ${operation} ${b}`, answer };
  }

  return null;
}

function buildDistractors(answer, optionCount) {
  const spread = Math.max(MIN_OPTION_SPREAD, Math.ceil(optionCount * OPTION_SPREAD_MULTIPLIER));
  const options = new Set([answer]);
  let guard = 0;

  while (options.size < optionCount && guard < 200) {
    guard += 1;
    const delta = randomInt(1, spread) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + delta;
    if (candidate < 0 || candidate === answer) {
      continue;
    }
    options.add(candidate);
  }

  return shuffle(Array.from(options));
}

export function buildEquation(usedKeys, difficulty, progressRatio) {
  const candidate =
    makeCandidate(usedKeys, difficulty) ||
    makeCandidate(usedKeys, difficulty, { widen: 2 }) ||
    makeCandidate(usedKeys, difficulty, { widen: 5, forceAddition: true }) ||
    makeCandidate(usedKeys, difficulty, { widen: 12, forceAddition: true });

  const safe = candidate || {
    key: `${Date.now()}`,
    text: '1 + 1',
    answer: 2,
  };

  const options = buildDistractors(safe.answer, optionCountFor(progressRatio));
  return { ...safe, options };
}
