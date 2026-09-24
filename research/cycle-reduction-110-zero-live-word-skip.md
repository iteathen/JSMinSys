# Cycle reduction 110 — zero-word live-line popcount skip

**Date:** 2026-09-24  
**Candidate:** `70d11cd9741ed7544603f8840fb83ed29f9d925f`  
**Baseline:** `2553020fabfb966480843b8bae8d561638f101df`  
**Disposition:** rejected; source, ledger and A/B workflow restored.

## Candidate

The standard 7x6 three-word incidence field has many cell/word pairs whose prepared `through` mask is identically zero. Static geometry analysis gives:

- 5/42 cells requiring one nonzero incidence word;
- 28/42 requiring two;
- 9/42 requiring all three.

The candidate added immutable-mask branches to skip SWAR `popcount32` calls on zero words.

## Qualification

Same-runner B/C/C/B run `36067824594` preserved identical search work but was strongly adverse.

Production `cpc-alpha-beta`:

| Metric | Baseline | Candidate | Effect |
|---|---:|---:|---:|
| nodes | 1,525 | 1,525 | unchanged |
| cofactors | 1,539 | 1,539 | unchanged |
| aggregate warm-median sum | 1.622974 ms | 2.089823 ms | **+28.77%** |
| aggregate cold elapsed sum | 7.026169 ms | 8.793277 ms | **+25.15%** |

Paired warm results were both adverse:

- B1 1.320206 ms -> C1 2.179077 ms: **+65.06%**;
- B2 1.925742 ms vs C2 2.000569 ms: candidate **+3.89%**.

The frontier-response and Four-Front controls were adverse as well.

## Interpretation

The static cycle model correctly exposed fewer popcount calls but did not capture enough of the emitted-code/control-flow penalty to make this form profitable. Do not reintroduce per-word zero branches in the live-line scorer.

The next scorer pass should stay branchless.
