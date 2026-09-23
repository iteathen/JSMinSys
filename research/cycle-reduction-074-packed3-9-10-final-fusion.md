# Cycle reduction round-074 — fuse final alignment for C9/C10 packed reflection

The C9 and C10 register networks both reverse the low eight 3-bit fields in a 24-bit working word, then perform a 12-bit half exchange and finally shift that result left to make room for the extra source fields.

Those last two transformations can be one masked wider rotate.

For C9:

((x << 15) | (x >>> 9)) & 0x07fffff8

For C10:

((x << 18) | (x >>> 6)) & 0x3fffffc0

The masks simultaneously discard wrap bits outside the 24-bit source domain and reserve the low 3 or 6 output bits for the separately extracted high source fields.

Ledger:

- C9: 17 -> 16 cycles
- C10: 20 -> 19 cycles

Qualification compares edge-field vectors plus the existing randomized configured-profile sweep against reflectPacked3Direct32.
