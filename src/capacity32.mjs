export function allocateTypedCapacity(length) {
  return new Uint32Array(length);
}

export function isPowerOfTwo32(value) {
  return (value & (value - 1)) === 0;
}

export function nextPowerOfTwo32(value) {
  return (1 << (32 - Math.clz32(value - 1))) >>> 0;
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
