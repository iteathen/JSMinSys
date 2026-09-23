# Cycle reduction round-075 — fuse final alignment for C5 packed reflection

C5 reverses the lower four 3-bit fields in a 12-bit working word, then swaps its two 6-bit halves and shifts the result left by three to make room for the fifth source field.

The last two transformations can be combined as:

((x << 9) | (x >>> 3)) & 0x7ff8

The mask discards wrap bits and reserves bits 0..2 for the separately extracted fifth field.

Ledger: 12 -> 11 fixed cycles.

Qualification includes edge-field vectors and the existing exhaustive C5 configured-profile sweep against the direct reflection reference.
