# Cycle reduction round-065 — fuse two-lane popcount at nibble counts

The previous two-lane SWAR path reduced each lane all the way to byte counts before combining lanes.

After the second SWAR stage, each 4-bit nibble already contains an exact count in 0..4.

Adding the two lanes at that point is safe:

```text
0..4 + 0..4 = 0..8
```

so no carry can cross a nibble boundary.

The combined nibble word can then perform a single byte-collapse:

```text
bytes = (nibbles & 0x0f0f0f0f)
      + ((nibbles >>> 4) & 0x0f0f0f0f)
```

Each resulting byte is 0..16, and the final IMUL/shift sums those byte counts to the exact 0..64 result.

## Ledger

Fixed two-lane exact count:

- before: 25 cycles;
- after: 23 cycles.

Sparse-high profile:

- hi == 0: 16 cycles unchanged;
- hi != 0: 27 -> 25 cycles.

Its break-even against fixed 23 cycles becomes hi==0 frequency > 2/9, about 22.2%.

Tests include both lanes all-ones, bit-31 patterns, complementary masks, and mixed values.
