export const STATE_PLY = 0;
export const STATE_SIDE = 1;
export const STATE_SUPPORT_LO = 2;
export const STATE_SUPPORT_HI = 3;
export const STATE_PLAYABLE_LO = 4;
export const STATE_PLAYABLE_HI = 5;
export const STATE_SUPPORT_CODE = 6;

/**
 * Dynamic-geometry transition for boards whose cell mask fits two uint32 lanes.
 *
 * Geometry is fixed for an engine instance but supplied as initialization-derived
 * scalars rather than hard-coded here:
 * - columns: configured board width
 * - rows: configured board height
 * - supportIncrement: precomputed change to the configured support encoding for
 *   this column
 * - rankIncrement: optional precomputed change to any rank/ply field embedded
 *   in the support encoding; use 0 when rank is represented separately
 */
export function applyMove32(
  state,
  heights,
  moveColumns,
  column,
  columns,
  rows,
  supportIncrement,
  rankIncrement,
) {
  const ply = state[STATE_PLY];
  const row = heights[column];
  const cell = row * columns + column;
  const bit = (1 << cell) >>> 0;

  if (cell < 32) {
    state[STATE_SUPPORT_LO] = (state[STATE_SUPPORT_LO] | bit) >>> 0;
    let playableLo = (state[STATE_PLAYABLE_LO] & ~bit) >>> 0;

    if (row + 1 < rows) {
      const above = cell + columns;
      const aboveBit = (1 << above) >>> 0;
      if (above < 32) playableLo = (playableLo | aboveBit) >>> 0;
      else state[STATE_PLAYABLE_HI] = (state[STATE_PLAYABLE_HI] | aboveBit) >>> 0;
    }

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    state[STATE_SUPPORT_HI] = (state[STATE_SUPPORT_HI] | bit) >>> 0;
    let playableHi = (state[STATE_PLAYABLE_HI] & ~bit) >>> 0;

    if (row + 1 < rows) {
      const aboveBit = (1 << (cell + columns)) >>> 0;
      playableHi = (playableHi | aboveBit) >>> 0;
    }

    state[STATE_PLAYABLE_HI] = playableHi;
  }

  heights[column] = row + 1;
  moveColumns[ply] = column;
  state[STATE_PLY] = ply + 1;
  state[STATE_SIDE] = 1 - state[STATE_SIDE];
  state[STATE_SUPPORT_CODE] = (
    state[STATE_SUPPORT_CODE] + supportIncrement + rankIncrement
  ) >>> 0;
  return cell;
}

export function undoMove32(
  state,
  heights,
  moveColumns,
  columns,
  rows,
  supportIncrement,
  rankIncrement,
) {
  const ply = state[STATE_PLY] - 1;
  const column = moveColumns[ply];
  const row = heights[column] - 1;
  const cell = row * columns + column;
  const bit = (1 << cell) >>> 0;

  state[STATE_PLY] = ply;
  state[STATE_SIDE] = 1 - state[STATE_SIDE];
  heights[column] = row;
  state[STATE_SUPPORT_CODE] = (
    state[STATE_SUPPORT_CODE] - supportIncrement - rankIncrement
  ) >>> 0;

  if (cell < 32) {
    state[STATE_SUPPORT_LO] = (state[STATE_SUPPORT_LO] & ~bit) >>> 0;
    let playableLo = state[STATE_PLAYABLE_LO];

    if (row + 1 < rows) {
      const above = cell + columns;
      const aboveBit = (1 << above) >>> 0;
      if (above < 32) playableLo = (playableLo & ~aboveBit) >>> 0;
      else state[STATE_PLAYABLE_HI] = (state[STATE_PLAYABLE_HI] & ~aboveBit) >>> 0;
    }

    state[STATE_PLAYABLE_LO] = (playableLo | bit) >>> 0;
  } else {
    state[STATE_SUPPORT_HI] = (state[STATE_SUPPORT_HI] & ~bit) >>> 0;
    let playableHi = state[STATE_PLAYABLE_HI];

    if (row + 1 < rows) {
      const aboveBit = (1 << (cell + columns)) >>> 0;
      playableHi = (playableHi & ~aboveBit) >>> 0;
    }

    state[STATE_PLAYABLE_HI] = (playableHi | bit) >>> 0;
  }
  return cell;
}
