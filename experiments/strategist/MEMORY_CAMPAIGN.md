SUPERSEDED for memory selection: see MEMORY_SUSTAINED.md. Short results are diagnostics only.

# Locate the cache-sizing knee

Recover prior evidence first: Connect4 research/semantic-quotient, memory-sizing
campaign and commits b984f347 / 12b76d3b. Four workers, mask7, 64K to 1M to 2M
shared AND per-worker private entries: 19.25/308/616 MiB cache backing. Five-minute
empty-board visitation throughput rose 4.28%, then 0.29%. All timed out; those
points suggest a throughput knee, not a proved solve-time plateau. The prior
completed-position screen retained 64K/64K without a larger-cache win.

Current bounded campaign: native public Lazy SMP, four workers, mask7, existing
move order/CPC. No strategist, behavior flags, mode engine or new hot machinery.
Fresh processes, no warmup, consistent with the historical native runs. Current
source SHA and hashes are frozen before execution; old and new revisions are not
pooled. Private capacity means cache entries, not a V8 heap cap.

- Diagonal: shared/private each 64K,256K,512K,1M,2M, two opposite-order repeats
  on Fhourstones 45461667 plus qualified A/B. 30 runs, 5-second case cap.
- Axes: hold one cache at 1M and vary the other 256K,512K,2M, plus 1M/1M
  control. Same three roots/two repeats: 42 runs. No eligibility gate.
- Stress: all five diagonal sizes and both 256K/1M cross-pairs, two opposite-order
  30-second empty-board runs: 14 runs. Existing qualified all-worker-node loader
  used only here; separate host-side 1-second RSS/progress. No comparison of
  instrumented throughput to uninstrumented solve timing.

86 runs, roughly ten minutes expected, at most 616 MiB cache backing and >=4 GiB
free RAM admission. No retries, parallel benchmarks, production-default changes,
timeout increases or silent evidence replacement. Native worker termination at
the existing session boundary is retained; require joined clean lifecycle.
All-process cycles retain bootstrap/setup/solve partitions. Production samples
report existing winner metrics only; never divide total cycles by winner nodes.

Analysis: minimize completed-solve time; inspect knees by capacity rather than
fit a linear memory law. Empty-board throughput is secondary evidence, never
solve progress. A practical candidate must avoid clear solved-case regressions
and stay near larger-capacity throughput; screen proximity threshold 2%. Select
the smallest backing allocation meeting those screens, then confirm it against
1M/1M and 2M/2M if warranted. Two repetitions are screening, not equivalence proof.
If objectives disagree or no stable knee is demonstrated, retain a provisional
campaign profile with explicit limits; do not claim a universal cap or silently
pin production. Preserve the complete capacity range and negative evidence.
