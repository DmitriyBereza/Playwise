import { DIFFICULTIES, buildEquation, shuffle } from '../mathLogic';

describe('corgi-math-run mathLogic', () => {
  test('shuffle keeps all elements without mutating input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(5);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  test('buildEquation options include the answer without duplicates', () => {
    for (let i = 0; i < 50; i += 1) {
      const equation = buildEquation(new Set(), 'easy', 0);
      expect(equation.options).toContain(equation.answer);
      expect(new Set(equation.options).size).toBe(equation.options.length);
    }
  });

  test('subtraction never produces a negative answer', () => {
    for (let i = 0; i < 200; i += 1) {
      const equation = buildEquation(new Set(), 'middle', Math.random());
      expect(equation.answer).toBeGreaterThanOrEqual(0);
    }
  });

  test('answer matches the rendered equation text', () => {
    for (let i = 0; i < 100; i += 1) {
      const equation = buildEquation(new Set(), 'complex', Math.random());
      const [a, op, b] = equation.text.split(' ');
      const expected = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
      expect(equation.answer).toBe(expected);
    }
  });

  test('option count grows with progress', () => {
    const early = buildEquation(new Set(), 'complex', 0);
    const late = buildEquation(new Set(), 'complex', 0.95);
    expect(early.options.length).toBe(3);
    expect(late.options.length).toBe(5);
  });

  test('avoid duplicate keys using usedKeys', () => {
    const used = new Set();
    const first = buildEquation(used, 'easy', 0);
    used.add(first.key);
    const second = buildEquation(used, 'easy', 0);
    expect(second.key).not.toBe(first.key);
  });

  test('difficulties define increasing targets', () => {
    expect(DIFFICULTIES.easy.count).toBeLessThan(DIFFICULTIES.middle.count);
    expect(DIFFICULTIES.middle.count).toBeLessThan(DIFFICULTIES.complex.count);
  });
});
