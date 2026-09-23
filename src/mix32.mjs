export function mix32(value) {
  let x = value;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

export function reflectPacked3x32(code) {
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

export function canonicalMin32(value, reflected) {
  return value <= reflected ? value : reflected;
}
