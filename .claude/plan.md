# Train Track Builder — Game Design & Implementation Plan

## Game Identity

- **Title (EN):** Train Track Builder
- **Title (UK):** Залізничний будівельник
- **Slug:** `train-track-builder`
- **Age:** `3plus`
- **Skills:** `logic`, `spatial` (new skill tags)
- **Genre:** Grid puzzle, turn-based, no time pressure

---

## Game Design Document

### Core Loop

1. Player sees a grid board with **Station A** (left side) and **Station B** (right side)
2. **Obstacles** (trees, rocks, ponds) block the direct path
3. A **rail pool** at the bottom shows available pieces (straights + curves)
4. Player taps a piece from the pool to select it, then taps an empty cell to place it
5. Tapping a placed piece **rotates** it 90°; long-press or double-tap **removes** it back to pool
6. When a valid connected path from A→B exists, a **"Go!" button** lights up
7. Player taps "Go!" → the **train chugs along the track** with steam animation
8. **Level complete** → celebration (confetti, horn) → score awarded → next level starts
9. Levels get progressively harder (bigger grids, more obstacles, fewer spare pieces)

### Why This Design Works for Ages 3-5

| Decision | Reasoning |
|----------|-----------|
| No timer, no lives | Zero pressure — puzzle, not reflex game |
| No reading required | Entirely visual/spatial |
| Unlimited undo | Tap to rotate, double-tap to remove — fully forgiving |
| Small piece pool (4-8) | Won't overwhelm — clear choices |
| Only 2 piece types | Straight + Curve is all you need for any path |
| Visual guides | Valid cells glow when holding a piece |
| Train reward animation | Delayed gratification teaches goal-directed play |
| Progressive difficulty | Mastery through gentle escalation |

### Rail Piece System

Only **2 piece types**, each rotatable to 4 orientations:

**STRAIGHT** — connects opposite sides:
```
Rotation 0°/180°: ━  (left ↔ right)
Rotation 90°/270°: ┃  (top ↔ bottom)
```

**CURVE** — connects two adjacent sides:
```
Rotation 0°:   ┗  (bottom ↔ right... visually: comes from left-bottom, exits right)
Rotation 90°:  ┛  (bottom ↔ left)
Rotation 180°: ┓  (top ↔ left)
Rotation 270°: ┏  (top ↔ right)
```

Connection points per piece (used for path validation):
```javascript
const CONNECTIONS = {
  straight: {
    0:   { left: true, right: true },
    90:  { top: true, bottom: true },
    180: { left: true, right: true },
    270: { top: true, bottom: true },
  },
  curve: {
    0:   { bottom: true, right: true },
    90:  { bottom: true, left: true },
    180: { top: true, left: true },
    270: { top: true, right: true },
  }
}
```

### Level Generation Algorithm

```
generateLevel(levelNumber):
  1. Calculate grid size:
     - Levels 1-3:  cols=4, rows=3  (12 cells)
     - Levels 4-6:  cols=5, rows=4  (20 cells)
     - Levels 7-10: cols=6, rows=4  (24 cells)
     - Levels 11+:  cols=7, rows=5  (35 cells)

  2. Place stations:
     - Station A: col=0, row=random
     - Station B: col=last, row=random
     - Early levels (1-3): same row (straight path possible)

  3. Generate solution path (random walk):
     - Start at A, target B
     - Each step: move RIGHT, UP, or DOWN (bias toward right)
     - Never revisit a cell, never go left (keeps paths simple)
     - Record each rail piece type + rotation needed

  4. Place obstacles:
     - Pick N random empty cells (not on path, not stations)
     - N = floor(level * 0.8), capped at 30% of empty cells
     - Obstacle variants: 'tree', 'rock', 'pond' (random)

  5. Build piece pool:
     - Start with exact solution pieces
     - Add 1-2 distractor pieces (levels 4+)
     - Shuffle order

  6. Return { grid, pool, solutionPath }
```

### Path Validation (real-time as player builds)

```
validatePath(grid, startCell, endCell):
  BFS from startCell:
    - For current cell, get its connection points
    - For each connection direction (top/right/bottom/left):
      - Check if neighbor cell exists and has matching connection
      - If neighbor is endCell with matching connection → PATH FOUND
      - If neighbor is a rail with matching connection → enqueue
  Return: { valid: boolean, path: Cell[] }
```

Run validation after every piece placement/rotation. When valid → enable "Go!" button with bounce animation.

### Train Animation Sequence

When player taps "Go!":
1. Disable board interaction
2. Build ordered path cell list from A→B
3. Animate train SVG along the path:
   - Each cell: ~0.6s transit time
   - Train rotates to match track direction
   - Steam puffs emit from chimney every 0.3s
   - Wheels rotate continuously
   - Subtle screen shake on each rail joint
4. Train arrives at Station B:
   - Horn sound placeholder (CSS animation for now)
   - Confetti burst
   - Score popup (+10 base, +2 per unused piece, +5 level bonus)
5. After 2s celebration → transition to next level

### Scoring

```
levelScore = 10 + (unusedPieces * 2) + (level * 5)
totalScore += levelScore
```
- High score persists to `localStorage` key: `trainTrackBuilderHighScoreV1`
- Also persist `trainTrackBuilderMaxLevelV1` for level progress

### State Shape

```javascript
{
  level: 1,
  phase: 'idle' | 'building' | 'running' | 'celebrating',
  grid: [[ { type, obstacle?, piece?, rotation? } ]],
  pool: [{ id, piece, used }],
  selectedPieceId: null | id,
  validPath: null | Cell[],
  score: 0,
  highScore: 0,
  maxLevel: 1,
}
```

Phase transitions:
```
idle → (start) → building → (go!) → running → (arrived) → celebrating → (next) → building
                     ↑ (reset level) ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←|
```

---

## Visual Design — Addressing "Underwhelming Graphics"

The current games use flat geometric shapes (circles, rectangles). This game should raise the bar significantly.

### Art Direction

**Style:** Warm, detailed, hand-drawn feel — think children's book illustration
**Palette:**
- Sky/background: soft blue gradient (#D4EEFF → #F0F8FF)
- Grass tiles: layered greens (#7BC47F base, #5FA663 blades, #A8D8A0 highlights)
- Dirt/ground: warm browns (#C4956A, #D4A574)
- Rails: dark iron (#4A4A4A) on warm wood ties (#8B6914, #A67C30)
- Train: bold red locomotive (#D94040) with yellow trim (#FFD93D), black wheels
- Obstacles: rich multi-layered SVGs (not flat circles)
- Stations: red-roofed buildings with windows, platform, hanging sign

### SVG Asset List (detailed, multi-layered)

Each asset should use gradients, shadows, and layered shapes for depth:

```
public/games/train-track-builder/
  ├── train-locomotive.svg      — red engine with chimney, cabin, wheels, cow-catcher
  ├── steam-puff.svg            — fluffy white cloud for chimney animation
  ├── station-a.svg             — building with green flag, platform, "A" sign
  ├── station-b.svg             — building with red flag, platform, "B" sign
  ├── rail-straight.svg         — wooden ties + iron rails, top-down view
  ├── rail-curve.svg            — curved wooden ties + iron rails
  ├── obstacle-tree.svg         — trunk with bark texture + layered leaf canopy + shadow
  ├── obstacle-rock.svg         — boulder with highlights + smaller rocks + shadow
  ├── obstacle-pond.svg         — blue water with lily pad + ripple rings
  ├── tile-grass.svg            — grass tile with blade details + tiny flowers
  ├── tile-empty.svg            — dirt/sand tile for valid placement areas
  ├── confetti.svg              — celebration particles
  └── background-hills.svg      — rolling green hills + clouds for backdrop
```

### Preview Card (Portal)

```
public/games/train-track-builder-preview.svg
```
— Show a mini grid with a train on tracks, station buildings on sides, trees as obstacles. More detailed than existing previews.

### Animation Specifications

| Animation | Implementation | Duration |
|-----------|---------------|----------|
| Piece selection glow | CSS box-shadow pulse | 0.8s infinite |
| Valid cell highlight | CSS background pulse (green tint) | 1s infinite |
| Piece placement | CSS scale(0.8→1) + opacity(0→1) | 0.2s ease-out |
| Piece rotation | CSS transform rotate(+90deg) | 0.25s ease |
| Piece removal | CSS scale(1→0.8) + opacity(1→0) | 0.15s ease-in |
| Train movement | CSS transform translate per cell | 0.6s ease-in-out |
| Train wheels | CSS rotate infinite | 0.3s linear |
| Steam puffs | CSS float-up + fade + scale | 1.2s ease-out |
| Confetti burst | CSS multi-particle scatter | 1.5s ease-out |
| "Go!" button bounce | CSS scale pulse when path valid | 0.5s infinite |
| Level transition | CSS fade-out grid → fade-in new grid | 0.8s ease |

---

## Technical Architecture

### Rendering: DOM + SVG (not Canvas)

**Why DOM over Canvas:**
- Grid cells are discrete clickable elements → native touch/click handling
- SVG assets scale perfectly to any screen
- CSS animations are GPU-accelerated and simpler than canvas frame loops
- Better accessibility (ARIA labels per cell, keyboard navigation)
- Easier to style hover/active/focus states
- Train animation: CSS keyframes generated dynamically from path

### Component Structure

```
games/train-track-builder/
  ├── TrainTrackBuilderGame.js    — main game component
  ├── trainTrackBuilder.module.css — all styles
  ├── gridLogic.js                — grid generation, path validation, level generation
  └── pieces.js                   — rail piece definitions, connection maps, SVG renderers
```

### Grid Rendering (CSS Grid)

```css
.board {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 2px;
  max-width: 560px;
  aspect-ratio: var(--cols) / var(--rows);
}

.cell {
  aspect-ratio: 1;
  min-width: 48px;    /* touch target minimum */
  border-radius: 8px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}
```

### Train Animation Along Path

When path is validated and "Go!" is pressed:

```javascript
// Build keyframe waypoints from path cells
const keyframes = validPath.map((cell, i) => ({
  offset: i / (validPath.length - 1),
  transform: `translate(${cell.col * cellSize}px, ${cell.row * cellSize}px) rotate(${cell.exitAngle}deg)`
}));

// Apply via Web Animations API or CSS
trainElement.animate(keyframes, {
  duration: validPath.length * 600, // 600ms per cell
  easing: 'linear',
  fill: 'forwards'
});
```

### Interaction Flow

```
User taps pool piece:
  → setSelectedPieceId(id)
  → highlight valid cells on grid (empty, adjacent to existing rail or station)

User taps valid empty cell:
  → place piece from pool into grid cell
  → mark pool piece as used
  → run validatePath() → update validPath state
  → if valid → show "Go!" button

User taps placed rail piece:
  → rotate 90° (cycle through 0→90→180→270→0)
  → re-validate path

User double-taps / long-presses placed rail piece:
  → remove piece from grid
  → return piece to pool (mark unused)
  → re-validate path

User taps "Go!" (only when validPath exists):
  → setPhase('running')
  → animate train along validPath
  → on animation end → setPhase('celebrating')
  → after 2s → advance level, setPhase('building')
```

---

## i18n Keys

```javascript
// In messages.js, add under both 'en' and 'uk':

// New skill tags
skills: {
  ...existing,
  logic: 'Logic' / 'Логіка',
  spatial: 'Spatial thinking' / 'Просторове мислення',
}

// Game translations
games: {
  trainTrackBuilder: {
    title: 'Train Track Builder' / 'Залізничний будівельник',
    description: 'Build rail tracks to connect stations! Place and rotate track pieces to guide the train from A to B.' /
                 'Будуй залізничні колії, щоб з\'єднати станції! Розміщуй та обертай частини колій, щоб провести потяг від А до Б.',
  }
}

// Game-internal translations
trainGame: {
  title: 'Train Track Builder' / 'Залізничний будівельник',
  level: 'Level {level}' / 'Рівень {level}',
  score: 'Score' / 'Рахунок',
  record: 'Record' / 'Рекорд',
  maxLevel: 'Max level' / 'Макс. рівень',
  go: 'Go!' / 'Поїхали!',
  selectPiece: 'Tap a rail piece' / 'Обери частину колій',
  placePiece: 'Tap an empty cell' / 'Постав на порожню клітинку',
  tapToRotate: 'Tap to rotate' / 'Натисни, щоб обернути',
  pathComplete: 'Track complete! Press Go!' / 'Колію побудовано! Тисни Поїхали!',
  levelComplete: 'Level {level} done!' / 'Рівень {level} пройдено!',
  celebrate: 'Choo-choo!' / 'Чух-чух!',
  pieces: 'Track pieces' / 'Частини колій',
  pool: {
    straight: 'Straight' / 'Пряма',
    curve: 'Curve' / 'Поворот',
  },
  status: {
    idle: 'Press Start to build!' / 'Натисни Старт!',
    building: 'Build the track from A to B' / 'Побудуй колію від А до Б',
    running: 'The train is on its way!' / 'Потяг їде!',
    celebrating: 'Well done!' / 'Молодець!',
  },
  start: 'Start' / 'Старт',
  nextLevel: 'Next level' / 'Наступний рівень',
  resetLevel: 'Try again' / 'Спробувати ще',
  backToMenu: 'Menu' / 'Меню',
}
```

---

## Implementation Steps

### Step 1: Core Data Layer (`gridLogic.js`, `pieces.js`)
- Rail piece definitions with connection maps
- Level generation algorithm (grid, obstacles, path, pool)
- Path validation (BFS)
- Grid state management helpers

### Step 2: SVG Assets
- Create all SVG files listed above
- Train locomotive with detail (gradients, shadows, mechanical parts)
- Station buildings A and B
- Rail pieces (straight, curve) — top-down view with ties and iron
- Obstacles (tree, rock, pond) — multi-layered, shaded
- Grass/dirt tiles with texture
- Preview SVG for portal card

### Step 3: Game Component (`TrainTrackBuilderGame.js`)
- Phase state machine (idle → building → running → celebrating)
- Grid rendering with CSS Grid
- Pool rendering at bottom
- Piece selection, placement, rotation, removal interactions
- Real-time path validation with visual feedback
- "Go!" button with enabled/disabled state

### Step 4: Train Animation
- Dynamic CSS keyframe generation from validated path
- Train SVG movement along path with rotation
- Steam puff animation (spawning CSS-animated elements)
- Wheel rotation animation
- Arrival celebration (confetti, score popup)

### Step 5: Level Progression & Persistence
- Level advancement with difficulty scaling
- Score calculation and display
- localStorage persistence (high score, max level)
- Level transition animation

### Step 6: Integration
- Create route page `app/games/train-track-builder/page.js`
- Add catalog entry to `games/catalog.js`
- Add all i18n keys to `lib/i18n/messages.js`
- Add new skill tags ('logic', 'spatial')
- Test on mobile/tablet

### Step 7: Polish
- Accessibility (ARIA labels per cell, keyboard navigation with arrow keys)
- Mobile touch optimization (48px minimum cells, no hover dependency)
- Loading state
- Error boundary
