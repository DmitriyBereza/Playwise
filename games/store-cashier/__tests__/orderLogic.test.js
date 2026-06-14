import {
  buildChangeOptions,
  buildOrder,
  buildPaymentAmount,
  buildTotalOptions,
  PRODUCT_CATALOG,
} from '../orderLogic';

describe('store-cashier orderLogic', () => {
  test('product catalog has unique ids', () => {
    const ids = PRODUCT_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('buildOrder returns 3-4 items with total <= 50', () => {
    for (let i = 0; i < 30; i += 1) {
      const order = buildOrder();
      expect(order.items.length).toBeGreaterThanOrEqual(3);
      expect(order.items.length).toBeLessThanOrEqual(4);
      expect(order.total).toBeLessThanOrEqual(50);
      expect(order.total).toBeGreaterThan(0);
    }
  });

  test('buildPaymentAmount is greater than total', () => {
    for (let total = 5; total <= 50; total += 3) {
      const payment = buildPaymentAmount(total);
      expect(payment).toBeGreaterThan(total);
      expect(payment % 5 === 0 || payment % 10 === 0).toBe(true);
    }
  });

  test('change is non-negative and matches payment minus total', () => {
    for (let i = 0; i < 20; i += 1) {
      const order = buildOrder();
      expect(order.change).toBeGreaterThanOrEqual(0);
      expect(order.change).toBe(order.payment - order.total);
    }
  });

  test('total options include correct answer without duplicates', () => {
    const options = buildTotalOptions(24);
    expect(options).toHaveLength(5);
    expect(options).toContain(24);
    expect(new Set(options).size).toBe(options.length);
  });

  test('change options include correct answer without duplicates', () => {
    const options = buildChangeOptions(7);
    expect(options).toHaveLength(5);
    expect(options).toContain(7);
    expect(new Set(options).size).toBe(options.length);
  });

  test('buildOrder avoids duplicate keys when usedKeys provided', () => {
    const used = new Set();
    const first = buildOrder(used);
    used.add(first.key);
    const second = buildOrder(used);
    expect(second.key).not.toBe(first.key);
  });
});
