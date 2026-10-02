export function and2x32Into(dst, di, a0, a1, b0, b1) {
  dst[di] = a0 & b0;
  dst[di + 1] = a1 & b1;
  return dst;
}

export function or2x32Into(dst, di, a0, a1, b0, b1) {
  dst[di] = a0 | b0;
  dst[di + 1] = a1 | b1;
  return dst;
}

export function xor2x32Into(dst, di, a0, a1, b0, b1) {
  dst[di] = a0 ^ b0;
  dst[di + 1] = a1 ^ b1;
  return dst;
}

export function zero2x32(a0, a1) {
  return (a0 | a1) === 0;
}

export function equal2x32(a0, a1, b0, b1) {
  return a0 === b0 && a1 === b1;
}

export function shl2x32Lt32Into(dst, di, lo, hi, count) {
  dst[di] = lo << count;
  dst[di + 1] = (hi << count) | (lo >>> (32 - count));
  return dst;
}

export function shl2x32Ge32Into(dst, di, lo, count) {
  dst[di] = 0;
  dst[di + 1] = lo << (count - 32);
  return dst;
}

export function ushr2x32Lt32Into(dst, di, lo, hi, count) {
  dst[di] = (lo >>> count) | (hi << (32 - count));
  dst[di + 1] = hi >>> count;
  return dst;
}

export function ushr2x32Ge32Into(dst, di, hi, count) {
  dst[di] = hi >>> (count - 32);
  dst[di + 1] = 0;
  return dst;
}

export function shl2x32Lt32PreparedInto(dst, di, lo, hi, count, inverseCount) {
  dst[di] = lo << count;
  dst[di + 1] = (hi << count) | (lo >>> inverseCount);
  return dst;
}

export function shl2x32Ge32PreparedInto(dst, di, lo, laneCount) {
  dst[di] = 0;
  dst[di + 1] = lo << laneCount;
  return dst;
}

export function ushr2x32Lt32PreparedInto(dst, di, lo, hi, count, inverseCount) {
  dst[di] = (lo >>> count) | (hi << inverseCount);
  dst[di + 1] = hi >>> count;
  return dst;
}

export function ushr2x32Ge32PreparedInto(dst, di, hi, laneCount) {
  dst[di] = hi >>> laneCount;
  dst[di + 1] = 0;
  return dst;
}

export function shl2x32Into(dst, di, lo, hi, count) {
  if (count < 32) {
    dst[di] = lo << count;
    dst[di + 1] = (hi << count) | (lo >>> (32 - count));
    return dst;
  }
  dst[di] = 0;
  dst[di + 1] = lo << (count - 32);
  return dst;
}

export function ushr2x32Into(dst, di, lo, hi, count) {
  if (count < 32) {
    dst[di] = (lo >>> count) | (hi << (32 - count));
    dst[di + 1] = hi >>> count;
    return dst;
  }
  dst[di] = hi >>> (count - 32);
  dst[di + 1] = 0;
  return dst;
}

export function add2x32Into(dst, di, a0, a1, b0, b1) {
  const lo = a0 + b0;
  const carry = lo > 0xffffffff ? 1 : 0;
  dst[di] = lo;
  dst[di + 1] = a1 + b1 + carry;
  return dst;
}

export function sub2x32Into(dst, di, a0, a1, b0, b1) {
  const borrow = a0 < b0 ? 1 : 0;
  dst[di] = a0 - b0;
  dst[di + 1] = a1 - b1 - borrow;
  return dst;
}

export function firstSetBitIndex2x32(lo, hi) {
  if (lo !== 0) return 31 - Math.clz32(lo & -lo);
  return 63 - Math.clz32(hi & -hi);
}

export function clearIsolatedBitI32(word, bit) {
  return word ^ bit;
}

export function clearIsolatedBit32(word, bit) {
  return (word ^ bit) >>> 0;
}

export function clearLowestSetBitI32(word) {
  return word & (word - 1);
}

export function clearLowestSetBit32(word) {
  return (word & (word - 1)) >>> 0;
}

export function cardinalityClass2x32(lo, hi) {
  if (lo === 0) {
    if (hi === 0) return 0;
    return (hi & (hi - 1)) === 0 ? 1 : 2;
  }
  if (hi !== 0) return 2;
  return (lo & (lo - 1)) === 0 ? 1 : 2;
}

export function popcount2x32SparseHigh(lo, hi) {
  if (hi === 0) {
    let x = lo;
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = (x + (x >>> 4)) & 0x0f0f0f0f;
    return Math.imul(x, 0x01010101) >>> 24;
  }

  let a = lo;
  a = a - ((a >>> 1) & 0x55555555);
  a = (a & 0x33333333) + ((a >>> 2) & 0x33333333);

  let b = hi;
  b = b - ((b >>> 1) & 0x55555555);
  b = (b & 0x33333333) + ((b >>> 2) & 0x33333333);

  const nibbles = a + b;
  const bytes = (nibbles & 0x0f0f0f0f)
    + ((nibbles >>> 4) & 0x0f0f0f0f);
  return Math.imul(bytes, 0x01010101) >>> 24;
}

export function popcount2x32(lo, hi) {
  let a = lo;
  a = a - ((a >>> 1) & 0x55555555);
  a = (a & 0x33333333) + ((a >>> 2) & 0x33333333);

  let b = hi;
  b = b - ((b >>> 1) & 0x55555555);
  b = (b & 0x33333333) + ((b >>> 2) & 0x33333333);

  const nibbles = a + b;
  const bytes = (nibbles & 0x0f0f0f0f)
    + ((nibbles >>> 4) & 0x0f0f0f0f);
  return Math.imul(bytes, 0x01010101) >>> 24;
}

export function popcount3x32(lo, mid, hi) {
  let a = lo;
  a = a - ((a >>> 1) & 0x55555555);
  a = (a & 0x33333333) + ((a >>> 2) & 0x33333333);

  let b = mid;
  b = b - ((b >>> 1) & 0x55555555);
  b = (b & 0x33333333) + ((b >>> 2) & 0x33333333);

  let c = hi;
  c = c - ((c >>> 1) & 0x55555555);
  c = (c & 0x33333333) + ((c >>> 2) & 0x33333333);

  const nibbles = a + b + c;
  const bytes = (nibbles & 0x0f0f0f0f)
    + ((nibbles >>> 4) & 0x0f0f0f0f);
  return Math.imul(bytes, 0x01010101) >>> 24;
}

export function fillPopcount10Table32(table) {
  table[0] = 0;
  for (let value = 1; value < 1024; value += 1) {
    table[value] = table[value >>> 1] + (value & 1);
  }
  return 1024;
}

export function popcount2x32High10Sparse(lo, hi, table) {
  let x = lo;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  const lowCount = Math.imul(x, 0x01010101) >>> 24;

  if (hi === 0) return lowCount;
  return lowCount + table[hi];
}

export function popcount2x32High10Table(lo, hi, table) {
  let x = lo;
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return (Math.imul(x, 0x01010101) >>> 24) + table[hi];
}

export function popcount2x32SparseBits(lo, hi) {
  let count = 0;
  while (lo !== 0) {
    lo = lo & (lo - 1);
    count += 1;
  }
  while (hi !== 0) {
    hi = hi & (hi - 1);
    count += 1;
  }
  return count;
}

