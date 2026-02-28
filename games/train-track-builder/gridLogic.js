/**
 * Grid generation, level generation, and path validation for Train Track Builder.
 */

import { CONNECTIONS, OPPOSITE, DIR_DELTA, getConnections } from './pieces';

// --- Grid sizing per level ---

function getGridSize(level) {
  if (level <= 3) return { cols: 4, rows: 3 };
  if (level <= 6) return { cols: 5, rows: 4 };
  if (level <= 10) return { cols: 6, rows: 4 };
  return { cols: 7, rows: 5 };
}

// --- Level generation ---

/**
 * Generate a level configuration.
 * Returns { grid, pool, solutionPath, cols, rows, stationA, stationB }
 */
export function generateLevel(levelNumber) {
  const { cols, rows } = getGridSize(levelNumber);

  // Init empty grid
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ type: 'empty', piece: null, rotation: 0, obstacle: null });
    }
    grid.push(row);
  }

  // Place stations
  const stationARow = levelNumber <= 3 ? Math.floor(rows / 2) : randInt(0, rows - 1);
  let stationBRow = levelNumber <= 3 ? stationARow : randInt(0, rows - 1);
  // Avoid same row for harder levels to force curves
  if (levelNumber > 3 && stationBRow === stationARow && rows > 2) {
    stationBRow = (stationARow + 1) % rows;
  }

  const stationA = { row: stationARow, col: 0 };
  const stationB = { row: stationBRow, col: cols - 1 };

  grid[stationA.row][stationA.col] = { type: 'stationA', piece: null, rotation: 0, obstacle: null };
  grid[stationB.row][stationB.col] = { type: 'stationB', piece: null, rotation: 0, obstacle: null };

  // Generate solution path via random walk
  const solutionPath = generateSolutionPath(stationA, stationB, cols, rows);

  // Determine pieces needed for the path
  const pathPieces = [];
  for (let i = 0; i < solutionPath.length; i++) {
    const cell = solutionPath[i];
    // Skip station cells — they don't need rail pieces
    if (i === 0 || i === solutionPath.length - 1) continue;

    const prev = solutionPath[i - 1];
    const next = solutionPath[i + 1];

    const fromDir = getDirection(cell, prev); // direction toward prev cell
    const toDir = getDirection(cell, next);   // direction toward next cell

    const { pieceType, rotation } = findPieceForDirections(fromDir, toDir);
    pathPieces.push({ pieceType, rotation, row: cell.row, col: cell.col });
  }

  // Place obstacles
  const emptyCells = [];
  const pathSet = new Set(solutionPath.map((c) => `${c.row},${c.col}`));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!pathSet.has(`${r},${c}`) && grid[r][c].type === 'empty') {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  const maxObstacles = Math.floor(emptyCells.length * 0.3);
  const numObstacles = Math.min(Math.floor(levelNumber * 0.8), maxObstacles);
  const obstacleTypes = ['tree', 'rock', 'pond'];

  shuffle(emptyCells);
  for (let i = 0; i < numObstacles && i < emptyCells.length; i++) {
    const { row, col } = emptyCells[i];
    grid[row][col].obstacle = obstacleTypes[randInt(0, obstacleTypes.length - 1)];
  }

  // Build piece pool
  const pool = pathPieces.map((p, idx) => ({
    id: `piece-${idx}`,
    pieceType: p.pieceType,
    used: false,
  }));

  // Add distractor pieces for higher levels
  if (levelNumber >= 4) {
    const distractorCount = Math.min(2, Math.floor((levelNumber - 3) / 2) + 1);
    for (let d = 0; d < distractorCount; d++) {
      pool.push({
        id: `distractor-${d}`,
        pieceType: Math.random() < 0.5 ? 'straight' : 'curve',
        used: false,
      });
    }
  }

  shuffle(pool);

  return { grid, pool, solutionPath, cols, rows, stationA, stationB };
}

// --- Path generation ---

function generateSolutionPath(start, end, cols, rows) {
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const path = tryGeneratePath(start, end, cols, rows);
    if (path) return path;
  }
  // Fallback: direct horizontal then vertical path
  return fallbackPath(start, end);
}

function tryGeneratePath(start, end, cols, rows) {
  // Always force stationA→right and left→stationB connections so validator works.
  // The walk starts at (start.row, 1) and must reach (end.row, cols-2) before ending.
  const firstStep = { row: start.row, col: 1 };
  const lastStep  = { row: end.row,   col: cols - 2 };

  const visited = new Set();
  visited.add(`${start.row},${start.col}`);
  visited.add(`${firstStep.row},${firstStep.col}`);

  const path = [start, firstStep];

  // Edge case: path is just A → firstStep → lastStep → B (they may be the same cell)
  if (firstStep.row === lastStep.row && firstStep.col === lastStep.col) {
    path.push(end);
    return path;
  }

  let cur = firstStep;

  while (cur.row !== lastStep.row || cur.col !== lastStep.col) {
    const candidates = [];

    // Prefer moving right toward lastStep.col
    if (cur.col < lastStep.col) {
      candidates.push({ row: cur.row, col: cur.col + 1 });
      candidates.push({ row: cur.row, col: cur.col + 1 }); // double weight
    }
    // Move vertically toward lastStep.row
    if (cur.row < lastStep.row) candidates.push({ row: cur.row + 1, col: cur.col });
    if (cur.row > lastStep.row) candidates.push({ row: cur.row - 1, col: cur.col });
    // Random vertical variety
    if (cur.row > 0)        candidates.push({ row: cur.row - 1, col: cur.col });
    if (cur.row < rows - 1) candidates.push({ row: cur.row + 1, col: cur.col });

    const valid = candidates.filter((c) => {
      if (c.row < 0 || c.row >= rows) return false;
      // Stay within the interior columns (1 .. cols-2)
      if (c.col < 1 || c.col > lastStep.col) return false;
      if (visited.has(`${c.row},${c.col}`)) return false;
      if (c.col < cur.col) return false; // no going left
      return true;
    });

    if (valid.length === 0) return null; // dead end, retry

    const next = valid[randInt(0, valid.length - 1)];
    path.push(next);
    visited.add(`${next.row},${next.col}`);
    cur = next;

    if (path.length > (cols - 2) * rows + 2) return null; // safety
  }

  path.push(end);
  return path;
}

function fallbackPath(start, end) {
  const cols = end.col + 1;
  const path = [{ row: start.row, col: start.col }];
  let { row } = start;
  let col = 1; // always start right from stationA

  path.push({ row, col });

  // Move vertically to align with end.row
  while (row !== end.row) {
    row += row < end.row ? 1 : -1;
    path.push({ row, col });
  }
  // Move right to cols-2 (cell left of stationB)
  while (col < cols - 2) {
    col++;
    path.push({ row, col });
  }

  path.push({ row: end.row, col: end.col });
  return path;
}

// --- Path validation (BFS) ---

/**
 * Validate whether a connected rail path exists from stationA to stationB.
 * Returns { valid: boolean, path: Array<{row, col}> | null }
 */
export function validatePath(grid, stationA, stationB, rows, cols) {
  const queue = [{ ...stationA, from: null, trail: [stationA] }];
  const visited = new Set();
  visited.add(`${stationA.row},${stationA.col}`);

  while (queue.length > 0) {
    const { row, col, trail } = queue.shift();
    const cell = grid[row][col];

    // Determine outgoing directions from this cell
    let outDirs;
    if (cell.type === 'stationA') {
      outDirs = ['right']; // Station A connects to the right
    } else if (cell.type === 'stationB') {
      outDirs = ['left']; // Station B connects from the left
    } else if (cell.piece) {
      outDirs = getConnections(cell.piece, cell.rotation);
    } else {
      continue; // empty cell with no piece
    }

    for (const dir of outDirs) {
      const delta = DIR_DELTA[dir];
      const nr = row + delta.dr;
      const nc = col + delta.dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(`${nr},${nc}`)) continue;

      const neighbor = grid[nr][nc];
      const needDir = OPPOSITE[dir]; // neighbor must connect back toward us

      let neighborConnects = false;
      if (neighbor.type === 'stationA') {
        neighborConnects = needDir === 'right';
      } else if (neighbor.type === 'stationB') {
        neighborConnects = needDir === 'left';
      } else if (neighbor.piece) {
        const nConn = getConnections(neighbor.piece, neighbor.rotation);
        neighborConnects = nConn.includes(needDir);
      }

      if (!neighborConnects) continue;

      const newTrail = [...trail, { row: nr, col: nc }];

      // Check if we've reached station B
      if (nr === stationB.row && nc === stationB.col) {
        return { valid: true, path: newTrail };
      }

      visited.add(`${nr},${nc}`);
      queue.push({ row: nr, col: nc, trail: newTrail });
    }
  }

  return { valid: false, path: null };
}

// --- Helpers ---

function getDirection(from, to) {
  if (to.row < from.row) return 'top';
  if (to.row > from.row) return 'bottom';
  if (to.col < from.col) return 'left';
  return 'right';
}

function findPieceForDirections(dir1, dir2) {
  // Try all piece types and rotations to find matching connections
  for (const pieceType of ['straight', 'curve']) {
    for (const rot of [0, 90, 180, 270]) {
      const conn = CONNECTIONS[pieceType][rot];
      const dirs = Object.keys(conn).filter((k) => conn[k]);
      if (dirs.length === 2 && dirs.includes(dir1) && dirs.includes(dir2)) {
        return { pieceType, rotation: rot };
      }
    }
  }
  // Should never reach here with valid path
  return { pieceType: 'straight', rotation: 0 };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
