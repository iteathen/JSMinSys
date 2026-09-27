# Strategist measurement of pending query width

Date: 2026-09-26 America/Los_Angeles (raw UTC: 2026-09-27).
Tested clean implementation: `43640e99a94537869937379e7807e70370637d90`.

The strategist can now measure changing pending query width from requested raw
worker snapshots. It observed widening and contraction on all three roots, unlike
the earlier root-derived TT projection that saturated before observing contraction.
Workers did no width arithmetic or strategic decision-making. All remained DEEP.

This is an optional experiment, not a production promotion. The short screen does
not establish overhead below 1%. It also does not establish that width deltas are
a useful mode-switching signal: no width-controlled SHALLOW/DEEP policy was tested.

## Method and accounting

Windows, Intel Core i5-12600K, Node v26.7.0, V8 14.6.202.34-node.28.
One evaluator plus one asynchronous strategist. Three variants, three roots,
three repetitions with variant order rotated each round: 27 trials. Each uses
20 warmups, fresh caches, local capacity 4,096, shared capacity 16,384 and the
unchanged 750 ms solve limit. Reader cadence is 5 ms, a screen parameter rather
than a claimed optimal policy cadence.

- `modes-deep`: unchanged mode-controlled evaluator.
- `modes-pending-off`: observation-capable evaluator, no requests/publications.
- `modes-pending-read`: same observation evaluator, requested snapshots read and
  interpreted by the strategist; mode remains DEEP.

Windows QueryThreadCycleTime brackets the whole evaluator solve call. Retention
stores, pending checks, request decoding and publication all fall inside that
measurement. Strategist cycles are separately bracketed, including final snapshot
reading. These measurements exclude cold preparation and other V8 threads; they
are not a full-process or hardware-instruction count. No clocks enter node traversal.
An asynchronous strategist still consumes host resources.

Raw data: [screen.jsonl](screen.jsonl). Test output: [tests.txt](tests.txt).
Protocol: [PENDING_OBSERVATION.md](../../experiments/strategist/PENDING_OBSERVATION.md).

## Evaluator cost

Median whole solve cycles, millions. Parentheses give change from unchanged DEEP.

| Root | Nodes per trial | DEEP | Observation off | Requested/read |
|---|---:|---:|---:|---:|
| A `2053635233350500` | 99,114 | 507.881 | 501.703 (-1.22%) | 514.249 (+1.25%) |
| B `1320461024522311` | 238,251 | 892.185 | 894.359 (+0.24%) | 902.056 (+1.11%) |
| B15 `132046102452231` | 238,252 | 907.468 | 915.341 (+0.87%) | 905.649 (-0.20%) |

B15 is B's predecessor, not an independent root family.

| Root | DEEP cycles/node | Observation off | Requested/read | Read minus DEEP |
|---|---:|---:|---:|---:|
| A | 5,124.21 | 5,061.88 | 5,188.46 | +64.25 |
| B | 3,744.73 | 3,753.85 | 3,786.16 | +41.43 |
| B15 | 3,808.86 | 3,841.90 | 3,801.22 | -7.64 |

These differences are whole-call observations, not an isolated per-node instruction
cost. Negative differences do not make instrumentation free. Min/max trial ranges
overlap substantially:

| Root | DEEP range, Mcycles | Off range | Read range |
|---|---:|---:|---:|
| A | 503.301–529.214 | 501.424–531.465 | 506.762–540.179 |
| B | 887.953–940.786 | 894.092–933.317 | 895.882–914.289 |
| B15 | 892.116–952.474 | 904.026–945.532 | 880.735–946.242 |

Three repetitions cannot resolve a reliable sub-1% overhead from this variation.
Two observed medians exceed 1%; no claim that the owner's cost gate is passed.
Separately retained raw metadata costs exist even when requests are disabled.

## Strategist cost and observed signal

Median strategist thread cycles, millions:

| Root | DEEP control loop | Observation off | Requested/read |
|---|---:|---:|---:|
| A | 4.158 | 4.459 | 6.709 |
| B | 6.476 | 7.084 | 9.210 |
| B15 | 7.038 | 8.900 | 8.755 |

Requested/read trials:

| Root | Snapshots per trial | Observed width range across trials | Positive deltas | Negative deltas | Copied uint32 words per trial |
|---|---|---|---|---|---|
| A | 9 / 9 / 9 | 7–58 | 4 / 4 / 2 | 4 / 3 / 5 | 846 / 803 / 840 |
| B | 16 / 16 / 15 | 7–61 | 8 / 7 / 7 | 7 / 7 / 6 | 1,704 / 1,666 / 1,593 |
| B15 | 16 / 16 / 17 | 1–63 | 7 / 7 / 8 | 8 / 6 / 7 | 1,742 / 1,656 / 1,715 |

Copied words include the two sequence publications and numeric header/rows.
The request flag is polled through the existing completion hook. Snapshot latency
is bounded by reaching a subsequent branch boundary, not a promise of immediate
delivery. The copy is requested metadata copying, not zero-copy measurement.

Width means per-worker outstanding query alternatives represented by active
recursive frames. It is neither globally unique positions nor a complete level
width of the game DAG. Two workers may observe duplicate positions. Sampling can
miss intervening expansion/contraction; a delta alone does not establish a causal
instruction or proof of pruning. All snapshots have mode=DEEP and horizonStops=0.

Totals across 27 trials: 21,040,681,030 evaluator cycles; 192,289,758 strategist
cycles; 5,180,553 evaluator nodes. No timeout, worker error or forced termination.

## Correctness and mechanical qualification

198/198 repository plus strategist tests passed. Added checks cover raw snapshot
coherence, per-worker slot isolation, rejecting sequence reuse, refusing sequence
wrap, request-free non-publication, fixed-DEEP traversal equivalence, scope/mode/
horizon delta invalidation, and two real asynchronous workers remaining DEEP.

All 27 measured runs returned EXACT, with identical values, moves and node counts
across all variants/repetitions. Returned value=1 for each fixture; witnesses A=3,
B=3, B15=1 (zero-based). This is differential agreement with the existing evaluator,
not a newly obtained independent 7x6 oracle.

Catalog: 298 sealed functions + 137 add-on units, 30/30 blocks, zero deferred.
Base mode and observed-mode generated source checks passed; runtime geometry
audit and patch whitespace checks passed. No production function was changed.
This is not a final NEES qualification of an integrated strategist policy.

## Disposition

Keep this observation path optional. It repairs the earlier observation mismatch
without interpreting the shared exact-value TT as a live execution frontier.
The strategist now owns measurement as requested; the worker only retains and
publishes raw fields it already computes.

The next policy experiment can use these deltas, but must retain an observer-only
control so policy savings are charged for instrumentation. A mode change must
invalidate comparisons across shallow-horizon coarsening. Do not mistake a single
negative sample for global collapse or a global count of work available to workers.
No production activation or strategy success is claimed by this checkpoint.

## Reproduce

```
node --test test/*.test.mjs experiments/strategist/*.test.mjs
node tools/verify-catalog.mjs
node tools/audit-runtime-geometry.mjs
node experiments/strategist/build-modes.mjs --check
node experiments/strategist/build-observed-modes.mjs --check
node --experimental-ffi experiments/strategist/pending-campaign.mjs NEW_SCREEN.jsonl 3
```
