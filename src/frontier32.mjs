export function normalizeMinimal2x32InPlace(lo, hi, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      if ((lo[scan] & ~candidateLo) === 0 && (hi[scan] & ~candidateHi) === 0) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    let write = 0;
    for (let scan = 0; scan < retained; scan += 1) {
      if (!((candidateLo & ~lo[scan]) === 0 && (candidateHi & ~hi[scan]) === 0)) {
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
      if ((candidateLo & ~lo[scan]) === 0 && (candidateHi & ~hi[scan]) === 0) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    let write = 0;
    for (let scan = 0; scan < retained; scan += 1) {
      if (!((lo[scan] & ~candidateLo) === 0 && (hi[scan] & ~candidateHi) === 0)) {
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
