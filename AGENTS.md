# AGENTS.md instructions for /Users/DBEREZA/Documents/development/kids-typer

## Skills

A skill is a set of local instructions stored in a `SKILL.md` file.

### Available skills
- game-builder: Build or iterate a single Playwise game module with reusable input, i18n support, and safe game-level architecture/testing defaults. Use when implementing gameplay logic, controls, scoring, or game-specific UI in `games/<slug>/`. (file: /Users/DBEREZA/Documents/development/kids-typer/skills/game-builder/SKILL.md)
- portal-builder: Build or iterate the Playwise portal experience (catalog, filters, cards, locale UX, navigation), preserving calm kid-focused visual direction and modular game discovery flow. Use when changing pages in `app/` for browsing/discovery. (file: /Users/DBEREZA/Documents/development/kids-typer/skills/portal-builder/SKILL.md)

### How to use skills
- Trigger rules: If user asks about game implementation/details for a specific game, use `game-builder`.
- Trigger rules: If user asks about catalog/home/filter/layout/discovery, use `portal-builder`.
- If both are required in one request, do `portal-builder` first for route/data shape, then `game-builder` for per-game implementation.
- Keep changes modular: no game logic in portal pages, no portal-wide style rules inside game module files.
