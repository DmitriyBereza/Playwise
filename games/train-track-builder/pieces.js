/**
 * Rail piece definitions and connection maps for Train Track Builder.
 */

// Connection points for each piece type at each rotation.
// Each entry lists which sides of the cell the piece connects.
export const CONNECTIONS = {
  straight: {
    // SVG draws vertical rails, so 0° = top↔bottom, 90° CW = left↔right
    0:   { top: true, bottom: true },
    90:  { left: true, right: true },
    180: { top: true, bottom: true },
    270: { left: true, right: true },
  },
  curve: {
    0:   { bottom: true, right: true },
    90:  { bottom: true, left: true },
    180: { top: true, left: true },
    270: { top: true, right: true },
  },
};

// Opposite directions for checking neighbor connectivity
export const OPPOSITE = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

// Direction vectors (row, col deltas)
export const DIR_DELTA = {
  top:    { dr: -1, dc: 0 },
  bottom: { dr: 1,  dc: 0 },
  left:   { dr: 0,  dc: -1 },
  right:  { dr: 0,  dc: 1 },
};

/**
 * Get the connection directions for a piece at a given rotation.
 * Returns an array of direction strings, e.g. ['left', 'right'].
 */
export function getConnections(pieceType, rotation) {
  const conn = CONNECTIONS[pieceType]?.[rotation % 360];
  if (!conn) return [];
  return Object.keys(conn).filter((k) => conn[k]);
}

/**
 * Rotate a piece 90 degrees clockwise.
 */
export function rotateClockwise(rotation) {
  return (rotation + 90) % 360;
}

/**
 * Get the exit angle for the train when entering a cell from a given direction.
 * Used for orienting the train SVG during animation.
 */
export function getExitAngle(pieceType, rotation, entryDirection) {
  const conn = getConnections(pieceType, rotation);
  const exit = conn.find((d) => d !== OPPOSITE[entryDirection]);
  if (!exit) return 0;
  const angles = { right: 0, bottom: 90, left: 180, top: 270 };
  return angles[exit] ?? 0;
}
