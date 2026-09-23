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

export function normalizeMinimalI32InPlace(words, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidate = words[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      const existing = words[scan];
      if ((existing & candidate) === existing) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    words[retained] = candidate;
    retained += 1;
  }
  return retained;
}

export function normalizeMaximalI32InPlace(words, length) {
  let retained = 0;
  for (let index = 0; index < length; index += 1) {
    const candidate = words[index];
    let rejected = 0;

    for (let scan = 0; scan < retained; scan += 1) {
      const existing = words[scan];
      if ((candidate & existing) === candidate) {
        rejected = 1;
        break;
      }
    }
    if (rejected !== 0) continue;

    words[retained] = candidate;
    retained += 1;
  }
  return retained;
}

export function normalizeMinimalI32LazyInPlace(words, length) {
  let index = 0;

  prefix: for (; index < length; index += 1) {
    const candidate = words[index];
    for (let scan = 0; scan < index; scan += 1) {
      const existing = words[scan];
      if ((existing & candidate) === existing) break prefix;
    }
  }

  let retained = index;
  index += 1;

  outer: for (; index < length; index += 1) {
    const candidate = words[index];
    for (let scan = 0; scan < retained; scan += 1) {
      const existing = words[scan];
      if ((existing & candidate) === existing) continue outer;
    }

    words[retained] = candidate;
    retained += 1;
  }
  return retained;
}

export function normalizeMaximalI32LazyInPlace(words, length) {
  let index = 0;

  prefix: for (; index < length; index += 1) {
    const candidate = words[index];
    for (let scan = 0; scan < index; scan += 1) {
      const existing = words[scan];
      if ((candidate & existing) === candidate) break prefix;
    }
  }

  let retained = index;
  index += 1;

  outer: for (; index < length; index += 1) {
    const candidate = words[index];
    for (let scan = 0; scan < retained; scan += 1) {
      const existing = words[scan];
      if ((candidate & existing) === candidate) continue outer;
    }

    words[retained] = candidate;
    retained += 1;
  }
  return retained;
}

export function normalizeMinimal2xI32LazyInPlace(lo, hi, length) {
  let index = 0;

  prefix: for (; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    for (let scan = 0; scan < index; scan += 1) {
      if ((lo[scan] & candidateLo) === lo[scan]
          && (hi[scan] & candidateHi) === hi[scan]) {
        break prefix;
      }
    }
  }

  let retained = index;
  index += 1;

  outer: for (; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];

    for (let scan = 0; scan < retained; scan += 1) {
      if ((lo[scan] & candidateLo) === lo[scan]
          && (hi[scan] & candidateHi) === hi[scan]) {
        continue outer;
      }
    }

    lo[retained] = candidateLo;
    hi[retained] = candidateHi;
    retained += 1;
  }
  return retained;
}

export function normalizeMaximal2xI32LazyInPlace(lo, hi, length) {
  let index = 0;

  prefix: for (; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];
    for (let scan = 0; scan < index; scan += 1) {
      if ((candidateLo & lo[scan]) === candidateLo
          && (candidateHi & hi[scan]) === candidateHi) {
        break prefix;
      }
    }
  }

  let retained = index;
  index += 1;

  outer: for (; index < length; index += 1) {
    const candidateLo = lo[index];
    const candidateHi = hi[index];

    for (let scan = 0; scan < retained; scan += 1) {
      if ((candidateLo & lo[scan]) === candidateLo
          && (candidateHi & hi[scan]) === candidateHi) {
        continue outer;
      }
    }

    lo[retained] = candidateLo;
    hi[retained] = candidateHi;
    retained += 1;
  }
  return retained;
}

