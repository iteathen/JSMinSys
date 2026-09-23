export function allocateTypedCapacity(length) {
  return new Uint32Array(length);
}

export function isPowerOfTwo32(value) {
  return value > 0 && (value & (value - 1)) === 0;
}

export function nextPowerOfTwo32(value) {
  let result = 1;
  while (result < value) result <<= 1;
  return result >>> 0;
}

export function rehashOverwrite32(
  oldHashes,
  oldValues,
  length,
  newHashes,
  newValues,
  newMask,
  emptyHash,
) {
  for (let index = 0; index < length; index += 1) {
    const hash = oldHashes[index];
    if (hash === emptyHash) continue;
    const target = hash & newMask;
    newHashes[target] = hash;
    newValues[target] = oldValues[index];
  }
  return newMask + 1;
}
