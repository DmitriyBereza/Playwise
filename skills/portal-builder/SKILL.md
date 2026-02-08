---
name: portal-builder
description: Build or iterate the Playwise portal experience (catalog, filters, cards, locale UX, navigation), preserving calm kid-focused visual direction and modular game discovery flow.
---

# Portal Builder Skill (Playwise)

Use this skill when request is about home/catalog pages, filters, game cards, navigation, branding, or portal-wide UX.

## Purpose

Keep the portal clean, calm, and scalable while remaining separate from per-game implementation.

## Skills to combine

- Use `frontend-design` for high-quality visual decisions with restrained, kid-safe aesthetics.
- Optionally use `game-builder` only when portal changes require touching game modules.

## Project-specific architecture rules

1. Portal ownership
- `app/page.js`: main portal home.
- `app/games/page.js`: catalog listing route.
- `app/portal.module.css`: portal styles.

2. Localization ownership
- All portal text must use `useI18n()` and `t()`.
- Add/maintain keys in `lib/i18n/messages.js` for both `uk` and `en`.
- Locale switcher component: `components/LocaleSwitcher.js`.

3. Game discovery data
- Drive cards from `games/catalog.js` (not hardcoded in page files).
- Card fields are key-based (`titleKey`, `descriptionKey`, `ageKey`) and translatable.

4. Card and filter UX conventions
- Compact square cards with:
  - preview image
  - age badge
  - top-right tags
  - concise description
  - open-game CTA
- Filter is collapsible and supports age + tags.
- Keep interactions clear and low-cognitive-load.

5. Visual direction
- Pastel tones, soft edges, controlled contrast.
- Avoid overstimulating motion or noisy compositions.

## Workflow

1. Read `app/page.js`, `app/games/page.js`, `app/portal.module.css`, and `games/catalog.js`.
2. Implement UI/data updates in portal files only unless explicitly needed.
3. If adding a new game card, ensure game route and assets exist.
4. Validate:
- `npm run build`
5. Update `progress.md` with summary and follow-up notes.

## Done checklist

- Portal text fully translatable (UA/EN).
- Card layout remains compact and readable on mobile.
- Filters work and reflect catalog metadata.
- No game-specific logic leaked into portal pages.
- Build passes.

