export function mix8x32Locator32(words, offset) {
  let hash = 0;
  for (let lane = 0; lane < 8; lane += 1) {
    const x = hash ^ words[offset + lane];
    hash = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  }
  return hash >>> 0;
}

// Open-addressed exact probe over dense eight-word identities.
// Hit returns id; empty slot returns bitwise-complement slot.
export function probe8x32IdSlot32(hashSlots, words, capacityMask, start, keyWords, keyOffset, emptyId) {
  let slot = start;
  for (;;) {
    const id = hashSlots[slot];
    if (id === emptyId) return ~slot;
    const base = id * 8;
    let lane = 0;
    while (lane < 8 && words[base + lane] === keyWords[keyOffset + lane]) lane += 1;
    if (lane === 8) return id;
    slot = (slot + 1) & capacityMask;
  }
}

export function publish8x32IdSlot32(words, hashSlots, slot, id, keyWords, keyOffset) {
  const base = id * 8;
  for (let lane = 0; lane < 8; lane += 1) words[base + lane] = keyWords[keyOffset + lane];
  hashSlots[slot] = id;
  return id;
}

// Caller owns publication ordering/lifetime. This helper performs only scalar span stores.
export function publishSpan32(target, targetOffset, source, sourceOffset, count) {
  for (let index = 0; index < count; index += 1) target[targetOffset + index] = source[sourceOffset + index];
  return count;
}
