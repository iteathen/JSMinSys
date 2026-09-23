export function fillLandingCells32(landingCells, columns) {
  for (let column = 0; column < columns; column += 1) landingCells[column] = column;
  return columns;
}

export function landingCell32(landingCells, column) {
  return landingCells[column];
}

export function maskContains32(owned, required) {
  return ((owned & required) ^ required) === 0;
}

export function maskContains2x32(owned0, owned1, required0, required1) {
  return ((owned0 & required0) ^ required0) === 0
    && ((owned1 & required1) ^ required1) === 0;
}

export function residualTransition32(table, classIndex, actionIndex, actionCount) {
  return table[classIndex * actionCount + actionIndex];
}

export function powerOfTwoIndex32(hash, capacityMask) {
  return hash & capacityMask;
}

export function ttProbeIndex32(tags, capacityMask, hash, tag, missIndex) {
  const index = hash & capacityMask;
  return tags[index] === tag ? index : missIndex;
}

export function ttReplace32(tags, values, index, tag, value) {
  tags[index] = tag;
  values[index] = value;
  return index;
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

export function decodeColumn32(columnByCell, cell) {
  return columnByCell[cell];
}

export function decodeRow32(rowByCell, cell) {
  return rowByCell[cell];
}
