# CPC and hash revisit: final disposition

All four requested changes are enabled in the candidate at
`eefbdf5c33ee087f558541a29cdc6f1b3940cfab`. Correctness checks pass. The final
eight-run comparison measured **37.547 s baseline → 37.370 s candidate mean**,
a nominal **0.470% wall reduction** and **0.479% process-cycle reduction**.
The paired uncertainty spans both improvement and regression: this does **not**
establish a reliable additional speedup on this fixture.

The current generated entry remains `experiments/isomax-lean/host.mjs`, export
`runLazySmpConnect4Rba32`. Features are `cpc-fused`, `hash-inline`, `hash-index32`,
`live`, `layout` (the two hash flags implement one requested optimization).
This is a correctness-qualified experimental candidate with all four changes,
not a promotion of frozen main or a claim of newly proven performance.

| Requested item | Final implementation | Evidence |
| --- | --- | --- |
| Repeated CPC work | Singleton scan is in its sole caller; its stopping index and flags remain local. Fork derivation neither rescans that prefix nor clears already-cleared outputs. | Legal `5542` has one prefix visit and one clear; literal fork restrictions and immediate-win priority; randomized semantic comparisons and deterministic solver/cache equality. |
| General fourteen-iteration hash | Identical recurrence emitted directly in recursive search, with fixed integer frame addresses; no loop or hash helper call. | Actual emitted code compared with original at all 43 frame offsets over 250 random arrays; unchanged hash bits and TT slots. Compiler excerpts retain all 14 mixes and remove 13 address-overflow guards. |
| Three-word live-line loop | Six explicit writes in the original order. | Prior qualified change retained; in-place/disjoint update comparisons and solver tests pass. |
| Three separate shared-TT arrays | Sequence, value and eight exact key words in each 40-byte record. | Prior qualified change retained; identity, seqlocks, collisions, full-size backing/worker attachment tests. No layout modification in this revisit. |

## What was wrong with the first attempt

The original CPC candidate added packed return data and decoding while removing
the second scan. The revised implementation removes that interface work too.
Its standalone whole-solve gain remains unestablished; it is retained for the
verified elimination of redundant operations in the complete candidate, whose
final measured mean is slightly lower and whose timing remains inconclusive.

The first hash assessment missed a concrete compiler issue. The actual solver
trace shows the original general loop being inlined into search, while V8
refused to inline the unrolled helper because it exceeded the bytecode limit.
That helper therefore introduced a call boundary at the hot search site.
Moving the recurrence into the search function removed that boundary.

The next actual-machine-code inspection found thirteen overflow guards for
`keyOffset+lane`. This private standard-7x6 worker uses 43 frames of 14 words:
bases 0..588, indices 0..601. Explicit int32 address arithmetic preserves every
valid index and lets V8 remove those guards. Typed-array bounds checks, hash
values, exact identity and synchronization remain intact. This is a fixed
internal-frame contract, not a change to a general-purpose hashing API.

The isolated compiled-hash inspection alone had not established call-site
behavior. The actual solver trace was the missing check. Compiler traces are
mechanism evidence from small-cache fixtures, not full-size performance data;
the timed runs use no diagnostic compiler flags.

## Complete measurements, including inconclusive attempts

One declared warm-up was excluded. Then 32 scored full-size solves ran:

| Stage | Order and samples | Result |
| --- | --- | --- |
| Balanced screen | `ACHX / CXAH / HAXC / XHCA`; four per arm | A 37.517 s; fused CPC 37.488 s; unrolled helper 37.588 s; combined helper 37.512 s. All effects inconclusive. |
| Direct hash at search site | `ABBA / BAAB`; four per arm | Paired geometric improvement -0.134% wall, -0.169% cycles; intervals crossed zero. |
| Direct hash with integer addresses | `ABBA / BAAB`; four per arm | Mean improvement 0.470% wall, 0.479% cycles; intervals still crossed zero. |

Final raw runs:

| Run | Version | Wall seconds | Process cycles |
| --- | --- | ---: | ---: |
| 1 | Baseline | 37.5656864 | 530548876393 |
| 2 | Candidate | 37.3999144 | 527639013426 |
| 3 | Candidate | 37.2327176 | 526904674320 |
| 4 | Baseline | 37.7443918 | 533707231616 |
| 5 | Candidate | 37.5763212 | 531758484017 |
| 6 | Baseline | 37.4339959 | 529842199926 |
| 7 | Baseline | 37.4430602 | 529500018400 |
| 8 | Candidate | 37.2722187 | 527124256594 |

Three of four adjacent pairs favor the final candidate. Descriptive 95%
t-intervals on four pair log ratios are **-0.665% to +1.592% wall improvement**
and **-0.592% to +1.539% cycle improvement**. They assume approximately independent,
normally distributed pair effects and are not a strong statistical guarantee.
There is no arbitrary 1% rejection threshold. Nor is a slightly favorable mean
being promoted to a reliable speed claim. No further timed tuning is claimed.

## Correctness, environment and scope

All **199 tests pass**, plus **17 focused tests on the benchmark Node runtime**.
Reviews of fused CPC, direct hash, integer address bounds and the analysis
completion gate found no unresolved blocking issue. The analysis gate was
fixed after a failing regression demonstrated that sixteen `EXACT` rows alone
could previously be analyzed despite a failed final validation. Analysis now
requires the runner's matching successful completion record and source/result/
cleanup gates. `VERIFICATION.json` and raw test output accompany this report.

Every scored run passed all seven local controls, calculated five structural
moves with no search, then ran exactly one search from `44444` at ply 6. All
returned exact root WDL +1 and column 4 (zero-based 3), with all four workers
exited and no cleanup errors. This is not full-game self-play. The interval
includes structural work, host allocations, worker creation, search and cleanup,
using the existing cold-invocation benchmark contract. Worker lifecycle was not
redesigned. No counters, logging or clocks were added inside recursive search.

Same environment/configuration throughout:

- Intel Core i5-12600K, four deep workers, zero wide.
- Actual pinned group-0 logical processors 0/2/4/6 verified for every run.
- Node v27.0.0-nightly20260928b59840b593; V8 14.6.202.34-node.36.
- Shared TT 134217728 entries = 5 GiB; private 16777216 = 576 MiB per worker.
- rootFrontier false, sharedSampleMask 0, 300-second safety ceiling.
- Candidate peak RSS 7,905,300,480 bytes, approximately 7.362 GiB.
- Node counts and cache occupancy remain unmeasured. No background-load or
  frequency isolation is claimed. No intentional runtime/cache/affinity deviation.

Baseline revision: `f35c7e352e8178abb23b380d6ab7afe4962ebe22` (already includes
the qualified live/layout changes). Final candidate revision:
`eefbdf5c33ee087f558541a29cdc6f1b3940cfab`. Controller revision and raw process
outputs are in `manifest.json` and `raw.jsonl`. Do not add this nominal result
to earlier speedups measured in separate comparisons.

Production `addons/`, source library, BSFP and main were not modified. This
candidate and all evidence are on `codex/isomax-four-inefficiencies-20261002`.
Prior snapshots and trial worktrees are retained for exact replay; unsuccessful
approaches remain in history rather than being erased.

Earlier complete evidence: `../isomax-cpc-hash-revisit-20261002/`,
`../isomax-cpc-hash-inline-confirm-20261002/`, and the declared warm-up in
`../isomax-cpc-hash-revisit-warmup-20261002/`. Compiler comparison excerpts are
in `../isomax-cpc-hash-inline-confirm-20261002/HASH_INDEX_COST.json`.
