export const STATE_PLY = 0;
export const STATE_PLAYABLE_LO = 1;
export const STATE_PLAYABLE_HI = 2;
export const STATE_SUPPORT_CODE = 3;

export const CALLER_PLY1_PLAYABLE_LO = 0;
export const CALLER_PLY1_SUPPORT_CODE = 1;
export const CALLER_PLY2_PLAYABLE_LO = 0;
export const CALLER_PLY2_PLAYABLE_HI = 1;
export const CALLER_PLY2_SUPPORT_CODE = 2;

export function sideFromPly32(ply) {
  return ply & 1;
}

/**
 * Dynamic-geometry transition for boards whose cell mask fits two uint32 lanes.
 *
 * Geometry is selected during initialization and then invariant:
 * - columns: configured board width
 * - cellCount: configured columns * rows
 * - supportDelta: precomputed change to the configured support encoding for
 *   this column. Rank/ply is represented separately by STATE_PLY.
 *
 * landingCells[index] stores the next playable physical cell for the selected
 * transition index. The index may be a physical column or an initialization-
 * configured move slot when all move-indexed data is aligned to that slot order.
 */
export function applyMove1x32(
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
  let playable = state[STATE_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[STATE_PLAYABLE_LO] = playable;
  landingCells[column] = next;
  state[STATE_PLY] = ply + 1;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function undoMove1x32(
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
  let playable = state[STATE_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[STATE_PLY] = ply;
  state[STATE_PLAYABLE_LO] = playable;
  landingCells[column] = cell;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] - supportDelta;
  return cell;
}

/**
 * One-lane transition profile for integrations that already own ply/rank as a
 * live caller scalar. This primitive deliberately does not load, store, or
 * advance ply. Select it only when doing so deletes duplicate state work rather
 * than moving the same work into caller-maintained state.
 */
export function applyMove1x32CallerPly(
  state,
  landingCells,
  column,
  columns,
  cellCount,
  supportDelta,
) {
  const cell = landingCells[column];
  const bit = 1 << cell;
  const next = cell + columns;
  let playable = state[CALLER_PLY1_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[CALLER_PLY1_PLAYABLE_LO] = playable;
  landingCells[column] = next;
  state[CALLER_PLY1_SUPPORT_CODE] = state[CALLER_PLY1_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function undoMove1x32CallerPly(
  state,
  landingCells,
  column,
  columns,
  cellCount,
  supportDelta,
) {
  const next = landingCells[column];
  const cell = next - columns;
  const bit = 1 << cell;
  let playable = state[CALLER_PLY1_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[CALLER_PLY1_PLAYABLE_LO] = playable;
  landingCells[column] = cell;
  state[CALLER_PLY1_SUPPORT_CODE] = state[CALLER_PLY1_SUPPORT_CODE] - supportDelta;
  return cell;
}

/**
 * Two-lane dynamic-geometry transition for configured boards with 33..64 cells.
 *
 * Initialization should select applyMove1x32/undoMove1x32 instead when the
 * configured board fits one uint32 lane; no per-move profile dispatch is needed.
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
    let playableLo = state[STATE_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[STATE_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[STATE_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

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
    let playableLo = state[STATE_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[STATE_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[STATE_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[STATE_PLAYABLE_HI] = playableHi;
  }
  return cell;
}

/**
 * Two-lane transition profile for integrations that already own ply/rank as a
 * live caller scalar. State stores only playable lanes plus support code.
 */
export function applyMove32CallerPly(
  state,
  landingCells,
  column,
  columns,
  cellCount,
  supportDelta,
) {
  const cell = landingCells[column];
  const bit = 1 << cell;
  const next = cell + columns;

  if (cell < 32) {
    let playableLo = state[CALLER_PLY2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[CALLER_PLY2_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[CALLER_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[CALLER_PLY2_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[CALLER_PLY2_PLAYABLE_HI] = playableHi;
  }

  landingCells[column] = next;
  state[CALLER_PLY2_SUPPORT_CODE] = state[CALLER_PLY2_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function undoMove32CallerPly(
  state,
  landingCells,
  column,
  columns,
  cellCount,
  supportDelta,
) {
  const next = landingCells[column];
  const cell = next - columns;
  const bit = 1 << cell;

  landingCells[column] = cell;
  state[CALLER_PLY2_SUPPORT_CODE] = state[CALLER_PLY2_SUPPORT_CODE] - supportDelta;

  if (cell < 32) {
    let playableLo = state[CALLER_PLY2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[CALLER_PLY2_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[CALLER_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[CALLER_PLY2_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[CALLER_PLY2_PLAYABLE_HI] = playableHi;
  }
  return cell;
}

/**
 * Apply profiles for callers that already hold the exact current landing cell
 * for an independent legality, tactical, or proof-facing reason. These
 * primitives do not reload landingCells[index]; they still advance the
 * maintained landing cell for later legality and undo.
 */
export function applyMove1x32KnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  supportDelta,
) {
  const ply = state[STATE_PLY];
  const bit = 1 << cell;
  const next = cell + columns;
  let playable = state[STATE_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[STATE_PLAYABLE_LO] = playable;
  landingCells[index] = next;
  state[STATE_PLY] = ply + 1;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function applyMove1x32CallerPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  supportDelta,
) {
  const bit = 1 << cell;
  const next = cell + columns;
  let playable = state[CALLER_PLY1_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[CALLER_PLY1_PLAYABLE_LO] = playable;
  landingCells[index] = next;
  state[CALLER_PLY1_SUPPORT_CODE] = state[CALLER_PLY1_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function applyMove32KnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  supportDelta,
) {
  const ply = state[STATE_PLY];
  const bit = 1 << cell;
  const next = cell + columns;

  if (cell < 32) {
    let playableLo = state[STATE_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[STATE_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[STATE_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[STATE_PLAYABLE_HI] = playableHi;
  }

  landingCells[index] = next;
  state[STATE_PLY] = ply + 1;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] + supportDelta;
  return cell;
}

export function applyMove32CallerPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  supportDelta,
) {
  const bit = 1 << cell;
  const next = cell + columns;

  if (cell < 32) {
    let playableLo = state[CALLER_PLY2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[CALLER_PLY2_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[CALLER_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[CALLER_PLY2_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[CALLER_PLY2_PLAYABLE_HI] = playableHi;
  }

  landingCells[index] = next;
  state[CALLER_PLY2_SUPPORT_CODE] = state[CALLER_PLY2_SUPPORT_CODE] + supportDelta;
  return cell;
}

/**
 * Undo profiles for callers that retain the exact played cell returned by the
 * paired apply across recursive work. They do not reload landingCells[index]
 * to rediscover that cell; landingCells is still restored for later legality.
 */
export function undoMove1x32KnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  supportDelta,
) {
  const ply = state[STATE_PLY] - 1;
  const bit = 1 << cell;
  let playable = state[STATE_PLAYABLE_LO];

  if (cell < lastRowStart) playable ^= bit | (bit << columns);
  else playable ^= bit;

  state[STATE_PLY] = ply;
  state[STATE_PLAYABLE_LO] = playable;
  landingCells[index] = cell;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] - supportDelta;
  return cell;
}

export function undoMove1x32CallerPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  supportDelta,
) {
  const bit = 1 << cell;
  let playable = state[CALLER_PLY1_PLAYABLE_LO];

  if (cell < lastRowStart) playable ^= bit | (bit << columns);
  else playable ^= bit;

  state[CALLER_PLY1_PLAYABLE_LO] = playable;
  landingCells[index] = cell;
  state[CALLER_PLY1_SUPPORT_CODE] = state[CALLER_PLY1_SUPPORT_CODE] - supportDelta;
  return cell;
}

export function undoMove32KnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  lowLaneAboveLimit,
  supportDelta,
) {
  const ply = state[STATE_PLY] - 1;
  const bit = 1 << cell;

  state[STATE_PLY] = ply;
  landingCells[index] = cell;
  state[STATE_SUPPORT_CODE] = state[STATE_SUPPORT_CODE] - supportDelta;

  if (cell < 32) {
    let playableLo = state[STATE_PLAYABLE_LO];

    if (cell < lastRowStart) {
      if (cell < lowLaneAboveLimit) playableLo ^= bit | (bit << columns);
      else {
        playableLo ^= bit;
        state[STATE_PLAYABLE_HI] ^= bit >>> lowLaneAboveLimit;
      }
    } else {
      playableLo ^= bit;
    }

    state[STATE_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[STATE_PLAYABLE_HI];

    if (cell < lastRowStart) playableHi ^= bit | (bit << columns);
    else playableHi ^= bit;

    state[STATE_PLAYABLE_HI] = playableHi;
  }
  return cell;
}

export function undoMove32CallerPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  lowLaneAboveLimit,
  supportDelta,
) {
  const bit = 1 << cell;

  landingCells[index] = cell;
  state[CALLER_PLY2_SUPPORT_CODE] = state[CALLER_PLY2_SUPPORT_CODE] - supportDelta;

  if (cell < 32) {
    let playableLo = state[CALLER_PLY2_PLAYABLE_LO];

    if (cell < lastRowStart) {
      if (cell < lowLaneAboveLimit) playableLo ^= bit | (bit << columns);
      else {
        playableLo ^= bit;
        state[CALLER_PLY2_PLAYABLE_HI] ^= bit >>> lowLaneAboveLimit;
      }
    } else {
      playableLo ^= bit;
    }

    state[CALLER_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[CALLER_PLY2_PLAYABLE_HI];

    if (cell < lastRowStart) playableHi ^= bit | (bit << columns);
    else playableHi ^= bit;

    state[CALLER_PLY2_PLAYABLE_HI] = playableHi;
  }
  return cell;
}

export const PACKED_PLY1_PLAYABLE_LO = 0;
export const PACKED_PLY1_SUPPORT_PLY = 1;
export const PACKED_PLY2_PLAYABLE_LO = 0;
export const PACKED_PLY2_PLAYABLE_HI = 1;
export const PACKED_PLY2_SUPPORT_PLY = 2;

export function plyFromPackedSupport32(code, rankShift) {
  return code >>> rankShift;
}

export function supportFromPackedSupport32(code, supportMask) {
  return code & supportMask;
}

export function sideFromPackedSupport32(code, rankShift) {
  return (code >>> rankShift) & 1;
}

export function plyFromPackedRankLow32(code, rankMask) {
  return code & rankMask;
}

export function supportFromPackedRankLow32(code, rankBits) {
  return code >>> rankBits;
}

export function sideFromPackedRankLow32(code) {
  return code & 1;
}

export function applyMove1x32PackedPly(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  combinedDelta,
) {
  const cell = landingCells[index];
  const bit = 1 << cell;
  const next = cell + columns;
  let playable = state[PACKED_PLY1_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[PACKED_PLY1_PLAYABLE_LO] = playable;
  landingCells[index] = next;
  state[PACKED_PLY1_SUPPORT_PLY] = state[PACKED_PLY1_SUPPORT_PLY] + combinedDelta;
  return cell;
}

export function undoMove1x32PackedPly(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  combinedDelta,
) {
  const next = landingCells[index];
  const cell = next - columns;
  const bit = 1 << cell;
  let playable = state[PACKED_PLY1_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[PACKED_PLY1_PLAYABLE_LO] = playable;
  landingCells[index] = cell;
  state[PACKED_PLY1_SUPPORT_PLY] = state[PACKED_PLY1_SUPPORT_PLY] - combinedDelta;
  return cell;
}

export function applyMove32PackedPly(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  combinedDelta,
) {
  const cell = landingCells[index];
  const bit = 1 << cell;
  const next = cell + columns;

  if (cell < 32) {
    let playableLo = state[PACKED_PLY2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[PACKED_PLY2_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[PACKED_PLY2_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[PACKED_PLY2_PLAYABLE_HI] = playableHi;
  }

  landingCells[index] = next;
  state[PACKED_PLY2_SUPPORT_PLY] = state[PACKED_PLY2_SUPPORT_PLY] + combinedDelta;
  return cell;
}

export function undoMove32PackedPly(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  combinedDelta,
) {
  const next = landingCells[index];
  const cell = next - columns;
  const bit = 1 << cell;

  landingCells[index] = cell;
  state[PACKED_PLY2_SUPPORT_PLY] = state[PACKED_PLY2_SUPPORT_PLY] - combinedDelta;

  if (cell < 32) {
    let playableLo = state[PACKED_PLY2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[PACKED_PLY2_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[PACKED_PLY2_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[PACKED_PLY2_PLAYABLE_HI] = playableHi;
  }
  return cell;
}

export function applyMove1x32PackedPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  combinedDelta,
) {
  const bit = 1 << cell;
  const next = cell + columns;
  let playable = state[PACKED_PLY1_PLAYABLE_LO];

  if (next < cellCount) playable ^= bit | (1 << next);
  else playable ^= bit;

  state[PACKED_PLY1_PLAYABLE_LO] = playable;
  landingCells[index] = next;
  state[PACKED_PLY1_SUPPORT_PLY] = state[PACKED_PLY1_SUPPORT_PLY] + combinedDelta;
  return cell;
}

export function undoMove1x32PackedPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  combinedDelta,
) {
  const bit = 1 << cell;
  let playable = state[PACKED_PLY1_PLAYABLE_LO];

  if (cell < lastRowStart) playable ^= bit | (bit << columns);
  else playable ^= bit;

  state[PACKED_PLY1_PLAYABLE_LO] = playable;
  landingCells[index] = cell;
  state[PACKED_PLY1_SUPPORT_PLY] = state[PACKED_PLY1_SUPPORT_PLY] - combinedDelta;
  return cell;
}

export function applyMove32PackedPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  combinedDelta,
) {
  const bit = 1 << cell;
  const next = cell + columns;

  if (cell < 32) {
    let playableLo = state[PACKED_PLY2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        state[PACKED_PLY2_PLAYABLE_HI] ^= aboveBit;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[PACKED_PLY2_PLAYABLE_HI];

    if (next < cellCount) playableHi ^= bit | (1 << next);
    else playableHi ^= bit;

    state[PACKED_PLY2_PLAYABLE_HI] = playableHi;
  }

  landingCells[index] = next;
  state[PACKED_PLY2_SUPPORT_PLY] = state[PACKED_PLY2_SUPPORT_PLY] + combinedDelta;
  return cell;
}

export function undoMove32PackedPlyKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  lowLaneAboveLimit,
  combinedDelta,
) {
  const bit = 1 << cell;

  landingCells[index] = cell;
  state[PACKED_PLY2_SUPPORT_PLY] = state[PACKED_PLY2_SUPPORT_PLY] - combinedDelta;

  if (cell < 32) {
    let playableLo = state[PACKED_PLY2_PLAYABLE_LO];

    if (cell < lastRowStart) {
      if (cell < lowLaneAboveLimit) playableLo ^= bit | (bit << columns);
      else {
        playableLo ^= bit;
        state[PACKED_PLY2_PLAYABLE_HI] ^= bit >>> lowLaneAboveLimit;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_PLY2_PLAYABLE_LO] = playableLo;
  } else {
    let playableHi = state[PACKED_PLY2_PLAYABLE_HI];

    if (cell < lastRowStart) playableHi ^= bit | (bit << columns);
    else playableHi ^= bit;

    state[PACKED_PLY2_PLAYABLE_HI] = playableHi;
  }
  return cell;
}

export const PACKED_META2_PLAYABLE_LO = 0;
export const PACKED_META2_META = 1;

export function supportFromPackedMeta32(code, supportShift) {
  return code >>> supportShift;
}

export function playableHighFromPackedMeta32(code, rankBits, highMask) {
  return (code >>> rankBits) & highMask;
}

export function applyMove32PackedMeta(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  rankBits,
  combinedDelta,
) {
  const cell = landingCells[index];
  const bit = 1 << cell;
  const next = cell + columns;
  let meta = state[PACKED_META2_META];

  if (cell < 32) {
    let playableLo = state[PACKED_META2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        meta ^= aboveBit << rankBits;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_META2_PLAYABLE_LO] = playableLo;
  } else {
    let toggle = bit;
    if (next < cellCount) toggle |= 1 << next;
    meta ^= toggle << rankBits;
  }

  landingCells[index] = next;
  state[PACKED_META2_META] = meta + combinedDelta;
  return cell;
}

export function undoMove32PackedMeta(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  rankBits,
  combinedDelta,
) {
  const next = landingCells[index];
  const cell = next - columns;
  const bit = 1 << cell;
  let meta = state[PACKED_META2_META];

  landingCells[index] = cell;

  if (cell < 32) {
    let playableLo = state[PACKED_META2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        meta ^= aboveBit << rankBits;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_META2_PLAYABLE_LO] = playableLo;
  } else {
    let toggle = bit;
    if (next < cellCount) toggle |= 1 << next;
    meta ^= toggle << rankBits;
  }

  state[PACKED_META2_META] = meta - combinedDelta;
  return cell;
}

export function applyMove32PackedMetaKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  rankBits,
  combinedDelta,
) {
  const bit = 1 << cell;
  const next = cell + columns;
  let meta = state[PACKED_META2_META];

  if (cell < 32) {
    let playableLo = state[PACKED_META2_PLAYABLE_LO];

    if (next < cellCount) {
      const aboveBit = 1 << next;
      if (next < 32) playableLo ^= bit | aboveBit;
      else {
        playableLo ^= bit;
        meta ^= aboveBit << rankBits;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_META2_PLAYABLE_LO] = playableLo;
  } else {
    let toggle = bit;
    if (next < cellCount) toggle |= 1 << next;
    meta ^= toggle << rankBits;
  }

  landingCells[index] = next;
  state[PACKED_META2_META] = meta + combinedDelta;
  return cell;
}

export function undoMove32PackedMetaKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  lowLaneAboveLimit,
  rankBits,
  combinedDelta,
) {
  const bit = 1 << cell;
  let meta = state[PACKED_META2_META];

  landingCells[index] = cell;

  if (cell < 32) {
    let playableLo = state[PACKED_META2_PLAYABLE_LO];

    if (cell < lastRowStart) {
      if (cell < lowLaneAboveLimit) playableLo ^= bit | (bit << columns);
      else {
        playableLo ^= bit;
        meta ^= (bit >>> lowLaneAboveLimit) << rankBits;
      }
    } else {
      playableLo ^= bit;
    }

    state[PACKED_META2_PLAYABLE_LO] = playableLo;
  } else {
    let toggle = bit;
    if (cell < lastRowStart) toggle |= bit << columns;
    meta ^= toggle << rankBits;
  }

  state[PACKED_META2_META] = meta - combinedDelta;
  return cell;
}

export const PACKED_ALL1_META = 0;

export function supportFromPackedAll32(code, supportShift) {
  return code >>> supportShift;
}

export function playableFromPackedAll32(code, rankBits, playableMask) {
  return (code >>> rankBits) & playableMask;
}

export function applyMove1x32PackedAll(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  rankBits,
  combinedDelta,
) {
  const cell = landingCells[index];
  const next = cell + columns;
  const bit = (1 << cell) << rankBits;
  let meta = state[PACKED_ALL1_META];

  if (next < cellCount) meta ^= bit | (bit << columns);
  else meta ^= bit;

  landingCells[index] = next;
  state[PACKED_ALL1_META] = meta + combinedDelta;
  return cell;
}

export function undoMove1x32PackedAll(
  state,
  landingCells,
  index,
  columns,
  cellCount,
  rankBits,
  combinedDelta,
) {
  const next = landingCells[index];
  const cell = next - columns;
  const bit = (1 << cell) << rankBits;
  let meta = state[PACKED_ALL1_META];

  if (next < cellCount) meta ^= bit | (bit << columns);
  else meta ^= bit;

  landingCells[index] = cell;
  state[PACKED_ALL1_META] = meta - combinedDelta;
  return cell;
}

export function applyMove1x32PackedAllKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  cellCount,
  rankBits,
  combinedDelta,
) {
  const next = cell + columns;
  const bit = (1 << cell) << rankBits;
  let meta = state[PACKED_ALL1_META];

  if (next < cellCount) meta ^= bit | (bit << columns);
  else meta ^= bit;

  landingCells[index] = next;
  state[PACKED_ALL1_META] = meta + combinedDelta;
  return cell;
}

export function undoMove1x32PackedAllKnownCell(
  state,
  landingCells,
  index,
  cell,
  columns,
  lastRowStart,
  rankBits,
  combinedDelta,
) {
  const bit = (1 << cell) << rankBits;
  let meta = state[PACKED_ALL1_META];

  if (cell < lastRowStart) meta ^= bit | (bit << columns);
  else meta ^= bit;

  landingCells[index] = cell;
  state[PACKED_ALL1_META] = meta - combinedDelta;
  return cell;
}

