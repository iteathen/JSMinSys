# Cycle reduction 115 — combined CPC singleton profiles

**Date:** 2026-09-24
**Candidate:** `c65485b9f461cf01d2f12fd57944e31a31460b8e`
**Baseline:** `ad366f2875bab5003ae313cb20bf7cb51f5c0a01`
**Disposition:** retained.

## Change

Former CPC tactical closure scanned the cardinality-1 basis prefix twice: once for mover and once for opponent, repeating basis/index and coordinate-membership decoding.

The candidate computes both players' singleton profiles in one pass. For each singleton basis entry it directly reads both coordinate lanes, shares cell/column/playability decoding when either side is active, preserves immediate mover terminal priority, caps opponent work after two playable threats, and returns a packed profile containing mover immediate, opponent threat count, and both singleton-presence bits.

This mirrors the historical fixed-width minimax pattern: derive both sides' active tactical facts from one position representation rather than independently traversing the same candidate vocabulary.

## Qualification

Verify run `36081138095`: success.

Search-level B/C/C/B `36081134479` preserved all search/CPC counters. Warm micro medians were noisy/adverse (+9.82% aggregate), while both cold elapsed pairs favored the candidate by about 17%; whole-solver qualification was therefore required.

Same-runner Fhourstones B/C/C/B:

- Connect4 branch `benchmark/isomax-cpc-combined-singletons-ab-20260924`;
- benchmark commit `8e192ecacb57e96ce2c81c6de5b7b34caa726693`;
- workflow run `36081200321`;
- input `45461667`.

Every phase returned exact +1, move 3, with identical 806,844 alpha-beta nodes, 807,290 cofactors/transitions, 274,452 cutoffs, 351,277 cache hits, 455,568 CPC calls, 100,640 CPC forced events, and 65 CPC precursors.

| Metric | Baseline mean | Candidate mean | Effect |
|---|---:|---:|---:|
| wall | 1762.1372 ms | 1727.4714 ms | **-1.97%** |
| solver elapsed | 1751.0911 ms | 1716.6755 ms | **-1.97%** |
| CPU ms | 2008.0 | 1977.0 | **-1.54%** |
| CPU cycles | 4,633,680,970 | 4,530,693,410 | **-2.22%** |
| cycles / node | 5742.97 | 5615.33 | **-2.22%** |

The search tree and CPC result stream are unchanged; the gain is CPC implementation cost only.

## Next target

Proceed to true forced-chain macro compression. Historical residual and quotient-native solvers show that CPC/tactical forced states can be collapsed as deterministic transit states, but intermediate TT reuse must be measured rather than assumed irrelevant.