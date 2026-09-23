// Records are six consecutive Uint32-compatible words. Minimal means subset-minimal.
// Returns the retained length; capacity exhaustion returns bitwise-complement length.
export function insertMinimal6x32InPlace(words, base, length, capacity, candidate, candidateOffset) {
  for (let index = 0; index < length; index += 1) {
    const at = base + index * 6;
    let dominated = 1;
    for (let lane = 0; lane < 6; lane += 1) {
      if (words[at + lane] & ~candidate[candidateOffset + lane]) {
        dominated = 0;
        break;
      }
    }
    if (dominated) return length;
  }

  let index = 0;
  while (index < length) {
    const at = base + index * 6;
    let removes = 1;
    for (let lane = 0; lane < 6; lane += 1) {
      if (candidate[candidateOffset + lane] & ~words[at + lane]) {
        removes = 0;
        break;
      }
    }
    if (removes) {
      length -= 1;
      const last = base + length * 6;
      for (let lane = 0; lane < 6; lane += 1) words[at + lane] = words[last + lane];
    } else {
      index += 1;
    }
  }

  if (length === capacity) return ~length;
  const out = base + length * 6;
  for (let lane = 0; lane < 6; lane += 1) words[out + lane] = candidate[candidateOffset + lane];
  return length + 1;
}

// Stream pairwise OR (join under subset order) through immediate skyline absorption.
// out may already contain retained generators. Returns retained length or ~length on capacity.
export function productJoinMinimal6x32Into(
  out,
  outBase,
  outLength,
  capacity,
  left,
  leftBase,
  leftLength,
  right,
  rightBase,
  rightLength,
  scratch,
  scratchOffset,
) {
  for (let i = 0; i < leftLength; i += 1) {
    const a = leftBase + i * 6;
    for (let j = 0; j < rightLength; j += 1) {
      const b = rightBase + j * 6;
      for (let lane = 0; lane < 6; lane += 1) scratch[scratchOffset + lane] = left[a + lane] | right[b + lane];

      let dominated = 0;
      for (let scan = 0; scan < outLength; scan += 1) {
        const at = outBase + scan * 6;
        let yes = 1;
        for (let lane = 0; lane < 6; lane += 1) {
          if (out[at + lane] & ~scratch[scratchOffset + lane]) { yes = 0; break; }
        }
        if (yes) { dominated = 1; break; }
      }
      if (dominated) continue;

      let scan = 0;
      while (scan < outLength) {
        const at = outBase + scan * 6;
        let removes = 1;
        for (let lane = 0; lane < 6; lane += 1) {
          if (scratch[scratchOffset + lane] & ~out[at + lane]) { removes = 0; break; }
        }
        if (removes) {
          outLength -= 1;
          const last = outBase + outLength * 6;
          for (let lane = 0; lane < 6; lane += 1) out[at + lane] = out[last + lane];
        } else scan += 1;
      }
      if (outLength === capacity) return ~outLength;
      const at = outBase + outLength * 6;
      for (let lane = 0; lane < 6; lane += 1) out[at + lane] = scratch[scratchOffset + lane];
      outLength += 1;
    }
  }
  return outLength;
}

export function insertMinimalSpan32InPlace(words, base, length, capacity, recordWords, candidate, candidateOffset) {
  for (let index = 0; index < length; index += 1) {
    const at = base + index * recordWords;
    let dominated = 1;
    for (let lane = 0; lane < recordWords; lane += 1) {
      if (words[at + lane] & ~candidate[candidateOffset + lane]) { dominated = 0; break; }
    }
    if (dominated) return length;
  }

  let index = 0;
  while (index < length) {
    const at = base + index * recordWords;
    let removes = 1;
    for (let lane = 0; lane < recordWords; lane += 1) {
      if (candidate[candidateOffset + lane] & ~words[at + lane]) { removes = 0; break; }
    }
    if (removes) {
      length -= 1;
      const last = base + length * recordWords;
      for (let lane = 0; lane < recordWords; lane += 1) words[at + lane] = words[last + lane];
    } else index += 1;
  }

  if (length === capacity) return ~length;
  const out = base + length * recordWords;
  for (let lane = 0; lane < recordWords; lane += 1) words[out + lane] = candidate[candidateOffset + lane];
  return length + 1;
}

export function productJoinMinimalSpan32Into(
  out, outBase, outLength, capacity,
  left, leftBase, leftLength,
  right, rightBase, rightLength,
  recordWords, scratch, scratchOffset,
) {
  for (let i = 0; i < leftLength; i += 1) {
    const a = leftBase + i * recordWords;
    for (let j = 0; j < rightLength; j += 1) {
      const b = rightBase + j * recordWords;
      for (let lane = 0; lane < recordWords; lane += 1) {
        scratch[scratchOffset + lane] = left[a + lane] | right[b + lane];
      }

      let dominated = 0;
      for (let scan = 0; scan < outLength; scan += 1) {
        const at = outBase + scan * recordWords;
        let yes = 1;
        for (let lane = 0; lane < recordWords; lane += 1) {
          if (out[at + lane] & ~scratch[scratchOffset + lane]) { yes = 0; break; }
        }
        if (yes) { dominated = 1; break; }
      }
      if (dominated) continue;

      let scan = 0;
      while (scan < outLength) {
        const at = outBase + scan * recordWords;
        let removes = 1;
        for (let lane = 0; lane < recordWords; lane += 1) {
          if (scratch[scratchOffset + lane] & ~out[at + lane]) { removes = 0; break; }
        }
        if (removes) {
          outLength -= 1;
          const last = outBase + outLength * recordWords;
          for (let lane = 0; lane < recordWords; lane += 1) out[at + lane] = out[last + lane];
        } else scan += 1;
      }

      if (outLength === capacity) return ~outLength;
      const at = outBase + outLength * recordWords;
      for (let lane = 0; lane < recordWords; lane += 1) out[at + lane] = scratch[scratchOffset + lane];
      outLength += 1;
    }
  }
  return outLength;
}
