export function mix32(value) {
  return Math.imul(value ^ (value >>> 16), 0x7feb352d);
}

export function mix32Medium(value) {
  let x = value;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  return x;
}

export function mix32Strong(value) {
  let x = value;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x;
}

export function fillReflect3Tables32(tables, columns, byteCount) {
  const supportBits = columns * 3;
  let sourceBit = 0;
  let fieldBit = 0;
  let targetBase = (columns - 1) * 3;

  for (let byte = 0; byte < byteCount; byte += 1) {
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

export function reflectPacked3x16(code, tables) {
  return (
    tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
  );
}

export function reflectPacked3x24(code, tables) {
  return (
    tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
    | tables[0x200 + ((code >>> 16) & 0xff)]
  );
}

export function reflectPacked3x32(code, tables) {
  return (
    tables[code & 0xff]
    | tables[0x100 + ((code >>> 8) & 0xff)]
    | tables[0x200 + ((code >>> 16) & 0xff)]
    | tables[0x300 + (code >>> 24)]
  );
}

export function reflectPacked3Direct32(code, columns, initialTargetShift) {
  let reflected = 0;
  let sourceShift = 0;
  let targetShift = initialTargetShift;

  for (let column = 0; column < columns; column += 1) {
    const value = (code >>> sourceShift) & 7;
    reflected |= value << targetShift;
    sourceShift += 3;
    targetShift -= 3;
  }
  return reflected;
}


export function reflectPacked3Columns2(code) {
  return ((code << 3) | (code >>> 3)) & 0x3f;
}

export function reflectPacked3Columns3(code) {
  return ((code & 0x7) << 6) | (code & 0x38) | (code >>> 6);
}

export function reflectPacked3Columns4(code) {
  let x = ((code & 0x1c7) << 3) | ((code & 0xe38) >>> 3);
  return ((x << 6) | (x >>> 6)) & 0xfff;
}

export function reflectPacked3Columns5(code) {
  let x = ((code & 0x1c7) << 3) | ((code & 0xe38) >>> 3);
  x = ((x << 6) | (x >>> 6)) & 0xfff;
  return (code >>> 12) | (x << 3);
}

export function reflectPacked3Columns6To7(code, leftShift, highShift) {
  let x = ((code & 0x1c71c7) << 3) | ((code & 0xe38e38) >>> 3);
  x = ((x & 0x03f03f) << 6) | ((x & 0xfc0fc0) >>> 6);
  return ((x & 0xfff) << leftShift) | (x >>> highShift);
}

export function reflectPacked3Columns8(code) {
  let x = ((code & 0x1c71c7) << 3) | ((code & 0xe38e38) >>> 3);
  x = ((x & 0x03f03f) << 6) | ((x & 0xfc0fc0) >>> 6);
  return ((x << 12) | (x >>> 12)) & 0xffffff;
}

export function reflectPacked3Columns9(code) {
  const high = code >>> 24;
  let x = ((code & 0x1c71c7) << 3) | ((code & 0xe38e38) >>> 3);
  x = ((x & 0x03f03f) << 6) | ((x & 0xfc0fc0) >>> 6);
  return high | (((x << 15) | (x >>> 9)) & 0x07fffff8);
}

export function reflectPacked3Columns10(code) {
  const high = (code >>> 27) | ((code >>> 21) & 0x38);
  let x = ((code & 0x1c71c7) << 3) | ((code & 0xe38e38) >>> 3);
  x = ((x & 0x03f03f) << 6) | ((x & 0xfc0fc0) >>> 6);
  return high | (((x << 18) | (x >>> 6)) & 0x3fffffc0);
}

export function canonicalMin32(value, reflected) {
  return value <= reflected ? value : reflected;
}
