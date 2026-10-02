# Hot-loop cleanup qualification

Measured solver revision: `136226250a3f23c78f625668edf5ffa9ce51c27c`.
Candidate entry point: `experiments/isomax-lean/host.mjs`.
Frozen main remains `e76e9ab3ca0e7a292badf9d9ac38a811d7971c99`.

The final candidate removes shared statistics atomics, per-node diagnostic
updates (including CPC precursor counts), frontier machinery and invariant
configuration/scratch-option checks from the four-deep search path. TT
seqlocks, exact/bound publication, move ordering and STOP checks remain.
`addons/cpc-connect4.mjs`, all original solver files and BSFP were not modified.

## Final ABBA measurement

| Arm | Wall ms | Process cycles | Process CPU ms | Peak RSS bytes |
| --- | ---: | ---: | ---: | ---: |
| Original four-deep A | 42823.9681 | 604444101736 | 163751 | 7904579584 |
| Cleanup B | 39518.9274 | 558655291319 | 151124 | 7901597696 |
| Cleanup B | 39728.9330 | 561968613884 | 151813 | 7904120832 |
| Original four-deep A | 43299.3923 | 612600997210 | 166625 | 7904538624 |

Mean wall time: **43061.6802 → 39623.9302 ms**, a **7.9833% reduction**
in this two-sample-per-arm comparison. Both cleanup runs completed below 60 s.
This is local evidence, not a universal or statistically robust speed claim.

All seven structural controls passed. Every measured run started empty,
computed five structural moves without search, reached `44444`, and invoked
one exact search at ply 6. All returned root W/D/L `+1` in the absolute P1
gauge and selected zero-based move `3` (column 4). This is one root solve,
not a complete self-play game. No runtime W/D/L oracle supplied the moves.

Configuration: Intel Core i5-12600K; four deep workers, zero wide; confirmed
logical processor targets 0/2/4/6; Node
`v27.0.0-nightly20260928b59840b593`, V8 `14.6.202.34-node.36`;
shared capacity 134217728 (5 GiB), private capacity 16777216 (576 MiB each),
shared sample mask zero. Per-search safety ceiling 300 seconds. No configured
runtime, cache or affinity deviation. Raw per-run environment/free-memory
records and obtained affinity are retained alongside the samples.

Timing includes the structural prefix and complete host invocation, including
allocation, worker initialization and cleanup, as in the baseline. It excludes
external process setup, imports, control checks and cycle-meter initialization.
CPU/cycle accounting is read only outside search. Peak RSS is whole-process
high-water accounting. Exact node/hit/store counts are intentionally `null` in
the candidate: collecting them would reintroduce hot-loop reporting.

## Correctness and review

All **189 tests passed** on Node 26.7.0. All seven candidate tests also passed
on the benchmark nightly. Differential tests compare W/D/L, selected moves,
private TT keys/tags and shared TT keys/sequence/value contents across four
worker orderings and mirrored fixtures. Separate tests compare CPC semantic
outputs over deterministic legal walks, cache collisions, STOP/reuse and
host timeout/cleanup. A transitive source audit checks the recursive call graph
for reporting, clocks, allocations and other forbidden runtime machinery.

Independent code review caught and resolved a remaining diagnostic precursor
counter and invariant scratch-option branches before this final measurement.
The follow-up review found no blocking issue. These checks do not constitute
an exhaustive concurrency proof or machine-code proof of zero overhead.

The earlier counter-only implementation and its measurements are preserved in
`../isomax-hot-loop-cleanup-20261002/`, keyed to its separate source revision.
They are not substituted for the final candidate evidence above.
