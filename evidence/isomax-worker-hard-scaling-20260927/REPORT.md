# IsoMax worker-scaling investigation and endpoint repair

Current solver implementation: 5b21782 (both endpoint repairs). Final hard
qualification harness: 250ae50e8eb8328b4f9fcd0d9f61f834e6ac42da. Windows/i5-12600K,
Node26.7.0. All tests use 1M shared entries and 1M private entries per worker.
Ordinary native workers, no strategist or behavior flag polling.

## Longer completed-workload scaling

353335714 is a derived child, NOT an official Fhourstones input. Its parent
35333571 is a known absolute P0 loss; the appended legal P0 move cannot escape
that forced loss. All samples returned rootWdl=-1. Three separate processes per
arm, reversed order in the middle repetition. Means below; raw samples retained.
Full sharing is sharedSampleMask=0, the existing library default.

| Workers / control | Wall seconds | Search seconds | Speedup vs full1 | Total visits | Solve cycles (billions) | CPU seconds |
|---|---:|---:|---:|---:|---:|---:|
| full1 | 11.778 | 11.738 | 1.00x | 11,755,731 | 43.40 | 11.813 |
| full2 | 10.031 | 9.987 | 1.17x | 19,535,365 | 74.30 | 20.063 |
| full3 | 7.500 | 7.454 | 1.57x | 21,083,822 | 83.77 | 22.683 |
| full4 | 6.688 | 6.640 | 1.76x | 24,963,085 | 99.93 | 27.188 |
| unshared1 | 10.608 | 10.568 | 1.11x | 11,755,731 | 39.12 | 10.703 |
| unshared4 | 11.536 | 11.489 | 1.02x | 46,035,204 | 170.63 | 46.187 |

Search time runs from the first worker entering the solver to winner completion;
wall time includes startup and joined termination. Cycle accounting sums all
process threads; it is not a per-core instruction count. More total CPU work
can buy lower latency. Compare like-for-like full-sharing arms and also the
unshared single-worker control, which avoids self-publication costs. No CPU
affinity was forced. Three repetitions do not establish universal scalability.

## Reproduced defect and isolated repairs

Originally, native workers shared many CPC leaf conclusions but discarded
recursive endpoint proofs at narrow-window exits. On 45461667, native1 and
the native2 winning worker both visited exactly 806844 nodes despite sharing.
The four-worker group visited about 3.5 times the solo work. Startup timing,
unshared controls, identical-order4, and solo-offset controls localized the
problem beyond merely counting winner nodes or thread startup.

- 105cb25: a fail-high lower bound +1 is exact in {-1,0,+1}; publish against the
  current q and mover before forced-tail sign transport.
- 5b21782: after all relevant actions finish without beta cutoff, an upper bound
  -1 is likewise exact. Interior draw bounds remain excluded.

The TT remains exact-only. No bound-table, manager, scheduler, root rotation,
new state carrier, allocation, reporting, or string work enters recursion.
The behavior-enabled generated variant was regenerated from the same source.
Both added tests/branches and nested conversion/publication costs are recorded
in the add-on cycle ledger; whole-operation cycles include their actual costs.

## Matched sampled-sharing before/after

Mean wall milliseconds, unchanged mask7. F is official Fhourstones45461667;
A/B are the two declared midgame fixtures. Each cell uses three completed runs.

| Root | Workers | Before | Win endpoint | Both endpoints |
|---|---:|---:|---:|---:|
| F | 1 | 1075.52 | 199.80 | 191.10 |
| F | 2 | 1138.00 | 206.38 | 198.21 |
| F | 3 | 1062.48 | 199.30 | 181.45 |
| F | 4 | 1100.39 | 207.17 | 189.68 |
| A | 1 | 168.53 | 83.62 | 78.39 |
| A | 2 | 174.53 | 83.95 | 84.93 |
| A | 3 | 180.25 | 90.78 | 86.85 |
| A | 4 | 191.60 | 94.37 | 88.91 |
| B | 1 | 260.45 | 109.69 | 106.72 |
| B | 2 | 276.75 | 120.32 | 119.31 |
| B | 3 | 296.90 | 127.23 | 132.68 |
| B | 4 | 298.27 | 134.13 | 134.13 |

After endpoint retention, the old 1/8 sharing setting was retested against
full, half, and quarter sharing (72 solved trials). Full sharing improved
cooperation on the larger F fixture; very short tasks still have startup/JIT
and contention costs. No universal thread count or memory optimum is claimed.
All density results are in combined-summary.json and their own raw directory.

## Verification and limits

360 completed campaign trials in five phases; exact expected WDL, joined worker
cleanup, all-worker visit sums and process-cycle partitions verified. Independent
physical 4x4 oracle tests exercise directed windows, reflection, all WDL values
and forced continuation. Regression tests failed before their respective fixes.
The full repository suite passed 159 tests; catalog/ledger, generated behavior
source and runtime geometry checks passed. This is implementation/performance
qualification, not a new full NEES machine-code conformance certification.

A separate 35333571 single-worker probe at the win-only repair timed out cleanly
at 30 seconds. A separate 353335714 selection probe completed at the both-endpoint
repair. Neither probe is counted as a campaign repetition. The longer child was
selected because it completed in about 12 seconds, not for observed speedup.
No empty-board solve or universal parallel scaling is established.

Prior memory-size results concern the old producer population. Requalify memory
after these repairs before pinning a memory cap. Old experimental strategist
generated snapshots are historical and must be rebuilt/qualified before any
new comparison with this revised native solver; this task did not silently
rewrite those historical experiments. No BSFP changes.

Reproduce using experiments/worker-scaling/campaign.mjs with a fresh output
directory and --hard. Other modes reproduce the baseline diagnostic design or
--density; use each manifest's exact revision for historical comparisons. The
measurement-only loader admits one worker into the same native host and records
cold timestamps. The public production API continues to require at least two.
