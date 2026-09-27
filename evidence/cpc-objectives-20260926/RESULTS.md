# IsoMax: parallel time to solution, serial cycles to solution

The objective correction matters. Removing both predictive families is the
leading four-worker candidate by **time to accepted solution** on this fixture.
For one evaluator, response-only removal and both-family removal save similar
solve cycles; response-only removal has the lower observed elapsed time.
Production remains unchanged.

## Four-worker primary result: elapsed time

Independent confirmation: eight balanced four-arm blocks, 32 fresh processes,
one process at a time. Fixed input 45461667, four workers, 65536 private and shared
entries, shared mask 7, original 30-second solver deadline.

| Configuration | Mean accepted solve, ms | Paired time change vs full | Descriptive 95% interval |
|---|---:|---:|---|
| A full CPC | 1049.96 | reference | — |
| B remove exhaustion | 1046.66 | -0.30% | [-2.25%, +1.65%] |
| C remove response | 1044.59 | -0.50% | [-2.26%, +1.26%] |
| D remove both | 1018.91 | **-2.95%** | **[-4.33%, -1.56%]** |

The earlier factorial screen, reanalyzed without rerunning or modifying its raw
evidence, gives D vs A **-1.15% time**, interval [-2.18%, -0.12%]. Thus two separate
eight-block batches favor D on time, with varying magnitude. The previous 3.74%
aggregate-cycle reduction was not the latency improvement.

In the fresh confirmation aggregate process cycles were A 17.675 billion,
B 17.614 billion, C 17.282 billion, D 16.759 billion. C saves aggregate cycles
without an established latency improvement. This is a concrete reason not to
use total parallel cycles as the selection objective.

## Single-evaluator primary result: solve-call cycles

The existing serial solver was called directly, with one private cache of 65536,
no shared cache, CPC-only, orderOffset=0. This is not a one-worker Lazy SMP mode.
Eight blocks, 32 fresh processes, external 30-second process deadline. No hot
timeout polling or other worker changes were introduced.

| Configuration | Mean solve cycles, billions | Paired cycle change vs full | Descriptive 95% interval | Mean solve, ms | Nodes |
|---|---:|---:|---|---:|---:|
| A full CPC | 4.087 | reference | — | 1000.26 | 806844 |
| B remove exhaustion | 4.131 | +1.09% | [+0.02%, +2.15%] | 1001.67 | 814598 |
| C remove response | 3.949 | **-3.37%** | [-4.41%, -2.34%] | **984.80** | 824313 |
| D remove both | 3.956 | **-3.20%** | [-4.48%, -1.92%] | 994.78 | 832445 |

Each arm's serial node count was identical in all eight runs. C and D explore
more nodes than A, but their lower per-node costs compensate. Mean solve cycles
per node: A 5065.96, B 5071.58, C 4790.70, D 4752.32. The lowest per-node cost does
not identify the lowest total cost: D expands more nodes than C.

Serial elapsed-time comparisons: C -1.53% [-2.66%, -0.41%]; D -0.53%
[-1.90%, +0.84%]. Do not convert the cycle improvements into equal timing gains.
The small C/D cycle difference is not a demonstrated winner; direct paired
comparisons are in `direct-comparison.json`.

Serial runs around one second here, as do four-worker runs. This workload does
not demonstrate a parallel speedup. It does not prove serial is best on harder
positions: parallel startup, different search ordering, sharing, duplicated work,
and runtime effects are all part of that composition. This was not a worker-count
tuning campaign.

## Timing and accounting boundaries

Current public parallel API accepts exact status only after `session.close()`
and its final error check. Therefore joined API return is the truthful primary
endpoint. A winner/DONE before shutdown is provisional; a late worker error can
invalidate acceptance. We did not change that contract to improve a score.

Eight separate phase diagnostics wrapped only cold main-thread lifecycle calls.
Mean host-observation-to-close cost: A 3.018 ms, B 3.032 ms, C 3.137 ms,
D 2.982 ms. These diagnostics are excluded from primary rankings. Observation
includes the existing host polling delay and is not the worker publication
instant. It does not show when every worker finished initialization.

The unmodified parallel sample times root/session setup, spawning, worker
initialization, search, close and accepted return. Module import/geometry setup
is separate, averaging 18.17–18.65 ms. Serial setup (imports, geometry, root and
private state preparation) averages 19.36–21.05 ms. These are cold-process runs,
not steady-state warmed-worker throughput.

Serial primary cycles are the QueryProcessCycleTime delta around the solve call,
including runtime helper-thread work. They are not a literal hardware count for
just the evaluator thread. Bootstrap and setup remain in separate partitions;
all partitions close to process-total cycles. Whole-process totals are retained
to prevent setup cost displacement from disappearing. Parallel aggregate cycles
remain diagnostic resource accounting, not a veto on lower latency.

## Reproduction, validation and limitations

- Same frozen libraries as the CPC factorial: A 93aca1758718bcbf0635c11a957a67ca6387d50c;
  B 8dfde9a87e0ea7f8da24b9e900457b3d43687924;
  C 8d7095acf90b80ec3120136c1b4e538744d2cb5a;
  D 25d4d24d51aa121fe675ade4f2de5af79941fcd0.
- Intel i5-12600K, Windows, Node 26.7.0 / V8 14.6.202.34-node.28.
- Same unchanged duplicate win check, move order, worker and cache implementations.
- Eight Williams blocks per mode; orders ABDC, BCAD, CDBA, DACB repeated twice.
  Serial and parallel block execution alternated; no overlapping benchmarks.
- 72/72 fresh processes returned rootWdl=1 and move=3. All 40 parallel/phase runs
  reported clean shutdown, four exited workers and no errors. Serial calls had
  no solver worker lifecycle. No timeout or performance retry occurred.
- Existing treatment/semantic qualification is in the preceding factorial report;
  this follow-up modifies only cold measurement and analysis infrastructure.
- Statistical tests cover objective-specific ranking and rejection of missing,
  duplicate, zero and nonfinite samples. Intervals are descriptive paired
  Student-t intervals, unadjusted for multiple comparisons, on one fixture.
- Before phase diagnostics started, the preload was guarded with `isMainThread`
  because Node passes `--import` to workers. The corrected hash and timing of this
  preflight fix are recorded in `phase-preflight.json`; it does not affect either
  primary sample path. Original manifest is retained rather than rewritten.
- No full NEES qualification or production promotion is claimed.

Raw evidence is in `serial.jsonl`, `parallel.jsonl`, `phase.jsonl`, and
`processes.jsonl`; identities and hashes in `manifest.json`. `summary.json` also
preserves the old batch's latency analysis. Run:

```text
node --test experiments/cpc-objectives/stats.test.mjs
node experiments/cpc-objectives/run.mjs NEW_OUTPUT_DIRECTORY
node experiments/cpc-objectives/analyze.mjs NEW_OUTPUT_DIRECTORY
```

Analysis expects the sibling `cpc-factorial-20260926` old evidence directory;
place NEW_OUTPUT_DIRECTORY under `evidence/`. Sample controller requires the
four clean worktrees at the paths recorded in the manifest. The same pinned Node
runtime enables experimental FFI when launching samples.

Selection rule going forward: parallel candidates advance on correct-result
latency at a fixed resource budget; single-evaluator candidates advance on solve
cycles with wall time checked. Keep D for broader parallel qualification and C/D
for serial qualification. Do not assume one configuration must win both regimes.
