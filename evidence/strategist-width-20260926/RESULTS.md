# Width-delta screen: observer limitation, no strategy promotion

Tested implementation: `a8efe97` (full SHA recorded in `screen.jsonl`).
193/193 tests passed; all generated-mode, catalog and geometry checks passed.
The evaluator, mode decoder and generated search worker are unchanged from
`65275a44efbc80c92d57a0c303b33fcbf768a3f8`. The host only supplies the root and
geometry to this strategist during initialization. No production or TT change.

## What was tested

The shared TT is an exact-result cache. It does not contain pending branch
topology. To avoid adding evaluator work, this candidate reconstructs a private
root-derived RBA frontier in the strategist. It counts distinct canonical q at
complete projected plies, filtering terminal/CPC-exact and observed TT-exact q.
It reads but never mutates TT entries or counters. It is **not** a measurement
of workers' actual pending frontier, private alpha/beta bounds or live pruning.

The policy starts DEEP; positive width delta selects SHALLOW, negative selects
DEEP, zero holds. A second candidate requires >=25% relative growth. Neither
uses elapsed time to select mode. Observation cadence remains unchanged; it
schedules sampling, not mode decisions. Invalid/incomplete observations hold
the last mode and never manufacture a collapse.

The observer has two prepared 512-q arenas and processes up to 64 parents per
loop. Exact content decides deduplication. A failed expansion keeps the last
complete frontier and refreshes it for newly available exact results.

## One fast screen, no repeated failed trials

Windows/i5-12600K, Node v26.7.0, one evaluator, 750 ms unchanged deadline,
20 4x4 warmups, private/shared cache capacities 4,096/16,384. Four configurations
on three roots: 12 trials. The third root is B's predecessor, not an independent
family. These are single observations, **not medians**.

Million evaluator solve-call cycles:

| Root (zero-based columns) | Fixed DEEP, solved | Observe-only DEEP, solved | Delta, timeout | Relative delta, timeout |
|---|---:|---:|---:|---:|
| A `2053635233350500` | 504.588 | 505.412 | 2,745.193 | 2,747.642 |
| B `1320461024522311` | 889.169 | 960.940 | 2,809.723 | 2,784.434 |
| B15 `132046102452231` | 897.748 | 893.028 | 2,759.022 | 2,788.204 |

All six controls solved with matching WDL/root witnesses. Their node counts
matched exactly between fixed DEEP and observation-only: A 99,114, B 238,251,
B15 238,252. All six active trials timed out; no WDL is claimed for them.
All 12 joined cleanly, with zero errors and zero forced termination.

Whole evaluator solve-call QueryThreadCycleTime includes all additional visits
and mode execution, but excludes cold setup and other V8 threads. Strategist
cycles are separately captured: about 25.5-42.8M for observation-only, 52.2-57.5M
for active controls. Indirect observer interference can still affect evaluator
cycles. One root's observation-only sample rose about 8%; these single runs do
not establish a precise observation overhead. Timeout cycles are spent work,
not cycles-to-solve or a successful performance score.

## Why the active policies failed

All active runs observed expansion, made **one** mode change, then remained
SHALLOW. The completed widths were:

- A: 1 -> 7 -> 46 -> 172, through projected depth 3.
- B: 1 -> 7 -> 42 -> 137, through projected depth 3.
- B15: 1 -> 1 -> 7 -> 42 -> 137, through projected depth 4.

Every active observer exhausted its next-layer 512-state capacity once. The
last accepted layer then remained unchanged. No contraction was observed, so
the approved sign/hold rule provided no transition back to DEEP. The relative
filter made no difference: all recorded positive deltas exceeded its threshold.

This exposes two limits, not proof against the owner's intended method:

1. Root-derived breadth growth does not reveal local collapse/re-expansion in
   the workers' active search. Their private bounds, unfinished obligations and
   pruning are absent from the shared exact cache. The projection cannot infer
   them just by counting states it independently generated.
2. The bounded observer could not deliver the next complete width. Holding the
   last mode avoided inventing a signal, but left workers in costly probing.
   Enlarging its arena would not by itself repair the missing active context.

No timing escape, fabricated negative delta, extra capacity, hidden retry or
worker-side classification was added to disguise this outcome. Stop repeating
this observer until the signal's relationship to active search is established.

## Correctness and remaining requirement

Tests independently enumerate small-board move sequences and compare canonical
widths across three plies and reflected roots; exercise TT identity collisions
and odd publications; compare all TT arrays/counters before/after observation;
check incomplete/stale/scope-changed policy samples; and verify real width-driven
flags with clean asynchronous shutdown. These qualify the implemented projected
measurement, not its adequacy as an active-frontier signal or final NEES status.

The next requirement is an observable that distinguishes expansion from
contraction in the relevant **active unresolved search**. Current shared exact
entries cannot uniquely determine that private execution state. A proposal to
expose it must specify scope, publication consistency, already-available data,
and evaluator cycle cost. Do not relabel TT occupancy/proof rank as live width,
silently add worker telemetry, or move decisions back into the worker.

Reproduce the experimental failure with a fresh output path:

```sh
node --experimental-ffi experiments/strategist/width-campaign.mjs <new-output.jsonl> 1
node --test experiments/strategist/width-policy.test.mjs experiments/strategist/width-observer.test.mjs
```

Raw outcomes, evaluator metrics, strategist cycles and width/flag traces are in
`screen.jsonl`; complete test output is in `tests.txt`. Implementation and raw
failures are retained on the experimental branch; no production default changed.
