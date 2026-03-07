/**
 * Piece type definitions, placement rules, and skin config for Train Station Builder.
 */

export const PIECE_TYPES = {
  BENCH: 'bench',
  SHELTER: 'shelter',
  ELEVATOR: 'elevator',
  FLOWERPOT: 'flowerpot',
  LAMP: 'lamp',
  CLOCK: 'clock',
  SCREEN: 'screen',
};

/**
 * Each piece definition:
 *  - seats: number of seats this piece provides
 *  - category: seating | access | decoration | signal
 *  - canPlaceOn: array of cell types this piece can be placed on
 *  - emoji: visual fallback
 *  - labelKey: i18n key for the piece name
 *  - isFinalPiece: if true, placing it triggers the completion check
 */
export const PIECE_DEFS = {
  bench: {
    seats: 2,
    category: 'seating',
    canPlaceOn: ['open'],
    emoji: '\u{1FA91}',
    labelKey: 'stationGame.pool.bench',
  },
  shelter: {
    seats: 4,
    category: 'seating',
    canPlaceOn: ['open'],
    emoji: '\u{1F3D7}\uFE0F',
    labelKey: 'stationGame.pool.shelter',
  },
  elevator: {
    seats: 0,
    category: 'access',
    canPlaceOn: ['open'],
    emoji: '\u{1F6D7}',
    labelKey: 'stationGame.pool.elevator',
  },
  flowerpot: {
    seats: 0,
    category: 'decoration',
    canPlaceOn: ['open'],
    emoji: '\u{1FAB4}',
    labelKey: 'stationGame.pool.flowerpot',
  },
  lamp: {
    seats: 0,
    category: 'decoration',
    canPlaceOn: ['open'],
    emoji: '\u{1F4A1}',
    labelKey: 'stationGame.pool.lamp',
  },
  clock: {
    seats: 0,
    category: 'decoration',
    canPlaceOn: ['open'],
    emoji: '\u{1F550}',
    labelKey: 'stationGame.pool.clock',
  },
  screen: {
    seats: 0,
    category: 'signal',
    canPlaceOn: ['open'],
    emoji: '\u{1F4FA}',
    labelKey: 'stationGame.pool.screen',
    isFinalPiece: true,
  },
};

/** Skin themes — affect visual appearance only */
export const SKINS = {
  default: { nameKey: 'stationGame.skins.default', cssClass: 'skinDefault' },
  modern: { nameKey: 'stationGame.skins.modern', cssClass: 'skinModern' },
  vintage: { nameKey: 'stationGame.skins.vintage', cssClass: 'skinVintage' },
};

/** Get seat count for a piece type */
export function getSeatCount(pieceType) {
  return PIECE_DEFS[pieceType]?.seats ?? 0;
}

/** Check if a piece can be placed on a given cell type */
export function canPlacePiece(pieceType, cellType) {
  return PIECE_DEFS[pieceType]?.canPlaceOn.includes(cellType) ?? false;
}

/** Check if a piece is the final "signal" piece */
export function isFinalPiece(pieceType) {
  return PIECE_DEFS[pieceType]?.isFinalPiece === true;
}
