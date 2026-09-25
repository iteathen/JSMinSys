# Cycle reduction 117 — CPC forced transit macro

**Date:** 2026-09-24
**Candidate:** `d60616f9993fc3fed24e7adb0dec89ccde8ca03d`
**Baseline:** `70ada3430dc733abe518b64143422ecd03dd3384`
**Disposition:** retained.

## Historical provenance

This is the actual Sep. 9 / quotient-native forced-macro idea, not the rejected one-child control-flow rewrite from cycle reduction 116.

CPC-proved forced states remain exact-cache probed and CPC-evaluated, but a nonterminal forced child advances inside the same `searchCpcOnly` invocation. Negamax sign/window, RBA frame offsets, reflection parity and live-line state are carried forward. Intermediate forced parents are not recursively returned through or exact-cache-published merely because a later state resolves.

Forced terminal cofactors and CPC/cache exact results still terminate exactly; ordinary branching and live-line move ordering begin only at the first genuine branch state.

## Qualification

Verify run `36081888050`: success.

Search-level B/C/C/B `36081882821`:

- CPC-only aggregate warm median **-5.84%**;
- cold elapsed +14.08% (microbenchmark conflict);
- nodes/cofactors/CPC forced events/cache hits identical;
- cutoffs reduced because forced-parent return frames no longer record separate alpha-beta cutoffs.

Whole-solver qualification therefore decided retention.

Same-runner Fhourstones B/C/C/B:

- Connect4 branch `benchmark/isomax-cpc-forced-macro-ab-20260924`;
- benchmark commit `77083f4ec26a3d1c5cbffc5c163d77d44953c9dc`;
- workflow run `36081956625`;
- input `45461667`.

Every phase returned exact +1, move 3, with identical:

- alpha-beta nodes: 806,844;
- cofactors/transitions: 807,290;
- cache hits: 351,277;
- CPC calls: 455,568;
- CPC exact: 26,008;
- CPC bounds: 10,542;
- CPC restrictions: 96,912;
- CPC forced events: 100,640;
- CPC precursors: 65.

Cutoffs changed from 274,452 to 230,273 (**-16.10%**) because deterministic forced-parent cutoff frames are no longer separate returns.

| Metric | Baseline mean | Forced macro mean | Effect |
|---|---:|---:|---:|
| wall | 1704.8581 ms | 1633.9656 ms | **-4.16%** |
| solver elapsed | 1694.8658 ms | 1624.8730 ms | **-4.13%** |
| CPU ms | 1961.5 | 1844.0 | **-5.99%** |
| CPU cycles | 4,771,641,575.5 | 4,655,640,767 | **-2.43%** |
| cycles / alpha-beta node | 5913.96 | 5770.19 | **-2.43%** |

## Interpretation

The historical distinction is confirmed again: merely special-casing one child was slower, while eliminating the forced recursive return/publication topology is faster. On this control, exact-cache hit count is unchanged, so the removed forced-parent publications did not buy reuse during the solve.

## Next CPC target

Inspect whether work computed while building each RBA child basis—especially singleton/pair/triple cardinality boundaries—can be carried into CPC instead of rediscovered by CPC prefix scans. This is preferable to another syntax-level micro-pruning pass.