---
name: game-builder
description: Build or iterate a single Playwise game module with reusable input, i18n support, and safe game-level architecture/testing defaults.
---

# Game Builder Skill (Playwise)

Use this skill when a request targets a specific game behavior, game UI, score logic, controls, or game route.

## Purpose

Implement game features without breaking portal modularity:
- Keep game logic in `games/<slug>/`.
- Keep route shell in `app/games/<slug>/page.js`.
- Keep discovery metadata in `games/catalog.js`.

## Skills to combine

- Use `frontend-design` for visual quality and kid-friendly UX (pastel, calm, no overstimulation).
- Use `develop-web-game` when gameplay interaction changes are non-trivial and need a repeatable test loop.
  - Note: this project previously hit a Playwright runtime issue in skill script path (`ERR_MODULE_NOT_FOUND: playwright`). If still present, run build checks and document blocker in `progress.md`.

## Project-specific architecture rules

1. Game module boundaries
- `games/<slug>/<GameComponent>.js`: game state, rules, interactions.
- `games/<slug>/*.module.css`: game-specific styles only.
- `games/<slug>/GAME_INFO.txt`: concise description for future agents.

2. Reusable input
- Reuse `components/KidWordInput.js` for child text input + keyboard.
- Do not duplicate keyboard/input logic inside each game unless absolutely required.

3. Localization
- Use `useI18n()` and `t('...')` for all visible text.
- Add keys to `lib/i18n/messages.js` for both `uk` and `en`.
- Default locale is `uk`; `en` is secondary.

4. Data registration
- Register game card metadata in `games/catalog.js`:
  - `titleKey`, `descriptionKey`, `ageKey`, `ageGroup`, `skills`, `image`, `path`.

5. UI safety for kids
- Large controls, clear state labels, forgiving interactions.
- Prefer smooth pace controls over high-speed defaults.
- Avoid flashy/high-contrast animation overload.

## Workflow

1. Read game files and `games/<slug>/GAME_INFO.txt`.
2. Identify i18n keys needed and add them to `messages.js`.
3. Implement smallest viable game change in `games/<slug>/`.
4. Keep route shell simple in `app/games/<slug>/page.js`.
5. Validate:
- `npm run build`
- If available, run `develop-web-game` loop.
6. Update `progress.md` with:
- what changed
- tests run
- known blockers/TODOs

## Done checklist

- No hardcoded UI strings in game module.
- Uses shared input component where applicable.
- Build passes.
- `GAME_INFO.txt` exists and is up-to-date.
- Catalog entry still valid and route works.

