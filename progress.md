Original prompt: great, let's add the winner screen with small animation and congratulation and a button to play again, play again will clear the previous word and current score, but won't clear high score check if develop web game available

- Loaded develop-web-game skill and validated available script path.
- Found blocker: Playwright client cannot run yet because `playwright` package is missing.
- Next: implement winner overlay animation + play again behavior, then try Playwright loop.

- Implemented winner screen overlay in `app/page.js` with congratulation text and animated sparkles.
- Added `Грати ще` button behavior: clears typed text, previous word, balloons, and current score.
- Preserved high score list in localStorage (not reset on play again).
- Added winner animation styles in `app/globals.css` (`winnerPop`, `sparkle`).
- Validation: `npm run build` passed.
- Playwright loop status: blocked. `web_game_playwright_client.js` fails with `ERR_MODULE_NOT_FOUND: playwright` from skill script path.

TODOs / suggestions:
- If you want strict skill-loop verification, install `playwright` where the skill client can resolve it (under skill runtime/module path), then rerun the client with a live dev server URL.

- Added uppercase handling end-to-end: input normalization, balloon letters, quick words.
- Added child keyboard under textarea (Ukrainian letters + space/backspace/clear controls).
- Keyboard is disabled while a game round is active and re-enabled after starting a new game.
- Textarea is also disabled during active round to avoid accidental edits.
- Balloon letters are now non-selectable and centered (`user-select: none`, flex centering, zero padding/line-height normalization).
- High score board now stores and shows both score and word used.
- Build validation passed: `npm run build`.
- develop-web-game Playwright client check re-run; still blocked by `ERR_MODULE_NOT_FOUND: playwright` in skill script runtime.

TODOs / suggestions:
- If strict Playwright skill-loop is required, make `playwright` resolvable for `/Users/DBEREZA/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js` and rerun UI scenario captures.

- Added strict-order toggle switch (`Суворий порядок літер`) in UI.
- Switch is disabled during active round, enabled before round start.
- Game logic now supports both modes:
  - strict ON: only next letter balloon is poppable
  - strict OFF: any balloon is poppable
- Updated hint text to reflect current mode.
- Added random balloon flight direction/path via per-balloon drift and tilt variables (`--drift-x`, `--tilt-start`, `--tilt-end`).
- Updated `floatUp` keyframes to curve balloons in different directions.
- Validation passed: `npm run build`.

- Layout update:
  - moved score + highscore blocks under the game playfield
  - moved strict-order switch into top-right of game panel (`gameTop` + `orderSwitchInline`)
  - placed `Надіслати` next to input area (`inputRow` with send button)
- Kept mobile UX: input row and game header collapse vertically on narrow screens.
- Validation passed: `npm run build` (no warnings).

Follow-up prompt: encapsulate games in separate folders, create Playwise kids-game portal with calm pastel design and modular structure, and generate initial Playwise logo.

- Refactored app into portal + per-game modules.
- New portal routes:
  - `/` -> Playwise homepage
  - `/games` -> game catalog page
  - `/games/typing-balloons` -> typing balloons game route
- Moved game implementation to module folder:
  - `games/typing-balloons/TypingBalloonsGame.js`
  - `games/typing-balloons/typingBalloons.module.css`
- Added game catalog metadata file: `games/catalog.js`.
- Added module structure docs: `games/README.md`.
- Added initial Playwise logo asset: `public/playwise-logo.svg`.
- Added portal styles: `app/portal.module.css`.
- Simplified `app/globals.css` to base theme/layout styles.
- Updated app metadata in `app/layout.js` to Playwise.
- Validation passed: `npm run build`.
- develop-web-game Playwright client still blocked by missing package resolution in skill runtime:
  - `ERR_MODULE_NOT_FOUND: playwright` from `/Users/DBEREZA/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`.

TODOs / suggestions:
- When adding next games, create `games/<slug>/` module first, then route at `app/games/<slug>/page.js` and register in `games/catalog.js`.

- Updated strict-order toggle behavior: it can now be changed during an active game round.
- Removed `disabled={isRoundActive}` from strict-order checkbox in `games/typing-balloons/TypingBalloonsGame.js`.
- Validation passed: `npm run build`.

Follow-up prompt: make games square cards on main page, move tags to top-right, replace See all with unfoldable filter (tags + age), add per-game text description file, and add game screenshot previews.

- Updated portal cards to square layout with preview image area.
- Moved skill tags to top-right inside card description area.
- Replaced `See all` button on main page with unfoldable filter panel.
- Added filtering by both age group and tags on main page.
- Added empty-state text when no game matches selected filters.
- Added preview image asset for typing game:
  - `public/games/typing-balloons-preview.svg`
- Added per-game AI context file:
  - `games/typing-balloons/GAME_INFO.txt`
- Extended catalog metadata with `ageGroup` and `image` fields.
- Synced `/games` page cards to new square + preview layout.
- Validation passed: `npm run build`.

Follow-up prompt: make compact square game cards with corrected preview image positioning; add scalable translations (UA default + EN secondary); make balloon game input translatable and reusable.

- Added scalable i18n infrastructure:
  - `lib/i18n/messages.js` (dictionaries)
  - `lib/i18n/I18nProvider.js` (`t`, locale state, persistence)
  - `app/providers.js` wired in `app/layout.js`
- Added reusable localization UI pieces:
  - `components/LocaleSwitcher.js`
  - `components/KidWordInput.js` with locale-specific keyboard layouts
- Refactored balloon game to use i18n + reusable `KidWordInput` module.
- Portal and games pages now use translation keys from `games/catalog.js` + i18n labels.
- Compact square card update:
  - fixed small card size (`220x220`, responsive `170x170`)
  - corrected preview image fit/position with `object-fit: contain` and internal padding
  - kept tags in top-right of description area
- Updated README with i18n + reusable module documentation.
- Validation passed: `npm run build`.

Follow-up prompt: create a new game (corgi in forest, math obstacles, 3 answer options, 3 wrong attempts then game over, high score).

Skills used:
- `game-builder` (primary)
- `frontend-design` (UI/layout direction for calm kid-focused gameplay)

Implemented:
- New game module: `games/corgi-math-run/CorgiMathRunGame.js`
- New game styles: `games/corgi-math-run/corgiMathRun.module.css`
- New game route: `app/games/corgi-math-run/page.js`
- Catalog registration with image/tags: `games/catalog.js`
- New game preview asset: `public/games/corgi-math-run-preview.svg`
- New game AI context file: `games/corgi-math-run/GAME_INFO.txt`
- i18n updates in `lib/i18n/messages.js` for both UA and EN:
  - game title/description
  - skill labels
  - full in-game text/statuses

Gameplay behavior:
- Random simple addition/subtraction equations.
- 3 multiple-choice answers per obstacle.
- Score increases per correct answer.
- 3 wrong attempts total -> game over.
- High score persisted in localStorage (`corgiMathRunHighScoreV1`).

Validation:
- `npm run build` passed.

Follow-up prompt: improve Corgi Math Run UI/feedback and gameplay flow (actual corgi, visible correct/wrong effects, wrong option lockout, start button + difficulty levels, non-repeating equations, progressive option count, centered equation/answers).

Skills used:
- `game-builder` (primary)
- `frontend-design` (surroundings + stronger visual feedback)

Implemented changes in Corgi Math Run:
- Added start menu with difficulty selection + explicit Start button.
  - easy = 10 equations
  - middle = 15 equations
  - complex = 20 equations
- Added no-repeat equation generation per run using used-equation key set.
- Added progressive suggestion count near finish:
  - early 3 options, mid 4, near finish 5.
- Enforced unique options for each equation (no duplicated answers).
- Added wrong-answer lockout per question:
  - chosen wrong option becomes disabled.
- Added visible feedback:
  - correct: green highlight + corgi jump
  - wrong: red highlight + shake effect
- Added richer scene styling (clouds/trees/track) and real corgi asset.
- Centered equation and answer options in quiz panel.
- Added finish state (win) and menu return action.
- Updated translations (UA/EN) for new game states/labels in `lib/i18n/messages.js`.
- Updated game context doc: `games/corgi-math-run/GAME_INFO.txt`.

Validation:
- `npm run build` passed.

Follow-up prompt: create new plane game using develop-web-game skill (left-to-right flight, avoid obstacles with on-screen arrows, random map, 3 checkpoints before finish, score system).

Skills used:
- `develop-web-game` (primary, workflow followed)
- Project-local `game-builder` conventions for module structure
- NOTE: direct Figma integration is not available in this runtime; implemented game and assets in code.

Implemented:
- New game route: `app/games/plane-forest-run/page.js`
- New game module: `games/plane-forest-run/PlaneForestRunGame.js`
- New game styles: `games/plane-forest-run/planeForestRun.module.css`
- New game preview image: `public/games/plane-forest-run-preview.svg`
- New game context doc: `games/plane-forest-run/GAME_INFO.txt`
- Added plane sprite asset: `public/games/corgi-runner.svg` (used as in-game plane icon file replacement context from previous prompt)
- Registered new game in `games/catalog.js`
- Added i18n keys UA/EN in `lib/i18n/messages.js`:
  - game title/description
  - skill label `skills.flight`
  - full in-game text/statuses

Gameplay behavior:
- Plane auto-advances left-to-right over a random obstacle map.
- On-screen arrow controls (up/down/left/right) and keyboard arrows.
- 3 checkpoints at 25/50/75% of map distance.
- Collision triggers game over.
- Finish at map end.
- Score from distance + passed obstacles + checkpoints.
- High score persisted in localStorage (`planeForestRunHighScoreV1`).
- Testing hooks for develop-web-game:
  - `window.render_game_to_text()`
  - `window.advanceTime(ms)`

Validation:
- `npm run build` passed.
- develop-web-game Playwright client run attempted and blocked by environment issue:
  - `ERR_MODULE_NOT_FOUND: playwright` from `/Users/DBEREZA/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`.

Correction note:
- Plane game uses canvas-drawn plane graphics; no standalone plane sprite asset file was introduced for gameplay.

Follow-up prompt (plane game adjustments):
- remove backward/forward controls, keep only up/down
- support up/down arrow keys
- if crashed after checkpoint, respawn from latest checkpoint

Implemented:
- Plane movement is now vertical-only (up/down), fixed x position.
- Removed left/right control buttons from UI.
- Keyboard handling remains and now uses only ArrowUp/ArrowDown.
- Added checkpoint respawn mechanic:
  - stores latest checkpoint distance
  - on collision after at least one checkpoint, returns player to checkpoint instead of game over
  - adds short respawn grace timer to avoid immediate re-collision
- Added respawn status text in UA/EN translations.
- Added `respawn_timer` to `render_game_to_text()` payload for test visibility.

Validation:
- `npm run build` passed.

Follow-up prompt: browser moves together with plane; stop propagation/scroll while controlling.

Implemented:
- Prevented default browser scrolling for `ArrowUp`/`ArrowDown` in `keydown` and `keyup` handlers.
- Registered keyboard listeners with `{ passive: false }`.
- Prevented default on on-screen control pointer/touch events for up/down buttons.
- Added `touch-action: none` to game canvas and control buttons to stop gesture scroll during interaction.

Validation:
- `npm run build` passed.

Follow-up prompt: check Figma-generated assets for corgi game and utilize needed ones.

Skills used:
- `game-builder` (game module integration)
- `figma-implement-design` (Figma MCP source inspection)

Implemented:
- Connected to Figma MCP and inspected Make file `FFTrIE9GtT1Q4220x25Q4d`.
- Since Make file contains mixed Unsplash placeholders + vector snippets, reused the reliable vector assets from source and moved them into project-local SVGs.
- Added new local assets:
  - `public/games/corgi-math-run/corgi-character.svg`
  - `public/games/corgi-math-run/mushroom-obstacle.svg`
  - `public/games/corgi-math-run/forest-backdrop.svg`
- Updated game scene to use those assets:
  - Corgi sprite source switched to the new Figma-derived character SVG.
  - Obstacle switched from emoji to Figma-derived mushroom SVG.
  - Track background switched from primitive gradients/shapes to Figma-derived forest backdrop SVG.
- Updated game documentation:
  - `games/corgi-math-run/GAME_INFO.txt` now includes the Figma asset integration note.

Validation:
- `npm run build` passed.

Follow-up prompt: missing visible scene assets in corgi game (cartoon tree, pine, bush, flowers) and obstacle visibility concerns.

Implemented:
- Added explicit scene decoration layer in `CorgiMathRunGame` with separate asset sprites for:
  - cartoon tree
  - pine tree variation
  - simple bush
  - decorative flowers
- Enhanced obstacle visibility:
  - kept mushroom obstacle
  - added wooden log base under mushroom
  - raised obstacle z-index and refined position.
- Added new local assets:
  - `public/games/corgi-math-run/cartoon-tree.svg`
  - `public/games/corgi-math-run/pine-tree.svg`
  - `public/games/corgi-math-run/simple-bush.svg`
  - `public/games/corgi-math-run/decorative-flowers.svg`
  - `public/games/corgi-math-run/wooden-log.svg`

Validation:
- `npm run build` passed.

Follow-up prompt: fully replace old graphics with Figma-based ones, add visible finish spot, place corgi on ground, and add multi-layer parallax.

Implemented:
- Rebuilt `corgi-math-run` scene with full Figma-style asset composition (removed reliance on legacy primitive cloud/tree/road styling).
- Added 3-layer parallax scene:
  - far background (scrolling forest backdrop)
  - mid layer (cartoon + pine trees)
  - front layer (bushes + flowers)
  - plus dedicated ground path layer.
- Added visible finish zone:
  - race finish line asset
  - finish spot (pile of bones) asset
- Improved obstacle visibility:
  - obstacle now appears before finish zone with stronger layering.
- Grounded the corgi visually:
  - lowered character position
  - added dedicated shadow sprite.
- New assets:
  - `public/games/corgi-math-run/race-finish-line.svg`
  - `public/games/corgi-math-run/pile-of-bones.svg`
  - `public/games/corgi-math-run/ground-path.svg`
  - `public/games/corgi-math-run/corgi-shadow.svg`

Validation:
- `npm run build` passed.
