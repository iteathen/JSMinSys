# Cycle reduction round-033 — register-only packed-3 reflection

## Governing invariant

Board width is runtime-configured during initialization and then immutable. Packed support stores exactly three bits per configured column, with rank/ply represented separately. The packed-support profile therefore occupies at most 30 bits for 1..10 columns.

The hot path should not rediscover width and should not pay memory traffic when a fixed register permutation is cheaper.

## Structural change

Reflection of fixed-width 3-bit fields is a bit permutation, not inherently a table lookup.

Initialization now has register-only choices for every nontrivial packed-3 width:

| columns | selected register profile | static serial cycles |
|---:|---|---:|
| 1 | identity / do nothing | 0 |
| 2 | `reflectPacked3Columns2` | 4 |
| 3 | `reflectPacked3Columns3` | 6 |
| 4 | `reflectPacked3Columns4` | 9 |
| 5 | `reflectPacked3Columns5` | 12 |
| 6 | `reflectPacked3Columns6To7(..., 6)` | 15 |
| 7 | `reflectPacked3Columns6To7(..., 3)` | 15 |
| 8 | `reflectPacked3Columns8` | 14 |
| 9 | `reflectPacked3Columns9` | 17 |
| 10 | `reflectPacked3Columns10` | 21 |

The 4- and 8-field cores use divide-and-conquer swaps. Equal-size final halves are exchanged with a masked rotate, reducing that stage from five ALU operations to four.

## Before / after under the current NEES serial ledger

Previous best cataloged hot paths:

- 2 columns: direct fallback, `2 + 9*C = 20` cycles;
- 3..5 columns: two-byte lookup, 13 L1 / 29 L2 / 99 L3 cycles;
- 6..8 columns: three-byte lookup, 21 L1 / 45 L2 / 150 L3 cycles;
- 9..10 columns: four-byte lookup, 28 L1 / 60 L2 / 200 L3 cycles.

The new profiles are fixed register-only costs shown above and require no `fillReflect3Tables32` work on the selected path.

This is a governing-unit reduction: both repeated lookup memory traffic and its initialization dependency disappear. Existing table and direct functions remain available as alternatives until emitted V8 assembly and throughput measurements justify retiring them.

## Correctness qualification

Tests compare the register networks against `reflectPacked3Direct32`:

- exhaustive input space for widths 2..5;
- deterministic sampled inputs for widths 6..10;
- explicit one-column identity check.

No geometry is hard-coded to 7x6. Width is still chosen at runtime initialization, and the selected hot function is width-specific thereafter.

## Accounting caveat

These are NEES additive static serial ledgers for `node26-v8-14.6/x86_64-amd-zen3`, not literal wall-clock latency claims. Generated assembly, dependency overlap, and throughput remain separate qualification dimensions.
