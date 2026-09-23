// COLD standard-7x6 RBA geometry preparation.
// BigInt/Map/Set/ordinary arrays are intentionally confined to initialization.
// Hot execution consumes only the prepared typed tables.
export function prepareRba7x6Geometry() {
  const lines = [];
  for (let row = 0; row < 6; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      for (const [dc, dr] of [[1,0],[0,1],[1,1],[1,-1]]) {
        if (column + 3 * dc < 7 && row + 3 * dr >= 0 && row + 3 * dr < 6) {
          lines.push(Array.from(
            { length: 4 },
            (_, index) => (row + index * dr) * 7 + column + index * dc,
          ));
        }
      }
    }
  }

  const masks = new Set();
  for (const line of lines) {
    for (let bits = 1; bits < 16; bits += 1) {
      let mask = 0n;
      for (let index = 0; index < 4; index += 1) {
        if (bits & (1 << index)) mask |= 1n << BigInt(line[index]);
      }
      masks.add(mask);
    }
  }

  const cardinality = (value) => {
    let count = 0;
    while (value) { value &= value - 1n; count += 1; }
    return count;
  };
  const shapes = [...masks].sort(
    (a, b) => cardinality(a) - cardinality(b) || (a < b ? -1 : a > b ? 1 : 0),
  );
  if (lines.length !== 69 || shapes.length !== 625) throw new Error('RBA 7x6 geometry invariant');

  const ids = new Map(shapes.map((mask, index) => [mask, index]));
  const g = {
    shapeLo: new Uint32Array(625),
    shapeHi: new Uint32Array(625),
    lineShift: new Uint32Array(69 * 4),
    lineRow: new Uint32Array(69 * 4),
    lineShape: new Uint32Array(69 * 16),
    reflect: new Uint32Array(625),
    // Action-major deletion: removeByCell[cell*625 + shapeId].
    removeByCell: new Int32Array(42 * 625),
    // Image-major relation: image subset childShape.
    supersetsByImage: new Uint32Array(625 * 625),
  };

  for (let lineIndex = 0; lineIndex < 69; lineIndex += 1) {
    const line = lines[lineIndex];
    for (let index = 0; index < 4; index += 1) {
      g.lineShift[lineIndex * 4 + index] = (line[index] % 7) * 3;
      g.lineRow[lineIndex * 4 + index] = (line[index] / 7) | 0;
    }
    for (let bits = 1; bits < 16; bits += 1) {
      let mask = 0n;
      for (let index = 0; index < 4; index += 1) {
        if (bits & (1 << index)) mask |= 1n << BigInt(line[index]);
      }
      g.lineShape[lineIndex * 16 + bits] = ids.get(mask);
    }
  }

  for (let id = 0; id < 625; id += 1) {
    const shape = shapes[id];
    g.shapeLo[id] = Number(shape & 0xffffffffn);
    g.shapeHi[id] = Number(shape >> 32n);
    let reflected = 0n;

    for (let cell = 0; cell < 42; cell += 1) {
      const bit = 1n << BigInt(cell);
      const image = shape & ~bit;
      g.removeByCell[cell * 625 + id] = image ? ids.get(image) : -1;
      if (shape & bit) {
        const reflectedCell = ((cell / 7) | 0) * 7 + 6 - (cell % 7);
        reflected |= 1n << BigInt(reflectedCell);
      }
    }
    g.reflect[id] = ids.get(reflected);
  }

  for (let image = 0; image < 625; image += 1) {
    const source = shapes[image];
    const base = image * 625;
    for (let child = 0; child < 625; child += 1) {
      g.supersetsByImage[base + child] = (source & ~shapes[child]) === 0n ? 1 : 0;
    }
  }
  return g;
}

export function prepareRba7x6CoordinateScratch() {
  return {
    seen: new Uint32Array(20),
    mirrorBasis: new Uint32Array(69),
    inverse: new Uint32Array(625),
    map: new Uint32Array(69),
    mirror: new Uint32Array(8),
    size: new Uint32Array(1),
  };
}
