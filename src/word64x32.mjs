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
  a = (a + (a >>> 4)) & 0x0f0f0f0f;
  const ac = Math.imul(a, 0x01010101) >>> 24;

  let b = hi;
  b = b - ((b >>> 1) & 0x55555555);
  b = (b & 0x33333333) + ((b >>> 2) & 0x33333333);
  b = (b + (b >>> 4)) & 0x0f0f0f0f;
  return ac + (Math.imul(b, 0x01010101) >>> 24);
}

export function popcount2x32(lo, hi) {
  let a = lo;
  a = a - ((a >>> 1) & 0x55555555);
  a = (a & 0x33333333) + ((a >>> 2) & 0x33333333);
  a = (a + (a >>> 4)) & 0x0f0f0f0f;
  const ac = Math.imul(a, 0x01010101) >>> 24;

  let b = hi;
  b = b - ((b >>> 1) & 0x55555555);
  b = (b & 0x33333333) + ((b >>> 2) & 0x33333333);
  b = (b + (b >>> 4)) & 0x0f0f0f0f;
  return ac + (Math.imul(b, 0x01010101) >>> 24);
}
