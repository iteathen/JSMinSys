export function mix32(value) {
  return Math.imul(value ^ (value >>> 16), 0x7feb352d) >>> 0;
}

export function mix32Medium(value) {
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
  let sourceBit = 0;
  let fieldBit = 0;
  let targetBase = (columns - 1) * 3;

  for (let byte = 0; byte < 4; byte += 1) {
    const base = byte << 8;
    tables[base] = 0;

    for (let bit = 0; bit < 8; bit += 1) {
      const contribution = sourceBit < supportBits
        ? 1 << (targetBase + fieldBit)
        : 0;
      const span = 1 << bit;
      for (let value = 0; value < span; value += 1) {
        tables[base + span + value] = tables[base + value] | contribution;
      }

      sourceBit += 1;
      fieldBit += 1;
      if (fieldBit === 3) {
        fieldBit = 0;
        targetBase -= 3;
      }
    }
  }
  return supportBits;
}

export function reflectPacked3x24(code, tables) {
  return (
    tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
    | tables[0x200 + ((code >>> 16) & 0xff)]
  ) >>> 0;
}

export function reflectPacked3x32(code, tables) {
  return (
    tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
    | tables[0x200 + ((code >>> 16) & 0xff)]
    | tables[0x300 + (code >>> 24)]
  ) >>> 0;
}

export function reflectPacked3Direct32(code, columns) {
  let reflected = 0;
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
