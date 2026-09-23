export function atomicTryClaim32(words, index, expected, claimed) {
  return Atomics.compareExchange(words, index, expected, claimed) === expected;
}

export function atomicTryClaimLoadFirst32(
  words,
  index,
  expected,
  claimed,
) {
  if (Atomics.load(words, index) !== expected) return false;
  return Atomics.compareExchange(words, index, expected, claimed) === expected;
}

export function atomicRelease32(words, index, released) {
  Atomics.store(words, index, released);
  Atomics.notify(words, index, 1);
  return released;
}

export function atomicReleaseNoNotify32(words, index, released) {
  Atomics.store(words, index, released);
  return released;
}

export function atomicExchange32(words, index, value) {
  return Atomics.exchange(words, index, value);
}

export function atomicAdd32(words, index, value) {
  return Atomics.add(words, index, value);
}

export function atomicSub32(words, index, value) {
  return Atomics.sub(words, index, value);
}
