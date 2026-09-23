export function slotMask7Contains32(mask, slot) {
  return (mask & (1 << slot)) !== 0;
}

export function slotMask7Add32(mask, slot) {
  return (mask | (1 << slot)) & 0x7f;
}

export function slotMask7Remove32(mask, slot) {
  return mask & ~(1 << slot) & 0x7f;
}

export function slotMask7First32(mask) {
  return 31 - Math.clz32(mask & -mask & 0x7f);
}
