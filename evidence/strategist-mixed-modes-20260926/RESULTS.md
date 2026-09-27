# Fixed wide/deep pair: no general time-to-solve benefit

54 fresh-process trials completed: 36 correct solved-position results and 18
bounded timeouts on the harder Fhourstones input. Every trial cleaned up without
forced termination or conflicting exact values. This fixed policy is not promoted.

## Primary objective: time to solution

Six balanced repetitions per cell. Mean ready-barrier to first exact evaluator
completion, accepted only after validation and cleanup:

| Root | Both deep | Worker 0 deep / worker 1 wide | Worker 0 wide / worker 1 deep |
|---|---:|---:|---:|
| A: 2053635233350500 | 147.28 ms | 157.28 ms | 148.80 ms |
| B: 1320461024522311 | 265.84 ms | 264.77 ms | 634.63 ms |
| Fhourstones 45461667 | 6/6 timeouts | 6/6 timeouts | 6/6 timeouts |

A/B strings use zero-based columns; the Fhourstones string is one-based.
No harder-input result was produced within the unchanged 750 ms solve deadline.

Paired mixed/control time changes, descriptive 95% Student-t intervals (5 df):

| Assignment | A | B |
|---|---|---|
| Worker 1 wide | +6.84% [+1.11%, +12.57%] | -0.38% [-5.04%, +4.27%] |
| Worker 0 wide | +1.09% [-3.68%, +5.87%] | +138.77% [+134.88%, +142.66%] |

Both mixtures lack a repeatable time win on these solved roots. Swapping roles
matters greatly on B. Intervals are exploratory and unadjusted for multiple
comparisons. This does not reject expansion-triggered PFIF or every possible
wide/deep algorithm; it measures the existing fixed two-ply-band action.

## What the workers actually did

Both-deep winners were worker 1 on every A run and worker 0 on every B run.
In every solved mixed run the DEEP worker won. Making B's normally winning
worker 0 shallow left worker 1 to finish a substantially larger search.

The worker index determines a preexisting recursive move-order offset. Role
assignment changes which offset remains deep; it does not introduce a new
move-order method. The swap control prevents that sensitivity from being hidden.

The commanded wide worker executed actual bounded traversal. Mean horizon stops
were roughly 40–42 thousand on A, 85 thousand for worker-1-wide on B, and
211 thousand for worker-0-wide on B. No unsupported horizon result became WDL.

| Root / assignment | Mean total visits | Mean deep-worker visits | Shared hits | Shared stores |
|---|---:|---:|---:|---:|
| A both deep | 189893 | — | 49348 | 4634 |
| A worker 1 wide | 163356 | 99114 | 4041 | 6696 |
| A worker 0 wide | 154991 | 93952 | 3743 | 6521 |
| B both deep | 492857 | — | 63397 | 10545 |
| B worker 1 wide | 357131 | 238251 | 13851 | 10134 |
| B worker 0 wide | 900062 | 599599 | 61136 | 20458 |

Wide/deep often reduced aggregate visits and shared hits without reducing solve
time. Fewer visits here do not imply more useful progress: nodes include cheap
shared hits and unfinished-horizon visits with different costs.

For worker-0-deep mixtures, its node totals equal the historical one-worker DEEP
counts on A (99114) and B (238251). The relevant generated search, decoder, CPC,
coordinate and shared-cache source files are byte-identical across those revisions;
see `historical-node-comparison.json`. This provides no observed deep-node reduction
from the wide helper on these cases. Historical timing is not a fresh performance
control, and equal counts alone do not prove identical execution or zero interaction.

Aggregate TT counters cannot distinguish own-record reuse from another worker's
contribution. They do not establish that the wide worker's records were consumed
or useful. No hot provenance instrumentation or TT mutation was added to infer it.

## Resource accounting (diagnostic, not the ranking objective)

| Root / assignment | Evaluator cycles, billions | Strategist cycles, millions | Whole process cycles, billions |
|---|---:|---:|---:|
| A both deep | 1.097 | 4.424 | 4.570 |
| A worker 1 wide | 1.190 | 5.651 | 4.724 |
| A worker 0 wide | 1.124 | 4.903 | 4.634 |
| B both deep | 1.958 | 6.487 | 5.565 |
| B worker 1 wide | 1.970 | 7.029 | 5.592 |
| B worker 0 wide | 4.660 | 13.360 | 8.259 |

Search-worker cycles include both evaluators through cooperative return.
Strategist cycles are separate. Whole-process cycles include startup, preparation,
warmups, all runtime threads, search and cleanup through runTrial return. These
different denominators are not summed or substituted for each other.

Mean joined durations A: 156.84 / 171.88 / 162.36 ms; B:
272.97 / 277.28 / 645.63 ms in table order. The harder-input joined times were
779.34 / 772.91 / 783.50 ms; they include cancellation and cleanup and are not
solution latencies. No solver timeout was increased.

## Scope, changes and reproduction

- Tested JSMinSys commit: ce00220 (full SHA in `manifest.json`).
- Two evaluators, 4096 private slots each, 16384 shared slots, full sharing.
- Fresh workers and caches per trial, 20 private 4x4 warmups, common ready barrier.
- Fixed initial per-worker flags; no mode changes until STOP. Requested strategist
  cadence 5 ms, not a guaranteed delivery deadline. Persistent mode does not rely
  on timer precision.
- Same mode-capable execution in every arm. Full CPC retained. Native production
  recursion differs (including root probing); do not compare these times directly
  with the preceding native CPC factorial campaign.
- Only strategist policy and its two calls were modified. Existing evaluator,
  generated hot loop, mode decoder, host and TT remained unchanged. No per-node
  reporting, new worker instructions, or dynamic hot-path allocations were added.
- Intel i5-12600K, Windows, Node 26.7.0 / V8 14.6.202.34-node.28; no CPU affinity.
- Six permutations balance three-policy ordering; fixtures rotate by round.
  Only one trial executes at a time. Raw output is written before validation.
- Nine targeted tests passed: fixed assignment, real asynchronous command
  execution/cleanup, existing live-switch exactness/witness/root restoration,
  STOP and control semantics. Generated-source check passed.
- No full NEES qualification or production promotion is claimed.

```text
node experiments/strategist/build-modes.mjs --check
node --test experiments/strategist/mixed-modes.test.mjs experiments/strategist/modes.test.mjs experiments/strategist/controls.test.mjs
node experiments/strategist/mixed-campaign.mjs NEW_OUTPUT_DIRECTORY
node experiments/strategist/analyze-mixed.mjs NEW_OUTPUT_DIRECTORY
```

Use the pinned Node runtime; the controller enables experimental FFI in children.
Raw data: `manifest.json`, `samples.jsonl`, `processes.jsonl`, `summary.json`.
The experimental implementation and evidence remain on JSMinSys PR #52.

Keep both-deep as this experiment's control. A next useful strategy experiment
would preserve the effective deep worker and activate shallow work only when it
has a specific unresolved region to help. The present test supplies no basis to
permanently dedicate a worker to wide work.
