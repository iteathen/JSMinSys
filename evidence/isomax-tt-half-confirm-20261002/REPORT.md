# Repaired 32-byte TT after NEES cost audit

The first 32-byte implementation had a real implementation defect: full-size
byte indices crossed the qualified V8 small-integer range and introduced boxed
Numbers at Atomics calls. No explicit encoder had been added, but runtime work
had been added. The previous small-cache inlining check was insufficient.

The repaired layout retains 32 bytes and direct native field access. It uses
Uint16 for both heights, the tail and exact WDL, with Uint32 sequence/support/full
coordinates. At 134217728 slots its largest halfword index is 2147483647, inside
the observed Smi domain. Exact WDL is only 1/2/3; no semantic value is truncated.
The sequence counter retains all 32 bits and its original publication/rollover.
One additional array view is eliminated; there is no key encoding/decoding.

## Results

One declared unscored warm-up: 37.271690 s. Eight scored solves ABBA BAAB:

| Run | Entry | Wall seconds | Process cycles |
| --- | ---: | ---: | ---: |
| 1 | Baseline 40 B | 37.734687 | 533247291053 |
| 2 | Repaired 32 B | 37.257120 | 525521862673 |
| 3 | Repaired 32 B | 37.048234 | 524381653076 |
| 4 | Baseline 40 B | 37.387150 | 528898825199 |
| 5 | Repaired 32 B | 37.288943 | 527155836842 |
| 6 | Baseline 40 B | 37.378986 | 528333059652 |
| 7 | Baseline 40 B | 38.348988 | 542338596184 |
| 8 | Repaired 32 B | 37.908100 | 536051878593 |

Mean wall time: **37.712453 → 37.375599 s**, **0.893% lower**.
Mean process cycles: **533204443022 → 528277807796**, **0.924% lower**.
All four matched pairs favor the repaired layout. Descriptive paired-log 95%
t intervals: **0.161–1.617% wall improvement**, **0.084–1.753% cycle improvement**.
These are small-sample, single-host estimates, not a universal or robust guarantee.
No background-load/frequency isolation or hardware stall counters are claimed.

Equal shared slot capacity (134217728) deliberately changes shared bytes from
5 GiB to 4 GiB. Private capacity remains 16777216, 576 MiB per worker.
Peak scored RSS: baseline 7905153024 bytes (~7.36 GiB); candidate 6831788032 bytes
(~6.36 GiB). This is not an equal-byte-budget comparison.

Disposition: retain the repaired candidate, supersede the first byte-index
implementation, and preserve both evidence sets. The main branch is unchanged;
this result is not a main promotion. Do not compare old/new campaign minima or
attribute the entire cross-campaign timing difference solely to the repair.

## Controlled mechanism evidence

The diagnostic invokes the actual shared TT accessors for 200000 store/probe
pairs on the full-size allocation, with small payloads to isolate address boxing.
Whole diagnostic process Scavenge counts:

- 40-byte baseline at highest slot: 4.
- First 32-byte version at low slot: 4.
- First 32-byte version at highest slot: 29.
- Repaired 32-byte version at highest slot: 4.

`%IsSmi` confirms the byte/halfword index distinction on this exact runtime.
The full-size regression rejects the old view's index domain and passes after
repair; last-slot parent/worker publication still passes. Equal GC counts do not
claim zero allocation throughout the solver or measure full-solve GC cost.

Final compiler evidence includes both the actual solver's probe caller and the
repaired accessor exercised at the full-size highest slot. Probe/store still
inline into callers. Representative first caller code sizes are 3780 bytes for
baseline, 3816 bytes repaired; the first narrow variant sample was 3848 bytes
(later optimized versions differ). Code size is diagnostic, not cycle proof.
Atomics builtins and guards remain explicit costs; no claim of a single native
instruction per source Atomics call is made.

Raw GC/regression/compiler evidence resides in
`../isomax-tt-nees-audit-20261002/`. The executable diagnostic is
`experiments/isomax-tt-layout/inspect-index-domain.mjs`; run with the recorded
nightly Node and `--allow-natives-syntax --trace-gc --trace-deopt`. These flags
are never used in scored runs or imported by workers.

## Scope and integrity

NEES authority: live Draft 0.5, `iteathen/NEES` revision
7650bef0aecc0d2b226ecf253a1f8937ccf89d69. Scoped method/rule dispositions,
admission/falsifier, exact runtime, E0/E1/COLD boundaries, symbolic execution
ledger, causal role and requalification triggers are in
`experiments/isomax-tt-layout/NEES_REVALIDATION.md`.

202 full tests pass on Node 26.7.0; 15 focused tests pass on the benchmark nightly.
Read-only code review found no blocking runtime defect. Its record findings were
addressed: historical plan marked superseded, formal scope added, final repaired
compiler artifacts captured after timing. Outstanding inherited bounds-guard,
payload-boxing and builtin-cost questions are recorded, not declared free or
silently classified as unavoidable. This is not a new whole-solver NEES seal.

Runtime remains the Intel i5-12600K, Windows 10.0.26200 x64,
Node v27.0.0-nightly20260928b59840b593, V8 14.6.202.34-node.36.
Four deep workers, no wide, original affinity preload/targets; actual logical
P-core processors 0/2/4/6 verified for every run. rootFrontier false,
sharedSampleMask zero, 300-second per-solve safety ceiling.

All seven controls pass. Each run computes five structural moves without search,
then makes one exact search at ply 6 from `44444`, returning WDL +1 and column 4.
Every run closes all four workers without errors and finishes below 60 seconds.
The measured operation is structural-prefix plus one root solve, not self-play.
Timing includes host allocation/startup and cleanup, matching the prior contract.
No hot reporting, search policy, move ordering, hash, private cache, CPC, BSFP or
production `addons/` / `src/` changes. Generic dimensions retain the cold-selected
TT path; the timed lean solver remains its pre-existing 7x6 specialization.

Baseline runtime: cbc4ddf995be83334ea26190c749028435e353fa.
Repaired runtime: 4e7af0e74b82b6bb70fef94a211196b4235a4039.
Controller: c77f4b3f54826bb57fea3f6fd1a6d4489e38bfc0.
Later changes are evidence/tests/docs, not measured runtime changes.
`manifest.json`, `samples.jsonl`, `raw.jsonl`, affinity files, `SUMMARY.json` and
`BLOCK_ANALYSIS.json` preserve the complete scored experiment.
