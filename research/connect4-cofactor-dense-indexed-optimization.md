# Connect4 dense-indexed cofactor optimization

**Date:** 2026-09-25 America/Los_Angeles  
**Baseline:** `04d37498607ace16dae33c79462ddfe1503c8a0d`  
**Accepted candidate:** `7f0c47b0e38d37846ff73bcda699b4c8c4040545`  
**Qualification:** exactly 4 Lazy-SMP workers, shared-sample mask 7  
**Control:** Fhourstones `45461667`

## Why cofactor was selected

The IsoMax CPU census at Connect4 `e67cc501c0369ab7d18c1c2046a7c3b5abf1a09d`,
Actions run `36105982242`, profiled four exact four-worker solves.

Baseline self-time attribution identified:

- `connect4RbaCofactorKnownHeight`: ~46.10% of active sampled CPU;
- `connect4RbaCofactorBasis`: ~5.58%;
- `subsetDensePrepared`: ~4.97%;
- `removeDensePrepared`: ~2.42%;
- inclusive cofactor subtree: ~64.93%.

Winning workers averaged about 737k search nodes and 737k cofactors, making cofactor
work approximately one invocation per search node.

## Existing optimizations preserved

Historical work already provided:

- caller-known legal height;
- singleton shape id = physical cell identity;
- caller-owned removed-image scratch;
- caller-owned child id -> child index scratch;
- dense remove and subset tables selected at initialization;
- generic runtime-configured geometry fallback.

This campaign did not remove those contracts.

## Rejected intermediate designs

### Precomputed strict-superset adjacency

Candidate `c2ee1be63f33cefd90d19796196fe11497efbbfb` precomputed exact
strict-superset shape adjacency during cold geometry initialization and used the dynamic
child-basis membership bitset to skip broad subset tests.

JSMinSys verification was green, but two same-runner B/C/C/B attempts did not qualify it:
CPU improved slightly in one run while process cycles were nearly neutral and wall time
regressed. The added adjacency representation was therefore not retained.

### Isolated indexed superset fast path

Candidate `58b041fe34ca76c78084fba16d79f7b3589e0f6e` separated the optimized
indexed path from the generic cofactor to reduce V8 hot-function complexity.

Verification remained green, but the same-runner A/B traded metrics: wall improved while
process cycles regressed. This representation was also not retained.

## Accepted implementation

Candidate `7f0c47b0e38d37846ff73bcda699b4c8c4040545` instead exploits the
existing dense specialization directly.

The active standard-board solver/search path uses
`connect4RbaCofactorKnownHeightDenseIndexed`, which:

1. keeps the generic cofactor unchanged for unsupported/runtime-configured profiles;
2. directly consumes the existing `removeByCell` dense table;
3. builds the child basis and caller-owned removed-image map without profile callbacks;
4. fills the existing caller-owned child-index scratch;
5. preserves sequential child-basis traversal;
6. directly consumes the existing `subsetTable` rather than dispatching through
   `prepareSubset` / `shapeSubsetPrepared`;
7. falls back exactly to the generic cofactor when dense remove/subset specialization or
   the standard scratch contract is unavailable.

No new hot data structure or synchronization mechanism was added.

Cycle accounting for the new dense-indexed unit was added in the same commit. The generic
cofactor ledger remains intact.

## Qualification

JSMinSys Verify for `7f0c47b0`:
- Actions run `36152888445`: green.

IsoMax same-runner four-worker B/C/C/B:
- Connect4 workflow head `9958a0e979137f37a0d8e85523d14da8b259d216`;
- Actions run `36152954193`;
- run repeated once, yielding four baseline and four candidate measurements total;
- all samples: EXACT +1, move 3, oracle matched, cleanup true, four workers exited.

Across all four samples per side:

| Metric | Baseline average | Candidate average | Delta |
|---|---:|---:|---:|
| Wall | 2755.484 ms | 2441.825 ms | **-11.38%** |
| CPU | 9492.0 ms | 8668.5 ms | **-8.68%** |
| Process cycles | 23.746B | 21.676B | **-8.72%** |

The search tree remained materially the same; observed node-count variation matched normal
Lazy-SMP winner-worker variation rather than a changed solver or pruning rule.

## Post-change hotspot census

A candidate-only CPU census at Connect4
`a5bf99360226afb43723dcca02046d64346a58f8`, Actions run
`36153242207`, remained exact and clean.

The fused dense cofactor appears as ~61% self time because helper work previously sampled
under `connect4RbaCofactorBasis`, `removeDensePrepared`, and
`subsetDensePrepared` is now attributed directly to the fused parent frame.

Do not compare the absolute profiler cycle totals directly with the baseline census:
the baseline census ran on AMD EPYC 7763 while the post-change census ran on Intel Xeon
Platinum 8573C. Same-runner B/C/C/B is the performance authority.

The post-change census also identifies `emitSortedSetBits32` as the next prominent
cofactor-adjacent target (~7.57% self time).

## Disposition

**Retain `7f0c47b0` as the qualified cofactor optimization candidate.**

Do not resurrect either strict-superset-adjacency variant without new evidence. Further
cofactor work should preserve this dense-indexed baseline and measure changes against it.
