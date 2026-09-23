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
  return word === 0 ? 32 : 31 - Math.clz32(word & -word);
}

export function popcount32(word) {
  let x = word >>> 0;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}

export function subset32(a, b) {
  return (a & ~b) === 0;
}
