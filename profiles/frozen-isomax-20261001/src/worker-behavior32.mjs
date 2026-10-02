// Optional read-only worker control checkpoint. Existing workers do not call it.
// Preconditions: a prepared Uint32 shared control span; base points to word 0;
// word 4 is the sole publisher's non-wrapping even/odd version; output has 3
// private lanes at outOffset. All writes use the publication contract.
// HOT CONTRACT: keep the non-extension path at one atomic load plus bit test.
// No shared writes, callbacks, allocations, string operations, waits or retries.
// Preserve this cost/invariant comment when editing this path.
// Return: unsigned primary word; -1 means publication overlapped, defer.
// Only a successful extended read writes output. Unused extension lanes are 0.
export function readWorkerBehavior32(words, base, output, outOffset) {
  let primary = Atomics.load(words, base);
  if (!(primary & 0x80000000)) return primary;

  const version = Atomics.load(words, base + 4);
  if (version & 1) return -1;
  // The first primary load preceded the version bracket. Re-read it inside,
  // otherwise an old primary could be combined with a later extension set.
  primary = Atomics.load(words, base);
  let first = 0, second = 0, third = 0;
  if (primary & 0x80000000) {
    first = Atomics.load(words, base + 1);
    if (first & 0x80000000) {
      second = Atomics.load(words, base + 2);
      if (second & 0x80000000) third = Atomics.load(words, base + 3);
    }
  }
  if (version !== Atomics.load(words, base + 4)) return -1;
  output[outOffset] = first;
  output[outOffset + 1] = second;
  output[outOffset + 2] = third;
  return primary;
}
