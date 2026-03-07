/**
 * Grid generation, level generation, and station validation for Train Station Builder.
 */

import { getSeatCount } from './pieces';

// --- Grid sizing per level ---

function getGridSize(level) {
  if (level <= 3) return { cols: 5, rows: 3 };
  if (level <= 6) return { cols: 6, rows: 3 };
  if (level <= 10) return { cols: 7, rows: 4 };
  return { cols: 8, rows: 4 };
}

// --- Seat target per level ---

function getSeatTarget(level) {
  if (level <= 3) return 4 + (level - 1);          // 4, 5, 6
  if (level <= 6) return 8 + (level - 4) * 2;      // 8, 10, 12
  if (level <= 10) return 12 + (level - 7) * 2;    // 12, 14, 16, 18
  return 18 + (level - 10) * 2;                    // 20, 22, ...
}

// --- Passenger count = seat target ---

function getPassengerCount(level) {
  return getSeatTarget(level);
}

// --- Level generation ---

/**
 * Generate a level configuration.
 * Returns { grid, pool, cols, rows, seatTarget, passengerCount }
 */
export function generateLevel(levelNumber) {
  const { cols, rows } = getGridSize(levelNumber);
  const seatTarget = getSeatTarget(levelNumber);
  const passengerCount = getPassengerCount(levelNumber);

  // Init grid — all cells start as 'open'
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ type: 'open', piece: null, preDecoType: null });
    }
    grid.push(row);
  }

  // Place structural pillars (blocked cells) for levels > 2
  if (levelNumber > 2) {
    const pillarCount = Math.min(Math.floor((levelNumber - 1) / 2), 4);
    placePillars(grid, pillarCount, cols, rows);
  }

  // Place pre-set decorations (occupy open cells, block bench placement)
  const maxDecorations = Math.floor(cols * rows * 0.25);
  const decoCount = Math.min(Math.floor(levelNumber * 0.7) + 1, maxDecorations);
  const decoTypes = ['flowerpot', 'lamp', 'clock'];
  placeDecorations(grid, decoCount, decoTypes, cols, rows);

  // Ensure solvability: enough open cells for seating + elevator + screen
  const minBenchesNeeded = Math.ceil(seatTarget / 4); // shelters give 4 seats each
  const minPiecesNeeded = minBenchesNeeded + 2; // +1 elevator +1 screen
  ensureSolvability(grid, minPiecesNeeded, cols, rows);

  // Build piece pool
  const pool = buildPool(levelNumber, seatTarget);

  return { grid, pool, cols, rows, seatTarget, passengerCount };
}

// --- Validation ---

/**
 * Check station completion status.
 * Returns {
 *   totalSeats, seatTarget, seatsReached,
 *   hasElevator, hasScreen,
 *   isComplete, readyForScreen,
 * }
 */
export function validateStation(grid, rows, cols, seatTarget) {
  let totalSeats = 0;
  let hasElevator = false;
  let hasScreen = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell.piece) continue;
      totalSeats += getSeatCount(cell.piece);
      if (cell.piece === 'elevator') hasElevator = true;
      if (cell.piece === 'screen') hasScreen = true;
    }
  }

  const seatsReached = totalSeats >= seatTarget;
  const readyForScreen = seatsReached && hasElevator && !hasScreen;
  const isComplete = seatsReached && hasElevator && hasScreen;

  return { totalSeats, seatTarget, seatsReached, hasElevator, hasScreen, isComplete, readyForScreen };
}

// --- Pool builder ---

function buildPool(levelNumber, seatTarget) {
  const pool = [];
  let id = 0;

  // Seating: provide slightly more capacity than needed so player has choices
  let seatsProvided = 0;
  const targetWithSlack = seatTarget + 2;

  while (seatsProvided < targetWithSlack) {
    if (Math.random() < 0.6 || seatsProvided + 4 > targetWithSlack + 4) {
      pool.push({ id: `piece-${id++}`, pieceType: 'bench', used: false });
      seatsProvided += 2;
    } else {
      pool.push({ id: `piece-${id++}`, pieceType: 'shelter', used: false });
      seatsProvided += 4;
    }
  }

  // Mandatory elevator(s)
  const elevatorCount = levelNumber >= 7 ? 2 : 1;
  for (let i = 0; i < elevatorCount; i++) {
    pool.push({ id: `piece-${id++}`, pieceType: 'elevator', used: false });
  }

  // Exactly 1 announcement screen
  pool.push({ id: `piece-${id++}`, pieceType: 'screen', used: false });

  // Distractor decorations (more at higher levels)
  const distractorCount = Math.min(Math.floor(levelNumber / 2), 4);
  const distractorTypes = ['flowerpot', 'lamp', 'clock'];
  for (let i = 0; i < distractorCount; i++) {
    pool.push({
      id: `distractor-${i}`,
      pieceType: distractorTypes[i % distractorTypes.length],
      used: false,
    });
  }

  shuffle(pool);
  return pool;
}

// --- Grid helpers ---

function placePillars(grid, count, cols, rows) {
  const candidates = [];
  // Pillars go in interior cells only (not edges)
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c].type === 'open') {
        candidates.push({ r, c });
      }
    }
  }
  shuffle(candidates);
  const placed = Math.min(count, candidates.length);
  for (let i = 0; i < placed; i++) {
    const { r, c } = candidates[i];
    grid[r][c].type = 'blocked';
  }
}

function placeDecorations(grid, count, decoTypes, cols, rows) {
  const candidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'open') {
        candidates.push({ r, c });
      }
    }
  }
  shuffle(candidates);
  const placed = Math.min(count, candidates.length);
  for (let i = 0; i < placed; i++) {
    const { r, c } = candidates[i];
    const decoType = decoTypes[randInt(0, decoTypes.length - 1)];
    grid[r][c].type = 'decoration';
    grid[r][c].preDecoType = decoType;
  }
}

function countOpenCells(grid) {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.type === 'open') count++;
    }
  }
  return count;
}

function ensureSolvability(grid, minPiecesNeeded, cols, rows) {
  let open = countOpenCells(grid);
  // If not enough open cells, convert decoration cells back to open
  if (open >= minPiecesNeeded) return;

  for (let r = 0; r < rows && open < minPiecesNeeded; r++) {
    for (let c = 0; c < cols && open < minPiecesNeeded; c++) {
      if (grid[r][c].type === 'decoration') {
        grid[r][c].type = 'open';
        grid[r][c].preDecoType = null;
        open++;
      }
    }
  }
}

// --- Utilities ---

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
