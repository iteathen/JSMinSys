function subset2x32(a0, a1, b0, b1) {
  return (a0 & ~b0) === 0 && (a1 & ~b1) === 0;
}

export function normalizeMinimal2x32InPlace(lo, hi, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      if (subset2x32(lo[scan], hi[scan], candidateLo, candidateHi)) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    let write = 0;
    for (let scan = 0; scan < retained; scan += 1) {
      if (!subset2x32(candidateLo, candidateHi, lo[scan], hi[scan])) {
        lo[write] = lo[scan];
        hi[write] = hi[scan];
        write += 1;
      }
    }
    lo[write] = candidateLo;
    hi[write] = candidateHi;
    retained = write + 1;
  }
  return retained;
}

export function normalizeMaximal2x32InPlace(lo, hi, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      if (subset2x32(candidateLo, candidateHi, lo[scan], hi[scan])) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    let write = 0;
    for (let scan = 0; scan < retained; scan += 1) {
      if (!subset2x32(lo[scan], hi[scan], candidateLo, candidateHi)) {
        lo[write] = lo[scan];
        hi[write] = hi[scan];
        write += 1;
      }
    }
    lo[write] = candidateLo;
    hi[write] = candidateHi;
    retained = write + 1;
  }
  return retained;
}
