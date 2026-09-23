export const STATE_PLY = 0;
export const STATE_SIDE = 1;
export const STATE_SUPPORT_LO = 2;
export const STATE_SUPPORT_HI = 3;
export const STATE_PLAYABLE_LO = 4;
export const STATE_PLAYABLE_HI = 5;
export const STATE_SUPPORT_CODE = 6;

const COLUMNS = 7;
const LAST_NONFULL_ROW = 4;
const RANK_INCREMENT = 1 << 21;

export function applyMove32(
  state,
  heights,
  moveColumns,
  column,
) {
  const ply = state[STATE_PLY];
  const row = heights[column];
  const cell = (row << 3) - row + column;
  const bit = (1 << cell) >>> 0;

  if (cell < 32) {
    state[STATE_SUPPORT_LO] = (state[STATE_SUPPORT_LO] | bit) >>> 0;
    let playableLo = (state[STATE_PLAYABLE_LO] & ~bit) >>> 0;

    const above = cell + COLUMNS;
    const aboveBit = (1 << above) >>> 0;
    if (above < 32) playableLo = (playableLo | aboveBit) >>> 0;
    else state[STATE_PLAYABLE_HI] = (state[STATE_PLAYABLE_HI] | aboveBit) >>> 0;

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    state[STATE_SUPPORT_HI] = (state[STATE_SUPPORT_HI] | bit) >>> 0;
    let playableHi = (state[STATE_PLAYABLE_HI] & ~bit) >>> 0;

    if (row <= LAST_NONFULL_ROW) {
      const aboveBit = (1 << (cell + COLUMNS)) >>> 0;
      playableHi = (playableHi | aboveBit) >>> 0;
    }

    state[STATE_PLAYABLE_HI] = playableHi;
  }

  heights[column] = row + 1;
  moveColumns[ply] = column;
  state[STATE_PLY] = ply + 1;
  state[STATE_SIDE] = 1 - state[STATE_SIDE];
  const supportShift = (column << 1) + column;
  state[STATE_SUPPORT_CODE] = (
    state[STATE_SUPPORT_CODE]
    + (1 << supportShift)
    + RANK_INCREMENT
  ) >>> 0;
  return cell;
}

export function undoMove32(
  state,
  heights,
  moveColumns,
) {
  const ply = state[STATE_PLY] - 1;
  const column = moveColumns[ply];
  const row = heights[column] - 1;
  const cell = (row << 3) - row + column;
  const bit = (1 << cell) >>> 0;

  state[STATE_PLY] = ply;
  state[STATE_SIDE] = 1 - state[STATE_SIDE];
  heights[column] = row;
  const supportShift = (column << 1) + column;
  state[STATE_SUPPORT_CODE] = (
    state[STATE_SUPPORT_CODE]
    - (1 << supportShift)
    - RANK_INCREMENT
  ) >>> 0;

  if (cell < 32) {
    state[STATE_SUPPORT_LO] = (state[STATE_SUPPORT_LO] & ~bit) >>> 0;
    let playableLo = state[STATE_PLAYABLE_LO];

    const above = cell + COLUMNS;
    const aboveBit = (1 << above) >>> 0;
    if (above < 32) playableLo = (playableLo & ~aboveBit) >>> 0;
    else state[STATE_PLAYABLE_HI] = (state[STATE_PLAYABLE_HI] & ~aboveBit) >>> 0;

    state[STATE_PLAYABLE_LO] = (playableLo | bit) >>> 0;
  } else {
    state[STATE_SUPPORT_HI] = (state[STATE_SUPPORT_HI] & ~bit) >>> 0;
    let playableHi = state[STATE_PLAYABLE_HI];

    if (row <= LAST_NONFULL_ROW) {
      const aboveBit = (1 << (cell + COLUMNS)) >>> 0;
      playableHi = (playableHi & ~aboveBit) >>> 0;
    }

    state[STATE_PLAYABLE_HI] = (playableHi | bit) >>> 0;
  }
  return cell;
}
