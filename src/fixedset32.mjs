export function equal3x32At(a, aOffset, b, bOffset) {
  return a[aOffset] === b[bOffset]
    && a[aOffset + 1] === b[bOffset + 1]
    && a[aOffset + 2] === b[bOffset + 2];
}

export function subset3x32At(a, aOffset, b, bOffset) {
  return ((a[aOffset] & ~b[bOffset])
    | (a[aOffset + 1] & ~b[bOffset + 1])
    | (a[aOffset + 2] & ~b[bOffset + 2])) === 0;
}

export function or3x32Into(out, outOffset, a, aOffset, b, bOffset) {
  out[outOffset] = a[aOffset] | b[bOffset];
  out[outOffset + 1] = a[aOffset + 1] | b[bOffset + 1];
  out[outOffset + 2] = a[aOffset + 2] | b[bOffset + 2];
  return outOffset;
}

export function and3x32Into(out, outOffset, a, aOffset, b, bOffset) {
  out[outOffset] = a[aOffset] & b[bOffset];
  out[outOffset + 1] = a[aOffset + 1] & b[bOffset + 1];
  out[outOffset + 2] = a[aOffset + 2] & b[bOffset + 2];
  return outOffset;
}

export function andNot3x32Into(out, outOffset, a, aOffset, b, bOffset) {
  out[outOffset] = a[aOffset] & ~b[bOffset];
  out[outOffset + 1] = a[aOffset + 1] & ~b[bOffset + 1];
  out[outOffset + 2] = a[aOffset + 2] & ~b[bOffset + 2];
  return outOffset;
}

export function equal6x32At(a, aOffset, b, bOffset) {
  return a[aOffset] === b[bOffset]
    && a[aOffset + 1] === b[bOffset + 1]
    && a[aOffset + 2] === b[bOffset + 2]
    && a[aOffset + 3] === b[bOffset + 3]
    && a[aOffset + 4] === b[bOffset + 4]
    && a[aOffset + 5] === b[bOffset + 5];
}

export function subset6x32At(a, aOffset, b, bOffset) {
  return ((a[aOffset] & ~b[bOffset])
    | (a[aOffset + 1] & ~b[bOffset + 1])
    | (a[aOffset + 2] & ~b[bOffset + 2])
    | (a[aOffset + 3] & ~b[bOffset + 3])
    | (a[aOffset + 4] & ~b[bOffset + 4])
    | (a[aOffset + 5] & ~b[bOffset + 5])) === 0;
}

export function or6x32Into(out, outOffset, a, aOffset, b, bOffset) {
  out[outOffset] = a[aOffset] | b[bOffset];
  out[outOffset + 1] = a[aOffset + 1] | b[bOffset + 1];
  out[outOffset + 2] = a[aOffset + 2] | b[bOffset + 2];
  out[outOffset + 3] = a[aOffset + 3] | b[bOffset + 3];
  out[outOffset + 4] = a[aOffset + 4] | b[bOffset + 4];
  out[outOffset + 5] = a[aOffset + 5] | b[bOffset + 5];
  return outOffset;
}

export function equal8x32At(a, aOffset, b, bOffset) {
  return a[aOffset] === b[bOffset]
    && a[aOffset + 1] === b[bOffset + 1]
    && a[aOffset + 2] === b[bOffset + 2]
    && a[aOffset + 3] === b[bOffset + 3]
    && a[aOffset + 4] === b[bOffset + 4]
    && a[aOffset + 5] === b[bOffset + 5]
    && a[aOffset + 6] === b[bOffset + 6]
    && a[aOffset + 7] === b[bOffset + 7];
}
