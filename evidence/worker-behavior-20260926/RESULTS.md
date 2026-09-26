# Optional worker behavior: component qualification

Implementation tested: `f648ff1d163885c4a3e935f3caa23beaf3196808`.
Base: `93aca1758718bcbf0635c11a957a67ca6387d50c`.
Host: Windows, Intel Core i5-12600K, Node 26.7.0 / V8 14.6.202.34-node.28.

## Correctness and accounting

- Full `node --test test/*.test.mjs`: 146 passed, 0 failed at the measured
  implementation; 147 passed after adding the review regression below.
- Catalog verification: 298 sealed functions, 118 add-on units cycle-ledgered,
  30/30 blocks complete, 0 deferred functions. This is not full NEES qualification.
- Tests exercise a real concurrent reader, deterministic publication overlap,
  extension truncation, all 124 payload bits, version exhaustion, unchanged
  ordinary Worker, and exactly one shared load on the primary-only path.
- Plain/direct/method primary checksums agree. Cycle partitions sum exactly.
- Independent code review found no blocking findings. Its additional regression
  is retained: publication after the initial primary load but before the version
  bracket must observe the new primary and coherent extensions for all four
  resulting chain lengths. Production code is unchanged after the cycle run.
- Existing worker/search implementations are unchanged; IsoMax does not yet
  poll these flags. No PFIF strategy or behavior meanings are implemented.

## Cycle probe

Run from the repository root on Windows:

```text
node --experimental-ffi tools/bench-worker-behavior.mjs 5000000 evidence/worker-behavior-20260926/cycles.json
```

Four ABBA blocks compare plain/check/check/plain, five million checkpoints per
sample. QueryProcessCycleTime includes process CPU work, including background
runtime activity. These are executed loop costs, not isolated instruction
latencies or per-node solver costs.

| Path | Mean cycles/checkpoint | Sampling |
| --- | ---: | --- |
| Plain checksum loop | 1.127 | 8 samples |
| Direct primary-only read | 24.138 | 8 samples |
| Added direct-primary cost | 23.010 | Difference of means |
| BehaviorWorker primary method | 24.785 | 1 sample |
| Direct two-word read | 117.427 | 1 sample |
| Direct four-word read | 168.014 | 1 sample |

Direct primary samples ranged from 21.292 to 29.362 cycles/checkpoint. Extension
samples are exploratory, not replicated estimates. All paths were warmed, but
no assembly-level optimization claim is made.

Cycle accounting through the final measurement checkpoint:

| Partition | CPU cycles |
| --- | ---: |
| Process start through initial meter read | 161,874,743 |
| Setup and warmup | 85,340,121 |
| Measured loops | 2,561,712,505 |
| Between-sample work, including publication | 7,711,112 |
| Total through final checkpoint | 2,816,638,481 |

The JSON field `totalProcessCycles` ends at that checkpoint. Report construction,
Git metadata lookup, serialization and process shutdown occur afterward and
are excluded. Setup/publication are accounted within aggregates, not separately
isolated latency measurements.

This probe has no concurrent writer. Coherence traffic at the intended update
rate, worker checkpoint cadence, actual behavior changes and whole-solve cycles
must be measured at consumer integration. The primary-only path is optional;
ordinary workers incur no added checks. Extended reads deliberately pay for a
consistent multiword observation and defer overlapping updates without spinning.

Raw samples: [cycles.json](cycles.json).
