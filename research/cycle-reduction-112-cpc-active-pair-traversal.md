# Cycle reduction 112 — active-pair CPC fork traversal

**Date:** 2026-09-24
**Candidate:** `d3d5aa1fd826ef0ffe6be1b79c0ba771d89ec639`
**Baseline:** `8fd2e878efc01be6a38310caed3ee28543dd4f62`
**Disposition:** rejected; runtime source/ledger/workflow restored.

## Candidate

Fork-preemption enumerated only coordinate bits active for mover or attacker, instead of scanning every pair-basis entry and calling `coordHas`. `forkTargets32` clearing was also delayed until a qualifying precursor pair existed.

The representation idea came directly from the packed active-coordinate traversal already used by CPC paired-response closure and from historical fixed-width minimax tactical bitboards.

## Qualification

Verify run `36080211308`: success.
Same-runner B/C/C/B run `36080207617` preserved all observed search/CPC counters exactly.

Production `cpc-alpha-beta`:

| Metric | Baseline | Candidate | Effect |
|---|---:|---:|---:|
| nodes | 1,525 | 1,525 | unchanged |
| cofactors | 1,539 | 1,539 | unchanged |
| fork precursors | 0 | 0 | unchanged |
| forced CPC events | 305 | 305 | unchanged |
| aggregate warm median | 1.492178 ms | 1.665716 ms | **+11.63%** |
| aggregate cold elapsed | 7.052981 ms | 6.709609 ms | -4.87% |

Warm pairs were mixed: -7.20% then +35.95% candidate. The benchmark cohort exercised zero fork precursors, so the experiment primarily measured enumeration overhead on ordinary no-precursor calls.

## Interpretation

Set-bit traversal is not automatically cheaper in V8 than a short sorted vocabulary scan. Do not replace the current fork pair scan with this form without a precursor-heavy workload and a materially cheaper active-bit decoder.

The next CPC passes should target unconditional/recurrent work in ordinary nodes rather than a rare precursor path.