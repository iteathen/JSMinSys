# Cycle reduction round-079 — omit reflection-fixed center support under caller-owned ply

Packed support stores one 3-bit height per physical column. Exact ply is the sum of all column heights.

When the caller already owns ply, one support height is therefore redundant: it can be reconstructed as ply minus the sum of the stored heights.

For odd widths, omit the physical center column. That column is fixed by horizontal reflection, so canonical comparison does not need its value: original and reflected states contain the same center field.

Compressed support keeps the remaining physical columns in order. Reflection is exactly the existing packed-3 reversal for columns-1 fields:

- C3 -> C2 reflector
- C5 -> C4 reflector
- C7 -> C6 reflector
- C9 -> C8 reflector

For 7x6:

- playable-high = 10 bits
- compressed support = 6 * 3 = 18 bits
- total meta = 28 bits

so low playable occupies one uint32 and playable-high + compressed support occupy a second. The previous caller-owned-ply layout needed three state words.

Known-cell worst-case L1 falls from 26 to 21.5 cycles on apply and from 25 to 20.5 on undo. The omitted-center delta is zero; non-center support deltas are pre-shifted above the packed high-playable field.

The representation is selected only when highBits + 3*(columns-1) <= 32 and the caller truly owns ply independently.
