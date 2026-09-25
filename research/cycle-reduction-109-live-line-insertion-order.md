# Cycle reduction 109 — insertion-order live-line moves

**Date:** 2026-09-24  
**Candidate:** `bd53c725649ee61c336fb9b1d438afa99841765b`  
**Baseline:** `03d329882d1dede5d677c8d07ab07b363e021489`  
**Disposition:** retained.

## Recovered lineage

This pass reuses the fixed-width exact-solver ordering shape preserved in the Sep. 8 Connect4 minimax lineage: as each numeric move score is produced, stably insertion-order the move into preallocated per-depth storage.

Unlike rejected best-first cycle reduction 108, this preserves the **complete live-line order**, not only the first move.

## Change

Prior production recursion:

1. score all configured/legal moves into a scratch score array;
2. repeatedly call a full-width argmax selector once per legal move;
3. mark the selected score as unavailable;
4. materialize the complete per-depth order.

Candidate production recursion:

1. score each legal move once;
2. immediately insert it into the per-depth ordered row;
3. shift only preceding lower-score entries.

The insertion condition stops on `priorScore >= score`, so equal live-line scores retain the prepared center-first order exactly.

The cycle ledger exposes:

- `J`: insertion score comparisons;
- `K`: successful insertion shifts.

No data-dependent insertion work is hidden as zero.

## Qualification

JSMinSys Verify run `36067316744`: success.

Same-runner B/C/C/B run `36067310924`:

Production `cpc-alpha-beta`:

| Metric | Baseline | Candidate | Effect |
|---|---:|---:|---:|
| nodes | 1,525 | 1,525 | unchanged |
| cofactors | 1,539 | 1,539 | unchanged |
| aggregate warm-median sum | 1.378885 ms | 1.104559 ms | **-19.89%** |
| aggregate cold elapsed sum | 5.339476 ms | 5.243077 ms | -1.81% |

Both paired warm comparisons favored the candidate:

- B1 1.312029 ms -> C1 1.211840 ms: **-7.64%**;
- B2 1.445740 ms vs C2 0.997278 ms: candidate **-31.02%**.

Cold elapsed pairs were mixed, so the whole-solver control remains the stronger promotion evidence.

## Whole-solver Fhourstones control

Connect4 isolated benchmark:

- branch: `benchmark/isomax-fhourstones-live-line-insertion-20260924`;
- commit: `d30c03229c619c7cd0999a739e869f09a0752aef`;
- workflow run: `36067437196`.

Input `45461667` remained exact `+1`, move `3`, with the same search work as the fused baseline:

- nodes: `806,844`;
- cofactors/transitions: `807,290`;
- cutoffs: `274,452`;
- cache hits: `351,277`;
- CPC calls: `455,568`.

Versus retained fused-transition baseline run `36064287955`:

| Metric | Fused baseline | Insertion order | Effect |
|---|---:|---:|---:|
| wall | 1684.572 ms | 1680.5991 ms | -0.24% |
| CPU ms | 1968 | 1890 | **-3.96%** |
| CPU cycles | 4,757,539,666 | 4,682,849,593 | **-1.57%** |
| cycles / node | 5896.48 | 5803.91 | **-1.57%** |

This candidate is retained because it preserves the complete search order and tree exactly while reducing total process cycles.

## Next target

The next pass should attack the live-line score itself. Standard 7x6 currently pays three fixed 14-cycle SWAR `popcount32` calls for every scored candidate cell. Any replacement must preserve exact score semantics and remain cheaper under measured live-mask sparsity rather than assuming sparse popcount is universally superior.
