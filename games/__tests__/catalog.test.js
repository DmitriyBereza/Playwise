import { gamesCatalog } from '../catalog';
import { messages } from '../../lib/i18n/messages';

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

describe('gamesCatalog', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(gamesCatalog)).toBe(true);
    expect(gamesCatalog.length).toBeGreaterThan(0);
  });

  test.each(gamesCatalog.map((g) => [g.slug, g]))(
    '%s has all required fields',
    (_slug, game) => {
      expect(typeof game.slug).toBe('string');
      expect(game.slug.length).toBeGreaterThan(0);

      expect(typeof game.titleKey).toBe('string');
      expect(typeof game.descriptionKey).toBe('string');
      expect(typeof game.ageKey).toBe('string');
      expect(typeof game.ageGroup).toBe('string');
      expect(typeof game.image).toBe('string');
      expect(typeof game.path).toBe('string');

      expect(Array.isArray(game.skills)).toBe(true);
      expect(game.skills.length).toBeGreaterThan(0);
    },
  );

  test.each(gamesCatalog.map((g) => [g.slug, g]))(
    '%s path starts with /games/',
    (_slug, game) => {
      expect(game.path).toMatch(/^\/games\//);
    },
  );

  test.each(gamesCatalog.map((g) => [g.slug, g]))(
    '%s image path starts with /games/',
    (_slug, game) => {
      expect(game.image).toMatch(/^\/games\//);
    },
  );

  test('every slug is unique', () => {
    const slugs = gamesCatalog.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('every path is unique', () => {
    const paths = gamesCatalog.map((g) => g.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  describe('i18n key resolution', () => {
    const locales = Object.keys(messages);

    test.each(gamesCatalog.map((g) => [g.slug, g]))(
      '%s titleKey resolves in every locale',
      (_slug, game) => {
        for (const locale of locales) {
          const value = resolvePath(messages[locale], game.titleKey);
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      },
    );

    test.each(gamesCatalog.map((g) => [g.slug, g]))(
      '%s descriptionKey resolves in every locale',
      (_slug, game) => {
        for (const locale of locales) {
          const value = resolvePath(messages[locale], game.descriptionKey);
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      },
    );

    test.each(gamesCatalog.map((g) => [g.slug, g]))(
      '%s ageKey resolves in every locale',
      (_slug, game) => {
        for (const locale of locales) {
          const value = resolvePath(messages[locale], game.ageKey);
          expect(value).toBeDefined();
        }
      },
    );

    test.each(gamesCatalog.map((g) => [g.slug, g]))(
      '%s skill keys resolve in every locale',
      (_slug, game) => {
        for (const skillKey of game.skills) {
          for (const locale of locales) {
            const value = resolvePath(messages[locale], skillKey);
            expect(typeof value).toBe('string');
            expect(value.length).toBeGreaterThan(0);
          }
        }
      },
    );
  });
});
