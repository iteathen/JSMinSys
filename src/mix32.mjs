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
  if (columns === 7 && rankShift === 21) {
    return (
      (code & 0xffe00000)
      | ((code & 0x000007) << 18)
      | ((code & 0x000038) << 12)
      | ((code & 0x0001c0) << 6)
      | (code & 0x000e00)
      | ((code >>> 6) & 0x0001c0)
      | ((code >>> 12) & 0x000038)
      | ((code >>> 18) & 0x000007)
    ) >>> 0;
  }

  const rank = code >>> rankShift;
  let reflected = (rank << rankShift) >>> 0;
  for (let column = 0; column < columns; column += 1) {
    const value = (code >>> (column * 3)) & 7;
    reflected = (
      reflected
      | (value << ((columns - 1 - column) * 3))
    ) >>> 0;
  }
  return reflected;
}

export function canonicalMin32(value, reflected) {
  return value <= reflected ? value : reflected;
}
