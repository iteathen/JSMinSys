# Four-item optimization result

The selected live-update plus TT-layout candidate completed the same computed
empty-board structural prefix and one exact root solve in **37.690 s mean**,
versus **39.676 s** for the preceding lean baseline: **5.004% less wall time**
and **5.046% fewer process CPU cycles**. All four confirmation runs were exact
and agreed on root WDL +1 and column 4 (zero-based move 3).

This is one solve from `44444` after calculating five structural moves from
empty, not a full self-play game. All seven controls passed in every sample;
the first five moves were computed without search and the single search began
at ply 6. The timed interval includes the structural calculations, allocations,
worker creation, search and cleanup, matching the baseline measurement. No
persistent-worker lifecycle redesign was made in this experiment.

## Selected runtime

Candidate: `8812c9db16c45852fe03d6d445ce54a1ecec5de7`.
Baseline: `ec1648fc93a6c8c4c4e282c1a7e09448c4d8363c`.
Entry: `experiments/isomax-lean/host.mjs`, `runLazySmpConnect4Rba32`.
Build-time selection: `experiments/isomax-lean/features.json` = `live, layout`.

| Proposed change | Individual screen: wall reduction | Cycle reduction | Decision |
| --- | ---: | ---: | --- |
| CPC reset removal and singleton-boundary reuse | -0.267% | -0.325% | Disabled: no measured gain |
| Identical fourteen-word hash, unrolled | 1.398% | 0.983% | Disabled: missed predeclared >1% cycle threshold |
| Fixed three-word live-state update | 3.480% | 2.257% | Retained |
| Interleaved shared TT records | 8.443% | 7.264% | Retained |

The initial screen used A C H L T T L H C A. The baseline drifted from
42.516 to 39.779 seconds, so those individual estimates are provisional and
must not be added together. The separately frozen combined confirmation used
A B B A, with these raw wall times:

| Run | Runtime | Wall seconds | Process cycles |
| --- | --- | ---: | ---: |
| 1 | Baseline | 39.6211021 | 559041456882 |
| 2 | Selected | 37.6239502 | 530554033607 |
| 3 | Selected | 37.7562286 | 533699496663 |
| 4 | Baseline | 39.7302037 | 561767828204 |

Two samples per runtime on one machine support this local comparison, not a
universal speed claim. Node counts and TT occupancy remain unmeasured; no
per-node instrumentation was added. Reduced process cycles do not by
themselves prove a particular reduction in hardware cache misses.

## Correctness and memory

All 193 tests passed on Node 26.7.0; all 11 focused tests passed on the recorded
benchmark runtime. Differential tests compare root results and moves, logical
private/shared cache contents, CPC intervals and masks, live-state updates,
and exact hash bits. Gray-owner-equivalent positions reuse the same TT entry.
Concurrent collision stress, STOP/reuse and timeout cleanup also passed.
Independent review found no blocking issue in the selected revision. Full
verification details and test outputs are adjacent to this report.

The TT now places sequence, value and eight exact key words in each 40-byte
record. Entry count, key comparison, hash slot, atomic operations and
publication order are preserved. The live update writes the identical six
words in the identical order without a three-iteration loop. CPC and hashing
in the selected runtime are unchanged from the baseline.

A separate explicit full-size check verified two-way parent/worker publication
at the last entry of the 5 GiB shared allocation. This Node nightly cloned a
truncated typed-array view; cold attachment restored the complete view over
the same full backing, without copying or allocation of another TT. This
attachment behavior was already handled for the baseline layout. The selected
layout passes that check too. The check used synthetic key/value data outside
the solver and supplied no runtime WDL premise.

Peak RSS for the selected runs was **7,904,690,176 bytes (about 7.362 GiB)**.
No memory-capacity or worker-placement deviation occurred:

- Intel Core i5-12600K; Windows build 10.0.26200.
- Node v27.0.0-nightly20260928b59840b593; V8 14.6.202.34-node.36.
- Four deep workers, no wide worker; actual group-0 logical targets 0/2/4/6.
- Shared TT: 134217728 entries, 5368709120 bytes (5 GiB).
- Private TT: 16777216 entries, 576 MiB per worker.
- rootFrontier false; sharedSampleMask 0; 300-second solve ceiling.

This is the current four-deep, 5 GiB comparison, not the older 10 GiB,
one-wide/three-deep campaign. No background-load/frequency isolation is claimed.
Frozen main, production addons/CPC, source library and BSFP were not modified.
The optimized candidate and evidence are on
`codex/isomax-four-inefficiencies-20261002`; main has not been promoted.

Machine-readable records: `SUMMARY.json`, `samples.jsonl`, `raw.jsonl`,
`manifest.json`, `VERIFICATION.json`, and per-worker affinity records.
The initial screen and excluded variants are preserved under
`../isomax-four-items-screen-20261002/` and in Git history.
