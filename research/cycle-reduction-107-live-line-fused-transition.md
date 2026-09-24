# Cycle reduction 107 — fused Connect4 live-line transition

**Date:** 2026-09-24  
**Branch:** `experiment/connect4-managed-runtime-v1`  
**Candidate:** `b84a5a6e50ce8b18fd8dc4586c0890b690288bf1`  
**Baseline:** `f191c5f2885d9ae0a966096c1616d597f7fbc58c`  
**Disposition:** retained.

## Recovered lineage

This optimization is not novel. It requalifies the retained Sep. 12 Connect4 frontier transition shape from:

`iteathen/Connect4@44a1a2c572fff2cd9dfe931077f275e5836a2956`.

The current JSMinSys hot contract is narrower than the historical general helper: recursive frames are disjoint and root replay may be exactly in-place; partially overlapping unequal ranges are unsupported. Because the two player slices do not overlap, both supported cases can use one fused loop without historical overlap/memmove machinery.

## Change

Prior transition:

1. copy all `2*W` live-line words;
2. reread the blocked player's `W` words;
3. mask and rewrite those `W` words.

Candidate transition, one loop per line word:

- copy the mover word unchanged;
- write the opponent word directly as `sourceOpponent & ~throughCell`.

For standard 7x6 (`W=3`), the mechanical ledger delta is:

- one fewer runtime field load;
- three fewer u32 loads;
- three fewer u32 stores;
- one fewer scalar add under the current decomposition;
- two loop test/branch sequences removed;
- one extra integer multiply for the mover slice base.

All changed operations were ledgered in the same commit and the decomposed source blob guard was refreshed.

## Qualification

JSMinSys Verify run `36064033790`: success.

Same-runner B/C/C/B search A/B run `36064027070`, baseline `f191c5f2...`, candidate `b84a5a6e...`:

- production `cpc-alpha-beta` search work was identical;
- aggregate warm-median sum: `1.725912 ms -> 1.584927 ms` (**-8.17%**);
- paired warm sums favored the candidate in both directions: **-9.80%** and **-6.66%**;
- aggregate cold elapsed sum was effectively noisy/flat: **+0.74%**;
- Four-Front results were mixed/adverse, but the production CPC-only recursive path is the target and owns this live-line transition.

## Whole-solver Fhourstones control

Connect4 isolated benchmark branch:

`benchmark/isomax-fhourstones-live-line-fused-first-20260924`

Benchmark commit:

`fda89b0e7758497c0b6d85f4fdb5f92efc62159a`

Workflow run:

`36064287955`

Input `45461667` remained exact `+1`, move `3`, with identical search work:

- alpha-beta nodes: `806,844`;
- cofactors/transitions: `807,290`;
- cutoffs: `274,452`;
- cache hits: `351,277`;
- CPC calls: `455,568`.

Compared with the prior live-line checkpoint `b1286a3c...` / run `36052795730`:

| Metric | Baseline | Fused | Effect |
|---|---:|---:|---:|
| wall | 1820.8976 ms | 1684.572 ms | -7.49% |
| CPU ms | 2032 | 1968 | -3.15% |
| CPU cycles | 5,144,835,720 | 4,757,539,666 | -7.53% |
| cycles / alpha-beta node | 6376.49 | 5896.48 | -7.53% |

The tree reduction from live-line ordering is preserved exactly; this change removes implementation cost only.

## Next constraint

Keep this candidate. The next recovered optimization to test is partial/best-first ordering versus eagerly materializing the complete scored sibling order. Do not recompute RBA child transitions merely to score moves.
