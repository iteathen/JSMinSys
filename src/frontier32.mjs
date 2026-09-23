// Preconditions:
// - minimal input arrives in nondecreasing cardinality order.
// - maximal input arrives in nonincreasing cardinality order.
// Under those orders, an accepted candidate cannot dominate an earlier retained
// entry, so normalization requires only the rejection scan.
export function normalizeMinimal2x32InPlace(lo, hi, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    const inverseLo = ~candidateLo;
    const inverseHi = ~candidateHi;
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      if ((lo[scan] & inverseLo) === 0 && (hi[scan] & inverseHi) === 0) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    lo[retained] = candidateLo;
    hi[retained] = candidateHi;
    retained += 1;
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

    lo[retained] = candidateLo;
    hi[retained] = candidateHi;
    retained += 1;
  }
  return retained;
}


export function normalizeMinimal2xI32InPlace(lo, hi, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      if ((lo[scan] & candidateLo) === lo[scan]
          && (hi[scan] & candidateHi) === hi[scan]) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    lo[retained] = candidateLo;
    hi[retained] = candidateHi;
    retained += 1;
  }
  return retained;
}

export function normalizeMaximal2xI32InPlace(lo, hi, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      if ((candidateLo & lo[scan]) === candidateLo
          && (candidateHi & hi[scan]) === candidateHi) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    lo[retained] = candidateLo;
    hi[retained] = candidateHi;
    retained += 1;
  }
  return retained;
}
