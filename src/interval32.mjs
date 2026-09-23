// bounds[offset], bounds[offset+1] are authoritative lower/upper evidence.
// Return -1 conflict, 0 unchanged, 1 tightened non-exact, 2 tightened exact.
export function tightenInterval32(bounds, offset, lower, upper) {
  if (lower < bounds[offset]) lower = bounds[offset];
  if (upper > bounds[offset + 1]) upper = bounds[offset + 1];
  if (lower > upper) return -1;
  if (lower === bounds[offset] && upper === bounds[offset + 1]) return 0;
  bounds[offset] = lower;
  bounds[offset + 1] = upper;
  return lower === upper ? 2 : 1;
}

// count is caller-validated in [1,7].
export function reduceMaxIntervals7x32Into(lowers, uppers, offset, count, out, outOffset) {
  let lower = lowers[offset];
  let upper = uppers[offset];
  for (let index = 1; index < count; index += 1) {
    const at = offset + index;
    if (lowers[at] > lower) lower = lowers[at];
    if (uppers[at] > upper) upper = uppers[at];
  }
  out[outOffset] = lower;
  out[outOffset + 1] = upper;
  return outOffset;
}

// count is caller-validated in [1,7].
export function reduceMinIntervals7x32Into(lowers, uppers, offset, count, out, outOffset) {
  let lower = lowers[offset];
  let upper = uppers[offset];
  for (let index = 1; index < count; index += 1) {
    const at = offset + index;
    if (lowers[at] < lower) lower = lowers[at];
    if (uppers[at] < upper) upper = uppers[at];
  }
  out[outOffset] = lower;
  out[outOffset + 1] = upper;
  return outOffset;
}
