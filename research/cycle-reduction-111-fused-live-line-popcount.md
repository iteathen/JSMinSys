# Cycle reduction 111 — fused live-line popcount lanes

**Date:** 2026-09-24  
**Candidate:** `aa96599752181fea7c4e124b3fdf1f0e4baa8e3a`  
**Baseline:** retained insertion-order line `bd53c725649ee61c336fb9b1d438afa99841765b` (documentation descendants do not change runtime)  
**Disposition:** retained.

## Change

The standard three-word live-line scorer previously executed:

`3 * popcount32 + 2 adds`.

The candidate uses the existing qualified two-lane fused primitive for the first two words:

`popcount2x32(word0, word1) + popcount32(word2)`.

Current sealed static ledgers:

- `popcount32`: 14 cycles;
- `popcount2x32`: 23 cycles.

The scorer ledger therefore changes from 44 serial ledger cycles of count/add work to 38 before common loads/ANDs: **-6 static cycles per scored cell**, branch-free.

## Qualification

JSMinSys Verify `36068047291`: success.

Same-runner search B/C/C/B `36068041569`:

Production `cpc-alpha-beta`:

| Metric | Baseline | Candidate | Effect |
|---|---:|---:|---:|
| nodes | 1,525 | 1,525 | unchanged |
| cofactors | 1,539 | 1,539 | unchanged |
| warm-median sum | 1.012140 ms | 0.938781 ms | **-7.25%** |
| cold elapsed sum | 4.800654 ms | 4.448063 ms | **-7.34%** |

Both paired warm and cold comparisons favored the candidate.

## Same-runner whole-solver Fhourstones A/B

Connect4 benchmark:

- branch `benchmark/isomax-fhourstones-live-line-popcount-ab-20260924`;
- commit `563901ce1700f49c46f4dd773cd8ff491aa7251e`;
- workflow run `36068345692`;
- input `45461667`;
- B/C/C/B on one Windows runner.

Every phase returned exact `+1`, move `3`, with identical:

- alpha-beta nodes `806,844`;
- cofactors/transitions `807,290`;
- cutoffs `274,452`;
- cache hits `351,277`;
- CPC calls `455,568`.

Paired measurements:

| Phase | wall ms | CPU ms | cycles |
|---|---:|---:|---:|
| B1 | 1199.8017 | 1360 | 3,621,977,117 |
| C1 | 1202.8398 | 1453 | 3,640,145,193 |
| C2 | 1258.3784 | 1438 | 3,777,362,237 |
| B2 | 1333.7078 | 1532 | 4,037,643,164 |

B/C means:

- wall: 1266.7548 -> 1230.6091 ms (**-2.85%**);
- CPU ms: 1446.0 -> 1445.5 (flat);
- CPU cycles: 3,829,810,140.5 -> 3,708,753,715 (**-3.16%**);
- cycles/node: 4746.66 -> 4596.62 (**-3.16%**).

Pair 1 cycles were +0.50% candidate; pair 2 cycles were -6.45% candidate. Retention is based on the aggregate same-runner result plus the consistent search-level B/C/C/B, not a claim of deterministic per-run timing.

## Next target

The next branchless score reduction is a native three-lane SWAR fusion: after each word reaches exact nibble counts (0..4), three lanes sum to at most 12 per nibble, so all three words can share one byte-collapse and final IMUL/shift. This should be qualified as a new sealed primitive before replacing the current 2+1 composition.
