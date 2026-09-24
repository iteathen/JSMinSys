# Cycle reduction 108 — best-first live-line ordering

**Date:** 2026-09-24  
**Candidate:** `a32ad36a08c15bb50e2a7050229a64c0d05daa6d`  
**Baseline:** `b84a5a6e50ce8b18fd8dc4586c0890b690288bf1` with documentation-only descendant `b615e5da...`  
**Disposition:** rejected; source/ledger/workflow restored to the fused-transition baseline.

## Candidate

Recovered from the Sep. 9 residual-ordering experiment: score all CPC-surviving live-line moves, select only the highest-scoring move first, and leave the remaining siblings in prepared center order instead of repeatedly selecting the full score order.

No score semantics, CPC restriction, cofactor/canonicalization rule, cache rule, or alpha-beta window was changed.

## Qualification

JSMinSys Verify run `36064739719`: success.

Same-runner B/C/C/B run `36064734280` compared the candidate against the fused live-line baseline.

Production `cpc-alpha-beta` aggregate:

| Metric | Baseline | Candidate | Effect |
|---|---:|---:|---:|
| nodes | 1,525 | 1,493 | -2.10% |
| cofactors | 1,539 | 1,507 | -2.08% |
| warm-median sum | 1.004550 ms | 1.212325 ms | **+20.68%** |
| cold elapsed sum | 5.366665 ms | 6.213157 ms | **+15.77%** |

Both paired warm comparisons were adverse:

- B1 0.997219 ms -> C1 1.117588 ms: **+12.07%**;
- B2 1.011881 ms vs C2 1.307061 ms: candidate **+29.17%**.

The candidate therefore demonstrates the same broad warning as earlier residual experiments: fewer nodes do not justify a more expensive ordering implementation.

## Interpretation

This tested form is rejected. The likely cost is not the one best-move selector itself; it is the additional second pass needed to materialize the center-ordered remainder after the scoring pass, plus changed search order among siblings. Do not reintroduce this exact two-pass best-first form without a structurally cheaper way to expose the remainder.

The retained baseline remains the fused live-line transition from cycle reduction 107.
