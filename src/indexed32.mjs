export function fillLandingCells32(landingCells, columns) {
  for (let column = 0; column < columns; column += 1) landingCells[column] = column;
  return columns;
}

export function fillLandingCellsByOrder32(landingCells, order, columns) {
  for (let slot = 0; slot < columns; slot += 1) landingCells[slot] = order[slot];
  return columns;
}

export function landingCell32(landingCells, column) {
  return landingCells[column];
}

export function heightFromPacked3Support32(supportCode, fieldShift) {
  return (supportCode >>> fieldShift) & 7;
}

export function landingCellFromPacked3Support32(
  supportCode,
  fieldShift,
  columns,
  column,
) {
  return Math.imul((supportCode >>> fieldShift) & 7, columns) + column;
}


export function maskContainsI32(owned, required) {
  return (owned & required) === required;
}

export function maskContains2xI32(owned0, owned1, required0, required1) {
  return (owned0 & required0) === required0
    && (owned1 & required1) === required1;
}

export function maskContains32(owned, required) {
  return ((owned & required) ^ required) === 0;
}

export function maskContains2x32(owned0, owned1, required0, required1) {
  return ((owned0 & required0) ^ required0) === 0
    && ((owned1 & required1) ^ required1) === 0;
}

export function residualBase32(classIndex, actionCount) {
  return classIndex * actionCount;
}

export function residualTransition32(table, classBase, actionIndex) {
  return table[classBase + actionIndex];
}

export function fillResidualActionMajor32(
  destination,
  classMajor,
  classCount,
  actionCount,
) {
  let out = 0;
  for (let action = 0; action < actionCount; action += 1) {
    let sourceIndex = action;
    for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
      destination[out] = classMajor[sourceIndex];
      out += 1;
      sourceIndex += actionCount;
    }
  }
}

export function residualActionBase32(actionIndex, classCount) {
  return actionIndex * classCount;
}

export function residualTransitionActionMajor32(table, actionBase, classIndex) {
  return table[actionBase + classIndex];
}

export function powerOfTwoIndex32(hash, capacityMask) {
  return hash & capacityMask;
}

export function ttHit32(tags, index, tag) {
  return tags[index] === tag;
}

export function ttReplace32(tags, values, index, tag, value) {
  tags[index] = tag;
  values[index] = value;
  return index;
}

export function ttUpdateValue32(values, index, value) {
  values[index] = value;
  return index;
}

export function fillI32Sentinel32(storage, count, sentinel) {
  for (let index = 0; index < count; index += 1) storage[index] = sentinel;
  return count;
}

export function probe3x32SentinelSlot32(
  key0s,
  key1s,
  key2s,
  capacityMask,
  start,
  key0,
  key1,
  key2,
  emptyKey0,
) {
  let slot = start;
  for (;;) {
    const stored0 = key0s[slot];
    if (stored0 === emptyKey0) return ~slot;
    if (stored0 === key0
        && key1s[slot] === key1
        && key2s[slot] === key2) return slot;
    slot = (slot + 1) & capacityMask;
  }
}

export function probe2x32IdSlot32(
  hashSlots,
  words,
  capacityMask,
  start,
  key0,
  key1,
  emptyId,
) {
  let slot = start;
  for (;;) {
    const id = hashSlots[slot];
    if (id === emptyId) return ~slot;
    const base = id << 1;
    if (words[base] === key0
        && words[base + 1] === key1) return id;
    slot = (slot + 1) & capacityMask;
  }
}

export function publish2x32IdSlot32(
  words,
  hashSlots,
  slot,
  id,
  key0,
  key1,
) {
  const base = id << 1;
  words[base] = key0;
  words[base + 1] = key1;
  hashSlots[slot] = id;
  return id;
}

export function selectGreater32(a, b) {
  return a >= b ? a : b;
}

export function selectLess32(a, b) {
  return a <= b ? a : b;
}

export function playableColumn32(landingCells, column, cellCount) {
  return landingCells[column] < cellCount;
}

export function playableKnownCell32(cell, cellCount) {
  return cell < cellCount;
}


export function fillCoordinateTables32(rowByCell, columnByCell, columns, rows) {
  let cell = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      rowByCell[cell] = row;
      columnByCell[cell] = column;
      cell += 1;
    }
  }
  return cell;
}

export function decodeColumnPowerOfTwo32(cell, columnMask) {
  return cell & columnMask;
}

export function decodeRowPowerOfTwo32(cell, columnShift) {
  return cell >>> columnShift;
}

export function decodeColumn32(columnByCell, cell) {
  return columnByCell[cell];
}

export function decodeRow32(rowByCell, cell) {
  return rowByCell[cell];
}
