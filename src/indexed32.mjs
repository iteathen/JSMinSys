export function landingCell32(heights, column, columns, rows, invalidCell) {
  const row = heights[column];
  return row < rows ? row * columns + column : invalidCell;
}

export function maskContains32(owned, required) {
  return (owned & required) === required;
}

export function maskContains2x32(owned0, owned1, required0, required1) {
  return (owned0 & required0) === required0
    && (owned1 & required1) === required1;
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

export function playableColumn32(heights, column, rows) {
  return heights[column] < rows;
}

export function decodeColumn32(cell, columns) {
  return cell % columns;
}

export function decodeRow32(cell, columns) {
  return Math.floor(cell / columns);
}
