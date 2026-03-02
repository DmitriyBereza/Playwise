import { messages } from '../messages';

/**
 * Mirrors the resolvePath helper used in I18nProvider.
 */
function resolvePath(obj, path) {
  return path
    .split('.')
    .reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      obj,
    );
}

/**
 * Mirrors the interpolate helper used in I18nProvider.
 */
function interpolate(template, params) {
  if (typeof template !== 'string' || !params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

/**
 * Collect every leaf-path from an object (e.g. "portal.title").
 * Arrays are treated as leaf values (e.g. quickWords).
 */
function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      keys.push(...collectKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys.sort();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const locales = Object.keys(messages);

describe('messages – locale parity', () => {
  const ukKeys = collectKeys(messages.uk);
  const enKeys = collectKeys(messages.en);

  test('both locales exist', () => {
    expect(locales).toContain('uk');
    expect(locales).toContain('en');
  });

  test('uk and en have the same set of keys', () => {
    expect(ukKeys).toEqual(enKeys);
  });

  test('no locale has an empty string value at any leaf', () => {
    for (const locale of locales) {
      const keys = collectKeys(messages[locale]);
      for (const key of keys) {
        const value = resolvePath(messages[locale], key);
        if (typeof value === 'string') {
          expect(value.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('t() interpolation helper', () => {
  test('replaces a single placeholder', () => {
    expect(interpolate('Hello {name}!', { name: 'World' })).toBe(
      'Hello World!',
    );
  });

  test('replaces multiple different placeholders', () => {
    const result = interpolate('{a} and {b}', { a: '1', b: '2' });
    expect(result).toBe('1 and 2');
  });

  test('leaves unknown placeholders untouched', () => {
    expect(interpolate('Hi {missing}', {})).toBe('Hi {missing}');
  });

  test('returns non-string values as-is', () => {
    expect(interpolate(42, { x: 1 })).toBe(42);
    expect(interpolate(null, { x: 1 })).toBe(null);
  });

  test('returns template unchanged when params is undefined', () => {
    expect(interpolate('No params {here}')).toBe('No params {here}');
  });

  test('coerces numeric param values to strings', () => {
    expect(interpolate('Score: {score}', { score: 100 })).toBe(
      'Score: 100',
    );
  });

  test('works with real message strings from uk locale', () => {
    const template = messages.uk.typingGame.speedLabel;
    expect(interpolate(template, { value: 3 })).toContain('3');
  });

  test('works with real message strings from en locale', () => {
    const template = messages.en.corgiMathGame.overText;
    expect(interpolate(template, { score: 42 })).toContain('42');
  });
});

describe('resolvePath helper', () => {
  test('resolves a top-level key', () => {
    expect(resolvePath(messages.en, 'locale')).toEqual({ name: 'English' });
  });

  test('resolves a nested key', () => {
    expect(resolvePath(messages.en, 'common.openGame')).toBe('Open game');
  });

  test('resolves a deeply nested key', () => {
    expect(resolvePath(messages.en, 'typingGame.status.start')).toBe(
      'Type a word or short sentence.',
    );
  });

  test('returns undefined for missing paths', () => {
    expect(resolvePath(messages.en, 'does.not.exist')).toBeUndefined();
  });

  test('returns undefined for partially valid paths', () => {
    expect(resolvePath(messages.en, 'common.openGame.deep')).toBeUndefined();
  });
});
