export function mix32(value) {
  let x = value;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  return x >>> 0;
}

export function mix32Strong(value) {
  let x = value;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

export function fillReflect3Tables32(tables, columns) {
  const supportBits = columns * 3;
  for (let byte = 0; byte < 4; byte += 1) {
    const base = byte << 8;
    const sourceBase = byte << 3;
    for (let value = 0; value < 256; value += 1) {
      let reflected = 0;
      for (let bit = 0; bit < 8; bit += 1) {
        const sourceBit = sourceBase + bit;
        if (sourceBit >= supportBits) break;
        if ((value & (1 << bit)) === 0) continue;
        const column = Math.floor(sourceBit / 3);
        const fieldBit = sourceBit - column * 3;
        const targetColumn = columns - 1 - column;
        const targetBit = targetColumn * 3 + fieldBit;
        reflected |= 1 << targetBit;
      }
      tables[base + value] = reflected;
    }
  }
  return supportBits;
}

export function reflectPacked3x24(code, tables, rankMask) {
  return (
    (code & rankMask)
    | tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
    | tables[0x200 + ((code >>> 16) & 0xff)]
  ) >>> 0;
}

export function reflectPacked3x32(code, tables, rankMask) {
  return (
    (code & rankMask)
    | tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
    | tables[0x200 + ((code >>> 16) & 0xff)]
    | tables[0x300 + (code >>> 24)]
  ) >>> 0;
}

export function reflectPacked3Direct32(code, columns, rankShift) {
  const rank = code >>> rankShift;
  let reflected = rank << rankShift;
  let sourceShift = 0;
  const lastColumn = columns - 1;
  let targetShift = (lastColumn << 1) + lastColumn;

  for (let column = 0; column < columns; column += 1) {
    const value = (code >>> sourceShift) & 7;
    reflected |= value << targetShift;
    sourceShift += 3;
    targetShift -= 3;
  }
  return reflected >>> 0;
}

export function canonicalMin32(value, reflected) {
  return value <= reflected ? value : reflected;
}
