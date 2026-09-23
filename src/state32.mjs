export const STATE_PLY = 0;
export const STATE_SIDE = 1;
export const STATE_SUPPORT_LO = 2;
export const STATE_SUPPORT_HI = 3;
export const STATE_PLAYABLE_LO = 4;
export const STATE_PLAYABLE_HI = 5;
export const STATE_SUPPORT_CODE = 6;

export function applyMove32(
  state,
  heights,
  moveColumns,
  column,
  columns,
  rows,
  rankShift,
) {
  const ply = state[STATE_PLY];
  const row = heights[column];
  const cell = row * columns + column;
  let bitLo = 0;
  let bitHi = 0;
  if (cell < 32) bitLo = (1 << cell) >>> 0;
  else bitHi = (1 << (cell - 32)) >>> 0;

  state[STATE_SUPPORT_LO] = (state[STATE_SUPPORT_LO] | bitLo) >>> 0;
  state[STATE_SUPPORT_HI] = (state[STATE_SUPPORT_HI] | bitHi) >>> 0;
  let playableLo = (state[STATE_PLAYABLE_LO] & ~bitLo) >>> 0;
  let playableHi = (state[STATE_PLAYABLE_HI] & ~bitHi) >>> 0;

  if (row + 1 < rows) {
    const above = cell + columns;
    if (above < 32) playableLo = (playableLo | ((1 << above) >>> 0)) >>> 0;
    else playableHi = (playableHi | ((1 << (above - 32)) >>> 0)) >>> 0;
  }
  state[STATE_PLAYABLE_LO] = playableLo;
  state[STATE_PLAYABLE_HI] = playableHi;

  heights[column] = row + 1;
  moveColumns[ply] = column;
  state[STATE_PLY] = ply + 1;
  state[STATE_SIDE] = 1 - state[STATE_SIDE];
  state[STATE_SUPPORT_CODE] = (
    state[STATE_SUPPORT_CODE]
    + (1 << (column * 3))
    + (1 << rankShift)
  ) >>> 0;
  return cell;
}

export function undoMove32(
  state,
  heights,
  moveColumns,
  columns,
  rows,
  rankShift,
) {
  const ply = state[STATE_PLY] - 1;
  const column = moveColumns[ply];
  const row = heights[column] - 1;
  const cell = row * columns + column;
  let bitLo = 0;
  let bitHi = 0;
  if (cell < 32) bitLo = (1 << cell) >>> 0;
  else bitHi = (1 << (cell - 32)) >>> 0;

  state[STATE_PLY] = ply;
  state[STATE_SIDE] = 1 - state[STATE_SIDE];
  heights[column] = row;
  state[STATE_SUPPORT_CODE] = (
    state[STATE_SUPPORT_CODE]
    - (1 << (column * 3))
    - (1 << rankShift)
  ) >>> 0;

  state[STATE_SUPPORT_LO] = (state[STATE_SUPPORT_LO] & ~bitLo) >>> 0;
  state[STATE_SUPPORT_HI] = (state[STATE_SUPPORT_HI] & ~bitHi) >>> 0;

  let playableLo = state[STATE_PLAYABLE_LO];
  let playableHi = state[STATE_PLAYABLE_HI];
  if (row + 1 < rows) {
    const above = cell + columns;
    if (above < 32) playableLo = (playableLo & ~((1 << above) >>> 0)) >>> 0;
    else playableHi = (playableHi & ~((1 << (above - 32)) >>> 0)) >>> 0;
  }

  state[STATE_PLAYABLE_LO] = (playableLo | bitLo) >>> 0;
  state[STATE_PLAYABLE_HI] = (playableHi | bitHi) >>> 0;
  return cell;
}
