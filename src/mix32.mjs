export function mix32(value) {
  let x = value;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

export function reflectPacked3x32(code, columns, rankShift) {
  const rank = code >>> rankShift;
  let reflected = (rank << rankShift) >>> 0;
  let sourceShift = 0;
  const lastColumn = columns - 1;
  let targetShift = (lastColumn << 1) + lastColumn;

  for (let column = 0; column < columns; column += 1) {
    const value = (code >>> sourceShift) & 7;
    reflected = (reflected | (value << targetShift)) >>> 0;
    sourceShift += 3;
    targetShift -= 3;
  }
  return reflected;
}

export function canonicalMin32(value, reflected) {
  return value <= reflected ? value : reflected;
}
