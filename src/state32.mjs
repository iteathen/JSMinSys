export const STATE_PLY = 0;
export const STATE_SUPPORT_LO = 1;
export const STATE_SUPPORT_HI = 2;
export const STATE_PLAYABLE_LO = 3;
export const STATE_PLAYABLE_HI = 4;
export const STATE_SUPPORT_CODE = 5;

export function sideFromPly32(ply) {
  return ply & 1;
}

/**
 * Dynamic-geometry transition for boards whose cell mask fits two uint32 lanes.
 *
 * Geometry is selected during initialization and then invariant:
 * - columns: configured board width
 * - cellCount: configured columns * rows
 * - supportDelta: precomputed total change to the configured support encoding
 *   for this column, including any embedded rank/ply increment
 *
 * landingCells[column] stores the next playable cell index for the column.
 * Initialization sets landingCells[column] = column.
 */
export function applyMove32(
  state,
  landingCells,
  column,
  columns,
  cellCount,
  supportDelta,
) {
  const ply = state[STATE_PLY];
  const cell = landingCells[column];
  const bit = 1 << cell;
  const next = cell + columns;

  if (cell < 32) {
    state[STATE_SUPPORT_LO] = state[STATE_SUPPORT_LO] | bit;
    let playableLo = state[STATE_PLAYABLE_LO] & ~bit;

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo = playableLo | aboveBit;
      else state[STATE_PLAYABLE_HI] = state[STATE_PLAYABLE_HI] | aboveBit;
    }

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    state[STATE_SUPPORT_HI] = state[STATE_SUPPORT_HI] | bit;
    let playableHi = state[STATE_PLAYABLE_HI] & ~bit;

    if (next < cellCount) {
      const aboveBit = 1 << next;
      playableHi = playableHi | aboveBit;
    }

    state[STATE_PLAYABLE_HI] = playableHi;
  }

  landingCells[column] = next;
  state[STATE_PLY] = ply + 1;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function undoMove32(
  state,
  landingCells,
  column,
  columns,
  cellCount,
  supportDelta,
) {
  const ply = state[STATE_PLY] - 1;
  const next = landingCells[column];
  const cell = next - columns;
  const bit = 1 << cell;

  state[STATE_PLY] = ply;
  landingCells[column] = cell;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] - supportDelta;

  if (cell < 32) {
    state[STATE_SUPPORT_LO] = state[STATE_SUPPORT_LO] & ~bit;
    let playableLo = state[STATE_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo = playableLo & ~aboveBit;
      else state[STATE_PLAYABLE_HI] = state[STATE_PLAYABLE_HI] & ~aboveBit;
    }

    state[STATE_PLAYABLE_LO] = playableLo | bit;
  } else {
    state[STATE_SUPPORT_HI] = state[STATE_SUPPORT_HI] & ~bit;
    let playableHi = state[STATE_PLAYABLE_HI];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      playableHi = playableHi & ~aboveBit;
    }

    state[STATE_PLAYABLE_HI] = playableHi | bit;
  }
  return cell;
}
