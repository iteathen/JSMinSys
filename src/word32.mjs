export function bitTest32(word, mask) {
  return (word & mask) !== 0;
}

export function bitSet32(word, mask) {
  return (word | mask) >>> 0;
}

export function bitClear32(word, mask) {
  return (word & ~mask) >>> 0;
}

export function bitToggle32(word, mask) {
  return (word ^ mask) >>> 0;
}

export function firstSetBitIndex32(word) {
  return 31 - Math.clz32(word & -word);
}

export function popcount32(word) {
  let x = word;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}

export function subset32(a, b) {
  return (a & ~b) === 0;
}


export function bitSetI32(word, mask) {
  return word | mask;
}

export function bitClearI32(word, mask) {
  return word & ~mask;
}

export function bitToggleI32(word, mask) {
  return word ^ mask;
}

export function cardinalityClass32(word) {
  if (word === 0) return 0;
  return (word & (word - 1)) === 0 ? 1 : 2;
}

export function isolatedBitIndex32(bit) {
  return 31 - Math.clz32(bit);
}

export function isolatedHighBitIndex32(bit) {
  return 63 - Math.clz32(bit);
}

