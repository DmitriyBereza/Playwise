# Playwise Improvement Plan

Road map for making the project accessible on the internet for different users.

## Status Legend

- [ ] Not started
- [x] Completed

---

## Phase 1: Go Live (Critical)

### 1.1 Deploy to Vercel
- [ ] Connect GitHub repo to Vercel
- [ ] Verify build succeeds (`next build`)
- [ ] Configure custom domain (optional)
- [ ] Verify all 3 games work in production

### 1.2 SEO & Discoverability
- [ ] Add `metadata` exports to `app/layout.js` (title, description, keywords)
- [ ] Add Open Graph and Twitter Card meta tags for social sharing
- [ ] Add favicon (use playwise-logo.svg or generate .ico)
- [ ] Create `robots.txt` in `public/`
- [ ] Create `sitemap.xml` (or use `next-sitemap`)
- [ ] Add `alt` text to all SVG images and game previews

### 1.3 Error Handling & Polish
- [ ] Add a custom 404 page (`app/not-found.js`)
- [ ] Add React error boundaries around each game
- [ ] Add loading indicators between route transitions (`app/loading.js`)

---

## Phase 2: Mobile & Accessibility

### 2.1 Mobile Responsiveness
- [ ] Test all 3 games on phone (375px) and tablet (768px) viewports
- [ ] Fix Typing Balloons keyboard layout on small screens
- [ ] Verify Plane Forest Run touch controls on mobile
- [ ] Verify Corgi Math Run answer buttons on small screens
- [ ] Check portal card grid on narrow viewports
- [ ] Verify viewport meta tag is correct in layout

### 2.2 Accessibility (a11y)
- [ ] Add ARIA labels to game controls (play, pause, score, progress)
- [ ] Audit color contrast (WCAG AA minimum) — especially pastels on white
- [ ] Add screen reader announcements for game state changes (win, lose, score)
- [ ] Ensure full keyboard navigation for all interactive elements
- [ ] Add `role` attributes to custom UI components (keyboard, buttons)
- [ ] Test with VoiceOver (macOS) or similar screen reader

---

## Phase 3: Offline & App Experience

### 3.1 Progressive Web App (PWA)
- [ ] Create `public/manifest.json` (app name, icons, theme color, display: standalone)
- [ ] Generate PWA icons in multiple sizes from playwise-logo.svg
- [ ] Add service worker for offline caching (consider `next-pwa` or `serwist`)
- [ ] Test "Add to Home Screen" on iOS Safari and Android Chrome
- [ ] Verify games work offline after initial load

---

## Phase 4: Quality & Stability

### 4.1 Testing
- [ ] Install Jest + React Testing Library
- [ ] Unit tests for math equation generation (Corgi Math Run)
- [ ] Unit tests for scoring logic (all games)
- [ ] Unit tests for i18n (translation fallback, parameter interpolation)
- [ ] Component tests for KidWordInput keyboard rendering
- [ ] E2E smoke tests for each game page loading (Playwright or Cypress)

### 4.2 Performance
- [ ] Run Lighthouse audit and address major findings
- [ ] Verify code splitting per game route (no unnecessary bundle bloat)
- [ ] Add loading skeletons for game pages
- [ ] Optimize SVG assets (run through SVGO)

---

## Phase 5: Multi-User & Growth

### 5.1 Shared Leaderboards (Optional)
- [ ] Choose lightweight backend (Supabase free tier / Firebase / Convex)
- [ ] Create leaderboard table (game, score, nickname, timestamp)
- [ ] Add nickname input before game start (no account required)
- [ ] Display global top scores alongside local high scores
- [ ] Rate-limit score submissions to prevent abuse

### 5.2 TypeScript Migration (Optional)
- [ ] Rename `.js` files to `.tsx`/`.ts` incrementally
- [ ] Add `tsconfig.json` with strict mode
- [ ] Type game state, props, and i18n keys
- [ ] Type the game catalog and metadata

### 5.3 Security & Compliance
- [ ] Add Content Security Policy headers (in `next.config.js`)
- [ ] Document COPPA/GDPR-K stance (no data collected, no tracking)
- [ ] Add privacy policy page (even minimal, good practice for kids' apps)
- [ ] Ensure no third-party scripts or analytics are loaded without consent

---

## Phase 6: Existing Game Fixes

Known bugs and polish items found during code review.

### 6.1 Typing Balloons (7.5/10)
- [ ] Fix high score locale bug — always saves in Ukrainian (`roundWord.toLocaleUpperCase('uk-UA')` on line 117 should use `localeTag`)
- [ ] Translate hardcoded Ukrainian aria-labels (balloon label line 281, progress bar "Прогрес")
- [ ] Add balloon pop animation (shrink/explode instead of instant removal)
- [ ] Add keyboard navigation for popping balloons (accessibility)
- [ ] Add sound effects (pop, win)
- [ ] Add pause functionality
- [ ] Persist speed slider preference across sessions

### 6.2 Corgi Math Run (8/10)
- [ ] Add pause button
- [ ] Add keyboard navigation for answer buttons (Tab + Enter)
- [ ] Add hint system for stuck players
- [ ] Add `aria-live` region for status/feedback announcements
- [ ] Add `prefers-reduced-motion` support for parallax/animations
- [ ] Add combo counter (correct answers in a row)
- [ ] Replace magic numbers with named constants (220 iterations, 0.32 probability, etc.)
- [ ] Handle equation generation fallback more gracefully

### 6.3 Plane Forest Run (7/10)
- [ ] Add collision animation (shake/flash instead of abrupt stop)
- [ ] Add difficulty levels (easy/medium/hard — obstacle density, speed)
- [ ] Fix delta-time cap (0.033 too aggressive — causes stutter below 30fps)
- [ ] Make checkpoint markers more visible (larger icons, on-screen callout)
- [ ] Add invulnerability visual indicator (flashing plane during respawn)
- [ ] Add tutorial/onboarding (explain controls and checkpoint respawn)
- [ ] Add pause functionality
- [ ] Add sound effects (whoosh, checkpoint ding, crash)
- [ ] Remove redundant `onTouchStart/End` handlers (Pointer API is sufficient)

---

## Phase 7: New Games

Three new games to fill skill and age group gaps. All follow existing conventions: modular `games/<slug>/` structure, CSS Modules, i18n via `useI18n()`, pastel aesthetic, localStorage high scores.

### 7.1 Color Shape Sorter

**Slug:** `color-shape-sorter` | **Age:** `3plus` | **New skills:** `logic`, `colors`, `shapes`

**Concept:** Shapes (circles, squares, triangles, stars) appear one at a time. Player sorts them into matching bins at the bottom — by color, by shape, or by both.

**Why:** First non-action, puzzle-style game. Fills colors/shapes/logic gap. Drag-and-drop is a new interaction (touch-friendly for tablets). No time pressure on easy mode.

**Difficulty levels:**
- Easy: sort by color only (3 bins: red, blue, yellow)
- Medium: sort by shape only (4 bins: circle, square, triangle, star)
- Hard: sort by color + shape combos

**Implementation tasks:**
- [ ] Create `games/color-shape-sorter/ColorShapeSorterGame.js`
- [ ] Create `games/color-shape-sorter/colorShapeSorter.module.css`
- [ ] Create SVG assets for shapes and bins
- [ ] Create `app/games/color-shape-sorter/page.js` route
- [ ] Create preview SVG (`public/games/color-shape-sorter-preview.svg`)
- [ ] Add i18n keys to `lib/i18n/messages.js` (both `uk` and `en`)
- [ ] Add skill tags `skills.logic`, `skills.colors`, `skills.shapes` to messages
- [ ] Add catalog entry to `games/catalog.js`
- [ ] Implement drag-and-drop (pointer events) + tap-to-place fallback
- [ ] Add scoring (correct sorts, streaks)
- [ ] Add high score persistence to localStorage
- [ ] Test on mobile/tablet touch screens

### 7.2 Memory Cards

**Slug:** `memory-cards` | **Age:** `4plus` | **New skills:** `memory`

**Concept:** Classic card-matching game. Grid of face-down cards with animal/object illustrations. Flip two cards — if they match, they stay revealed. Find all pairs to win.

**Why:** Fills the memory skill gap. Introduces 4+ age group (first non-3+ game). Turn-based — completely different pacing. No text dependency — works in any language. Simple universal rules.

**Difficulty levels:**
- Easy: 6 cards (3 pairs, 2x3 grid)
- Medium: 12 cards (6 pairs, 3x4 grid)
- Hard: 20 cards (10 pairs, 4x5 grid)

**Implementation tasks:**
- [ ] Create `games/memory-cards/MemoryCardsGame.js`
- [ ] Create `games/memory-cards/memoryCards.module.css`
- [ ] Create SVG card-back and card-face illustrations (animals, objects)
- [ ] Create `app/games/memory-cards/page.js` route
- [ ] Create preview SVG (`public/games/memory-cards-preview.svg`)
- [ ] Add i18n keys to `lib/i18n/messages.js` (both `uk` and `en`)
- [ ] Add `ages.4plus` age group to messages
- [ ] Add `skills.memory` skill tag to messages
- [ ] Add catalog entry to `games/catalog.js`
- [ ] Implement card flip animation (CSS 3D transform)
- [ ] Add move counter and timer
- [ ] Add scoring (fewer moves = higher score)
- [ ] Add high score persistence to localStorage
- [ ] Add match celebration animation

### 7.3 Word Builder

**Slug:** `word-builder` | **Age:** `5plus` | **New skills:** (reuses `typing`, `letterOrder`, `logic`)

**Concept:** Given scrambled letter tiles and a picture hint, the player arranges tiles into the correct word. Tap tiles in order or drag into slots.

**Why:** Deepens literacy beyond Typing Balloons (word construction, not just letter popping). Introduces 5+ age group. Heavily locale-aware — Ukrainian words with Cyrillic tiles, English with Latin. Can reuse `KidWordInput` keyboard.

**Difficulty levels:**
- Easy: 3-4 letter words, picture hint always visible
- Medium: 5-6 letter words, picture hint visible
- Hard: 7+ letter words, picture hint fades after 3 seconds

**Implementation tasks:**
- [ ] Create `games/word-builder/WordBuilderGame.js`
- [ ] Create `games/word-builder/wordBuilder.module.css`
- [ ] Create word lists per locale (15-20 words each for `uk` and `en`)
- [ ] Create or source SVG picture hints for each word
- [ ] Create `app/games/word-builder/page.js` route
- [ ] Create preview SVG (`public/games/word-builder-preview.svg`)
- [ ] Add i18n keys to `lib/i18n/messages.js` (both `uk` and `en`)
- [ ] Add `ages.5plus` age group to messages
- [ ] Add catalog entry to `games/catalog.js`
- [ ] Implement tile tap-to-place and drag-to-slot interactions
- [ ] Add letter slot feedback (green for correct position, shake for wrong)
- [ ] Add scoring (speed + fewer wrong placements = higher score)
- [ ] Add high score persistence to localStorage
- [ ] Add hint button (reveals one correct letter)

---

### Gap Coverage Summary

| Gap | Filled By |
|-----|-----------|
| No puzzle/turn-based games | Color Shape Sorter, Memory Cards |
| Missing logic skill | Color Shape Sorter, Word Builder |
| Missing memory skill | Memory Cards |
| Missing colors/shapes skills | Color Shape Sorter |
| Only 3+ age group | Memory Cards (4+), Word Builder (5+) |
| All games are real-time | Memory Cards is fully turn-based |
| No drag-and-drop interaction | Color Shape Sorter, Word Builder |
| Limited literacy training | Word Builder deepens spelling skills |

---

## Notes

- Phases 1-2 are the minimum for a usable public launch.
- Phase 3 is high-value for the tablet-heavy kids audience.
- Phase 5 items are optional and can be deferred until the user base grows.
- Each phase can be picked up independently — no hard dependencies between phases (except Phase 1 must come first).
