export const PRODUCT_CATALOG = [
  { id: 'apple', price: 5, color: '#FF8FAB' },
  { id: 'bread', price: 8, color: '#F4D58D' },
  { id: 'milk', price: 6, color: '#B8D4FF' },
  { id: 'juice', price: 7, color: '#FFB347' },
  { id: 'cookie', price: 4, color: '#C9A66B' },
  { id: 'toy', price: 12, color: '#A78BFA' },
  { id: 'pencil', price: 3, color: '#7DD3FC' },
  { id: 'banana', price: 5, color: '#FDE047' },
];

const MIN_ITEMS = 3;
const MAX_ITEMS = 4;
const MAX_TOTAL = 50;
const ORDER_GENERATION_MAX_ATTEMPTS = 200;
const OPTIONS_COUNT = 5;
const OPTION_SPREAD_MULTIPLIER = 1.8;
const MIN_OPTION_SPREAD = 2;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOptions(correctAnswer) {
  const optionsSet = new Set([correctAnswer]);
  const spread = Math.max(MIN_OPTION_SPREAD, Math.ceil(OPTIONS_COUNT * OPTION_SPREAD_MULTIPLIER));

  while (optionsSet.size < OPTIONS_COUNT) {
    const delta = randomInt(-spread, spread);
    if (delta === 0) {
      continue;
    }
    const candidate = Math.max(0, correctAnswer + delta);
    optionsSet.add(candidate);
  }

  return Array.from(optionsSet).sort(() => Math.random() - 0.5);
}

export function buildPaymentAmount(total) {
  const minPay = total + 2;
  const roundCandidates = [5, 10].map((round) => Math.ceil(minPay / round) * round);
  const valid = [...new Set(roundCandidates)].filter((amount) => amount > total).sort((a, b) => a - b);
  return valid[0] ?? minPay;
}

export function buildTotalOptions(correctTotal) {
  return buildOptions(correctTotal);
}

export function buildChangeOptions(correctChange) {
  return buildOptions(correctChange);
}

export function buildOrder(usedKeys = new Set()) {
  for (let attempt = 0; attempt < ORDER_GENERATION_MAX_ATTEMPTS; attempt += 1) {
    const itemCount = randomInt(MIN_ITEMS, MAX_ITEMS);
    const picked = shuffle(PRODUCT_CATALOG).slice(0, itemCount);
    const total = picked.reduce((sum, item) => sum + item.price, 0);

    if (total > MAX_TOTAL) {
      continue;
    }

    const key = picked.map((item) => item.id).sort().join(',');
    if (usedKeys.has(key)) {
      continue;
    }

    const payment = buildPaymentAmount(total);
    const change = payment - total;

    return {
      key,
      items: picked,
      total,
      payment,
      change,
      totalOptions: buildTotalOptions(total),
      changeOptions: buildChangeOptions(change),
    };
  }

  const fallbackItems = PRODUCT_CATALOG.slice(0, MIN_ITEMS);
  const total = fallbackItems.reduce((sum, item) => sum + item.price, 0);
  const payment = buildPaymentAmount(total);
  const change = payment - total;

  return {
    key: fallbackItems.map((item) => item.id).join(','),
    items: fallbackItems,
    total,
    payment,
    change,
    totalOptions: buildTotalOptions(total),
    changeOptions: buildChangeOptions(change),
  };
}
