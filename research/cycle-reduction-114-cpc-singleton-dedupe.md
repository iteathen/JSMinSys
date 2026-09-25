# Cycle reduction 114 — remove impossible CPC singleton dedupe

**Date:** 2026-09-24
**Candidate:** `a32a23de4188237b17edbe94ebe8558e54d61396`
**Baseline:** `3329a3ac3faa5179b64ff12b50cc04c86ce4f8f2`
**Disposition:** retained.

## Structural invariant

RBA basis IDs are emitted from a seen set and are therefore unique. Singleton shape identity is exactly the physical cell id. Therefore, after `coordHas` succeeds for a singleton basis entry, `collectPlayerSingletons` cannot have inserted the same cell earlier in the same pass.

The candidate removes the impossible `bits[word]&mask` duplicate guard while retaining the bitset write, because later CPC support-lift and fork-preemption closure consume that active-singleton-cell set.

## Qualification

Verify run `36080725420`: success.

Same-runner search B/C/C/B `36080724095`, production CPC-only:

- nodes/cofactors/forced/precursor counters identical;
- aggregate warm-median sum: 1.172782 -> 1.023633 ms (**-12.72%**);
- paired warm comparisons: **-15.33%** and **-10.48%**;
- cold elapsed was noisy/adverse (+6.62%), motivating the whole-solver control.

Same-runner whole-solver Fhourstones B/C/C/B:

- Connect4 branch `benchmark/isomax-cpc-singleton-dedupe-ab-20260924`;
- benchmark commit `90ad109d3e66ebd38fbbb595912400c9a2a5e27a`;
- workflow run `36080807337`;
- input `45461667`.

Every phase returned exact +1, move 3, with identical 806,844 alpha-beta nodes, 807,290 cofactors/transitions, 274,452 cutoffs, 351,277 cache hits, 455,568 CPC calls, 100,640 CPC forced events, and 65 CPC precursors.

| Metric | Baseline mean | Candidate mean | Effect |
|---|---:|---:|---:|
| wall | 1637.5822 ms | 1624.5699 ms | **-0.79%** |
| solver elapsed | 1628.0102 ms | 1615.5248 ms | **-0.77%** |
| CPU ms | 1875.0 | 1835.5 | **-2.11%** |
| CPU cycles | 4,590,139,471.5 | 4,531,617,656.5 | **-1.27%** |
| cycles / node | 5689.00 | 5616.47 | **-1.27%** |

The complete tree and CPC closure are unchanged; the improvement comes only from removing an impossible per-active-singleton test.

## Next target

Historical Sep. 9 residual search and Sep. 12 quotient-native Negamax both support true forced-chain macro compression: eliminate deterministic forced transit states rather than recursively admitting each as an ordinary search/TT node. This must be tested separately because historical evidence also showed that removed intermediate TT states can occasionally reduce reuse.