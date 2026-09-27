# IsoMax plan-application factorial — 2026-09-27

Status: Stage-3 screen complete; no production promotion.

## Arms

A — current support-plan hit with N-slot scan + C1
`8d9b3dd2c353a8162addd1a4babbedd84d68f18b`

B — N-slot scan, no C1 principal-bit probe
`6df3bfb64026006eac184e2abdc900c28e67a103`

C — sparse live-bit iteration, C1 retained
`b1b3b9198cb963afad07cf18a1ab9dc68c1bd561`

D — sparse live-bit iteration, no C1 probe
`b6a87d308bcb75323c15404ed8fd5a166c9feecf`

All three candidate branches passed Verify/schema/node-compatibility before
timing. All include matching cycle-ledger changes.

Workflow: `IsoMax plan-apply factorial`
Run: `36347001146` — success.
Artifact: `10941176373`.
Digest:
`sha256:8a72a3dfdaa566c65b5447c248d3d19c6fd9f9ec51503977a4289fd32665db5a`.

## Long control — 353335714

Eight Williams-balanced blocks, 32 fresh Windows processes.

Every arm has exactly identical:
- WDL and root move;
- 11,755,731 nodes;
- 11,813,310 cofactors;
- cutoffs/cache hits/CPC metrics;
- plan count 137,900;
- fixed plan bytes 295,164,676.

| Arm | Mean solve cycles | cycles/node | wall ms | paired cycles vs A |
|---|---:|---:|---:|---:|
| A scan+C1 | 25.014 B | 2127.79 | 10061.01 | reference |
| B scan/no-C1 | 24.792 B | 2108.90 | 9976.64 | -0.89% |
| C setbits+C1 | 24.234 B | 2061.45 | 9735.83 | **-3.11%** |
| D setbits/no-C1 | **23.696 B** | **2015.70** | **9508.75** | **-5.27%** |

Paired descriptive 95% intervals:
- B cycles: [-2.31%, +0.53%] — no established gain;
- C cycles: **[-3.83%, -2.40%]**;
- D cycles: **[-5.56%, -4.97%]**.

D wall delta: **-5.49%** [-5.88%, -5.09%].
D CPU delta: **-5.53%** [-6.23%, -4.82%].

Interpretation:
- scanning every parent basis slot is measurably wasteful once the current q
  already represents activity as coordinate bitsets;
- removing C1 alone is small/noisy;
- after sparse iteration, removing the C1 principal target-bit probe is useful:
  fixed three-word immutable closure ORs are cheap enough that the guard no
  longer repays its branch/load cost on this workload.

## Short control — 45461667

Four blocks / 16 fresh processes. Exact search work remains identical.

D cycles vs A: +0.25%, interval [-5.33%, +5.83%].
No short-control regression or improvement is established for Stage 3.

The larger short-work problem remains the plan mechanism itself, which previously
regressed versus direct dense recomputation.

## Campaign progress

Use paired ratios, not absolute cycles across GitHub VM jobs.

Qualified/screened sequential effects on the same exact search method:
- Stage 1 dense-both+C1 vs original C1: factor ~0.9212;
- Stage 2 support-plan vs dense-both+C1: factor ~0.7014;
- Stage 3 sparse/no-C1 plan apply vs plan baseline: factor ~0.9473.

Product: about **0.612 of the original C1 worker cost**, i.e. approximately
**38.8% reduction** so far.

To reach the owner's >=50% target from the current Stage-3 candidate requires
about another **18% reduction of the remaining kernel cost**.

## Next structural target

The current plan stores closure geometry indexed by *child image*. Therefore a
hit still must:
1. decode parent index -> image index from `map`;
2. decode unchanged survival;
3. compute image closure address.

A support plan can instead store the already-expanded closure directly at each
parent-basis index plus an immutable per-plan unchanged bit mask. This preserves
the same information boundary while removing map lookup/image-index decode from
every live parent bit. The closure arena size need not increase because both the
parent basis and child-basis closure arenas are bounded by `maxBasis`.

Test that representation next, then profile again before attempting deeper
changes.
