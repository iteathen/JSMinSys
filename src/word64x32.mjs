export function and2x32Into(dst, di, a, ai, b, bi) {
  dst[di] = a[ai] & b[bi];
  dst[di + 1] = a[ai + 1] & b[bi + 1];
  return dst;
}

export function or2x32Into(dst, di, a, ai, b, bi) {
  dst[di] = a[ai] | b[bi];
  dst[di + 1] = a[ai + 1] | b[bi + 1];
  return dst;
}

export function xor2x32Into(dst, di, a, ai, b, bi) {
  dst[di] = a[ai] ^ b[bi];
  dst[di + 1] = a[ai + 1] ^ b[bi + 1];
  return dst;
}

export function zero2x32(a0, a1) {
  return (a0 | a1) === 0;
}

export function equal2x32(a0, a1, b0, b1) {
  return ((a0 ^ b0) | (a1 ^ b1)) === 0;
}
