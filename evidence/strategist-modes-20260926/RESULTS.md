# Strategist-owned shallow/deep mode qualification

Implementation tested: `65275a44efbc80c92d57a0c303b33fcbf768a3f8`, clean tree.
This implements the owner's responsibility split. It does not select an
expansion-trigger strategy or promote a production default.

The experimental worker executes SHALLOW bounded bands or DEEP continuation.
The separate strategist is the only mode-selection owner. Worker-local yield
judgments, narrowing targets, remaining-child policy counts, automatic release,
re-arming and lineage tracking are absent from this path. Numeric execution
state, query retention and horizon enforcement remain necessary worker work.
The old recurring workers are historical experimental controls, not used by
the new `modes-*` policies. No production solver, scheduler or TT change.

Every completed node still reads the existing shared flag. There is no
per-node message, new telemetry, timestamp, allocation or string operation.
No synchronous strategist permission, root replay or cache reset on switching.
See `experiments/strategist/MODES.md` for the execution-cost ledger and limits.

## Correctness

- 186/186 repository and campaign tests passed (`tests.txt`).
- Targeted tests first failed on missing mode implementation, then passed.
- Deterministic live mode changes in both directions preserve WDL, root
  witness and root coordinates across five 4x4 roots, with tiny caches.
- STOP returns cancellation with no fabricated WDL.
- A real asynchronous strategist controlled two empty-board evaluators and
  stopped them at the existing 150 ms diagnostic deadline; no forced cleanup.
- Source guard checks prohibit the old local policy fields/helpers.
- Generator check, 298-function/137-add-on catalog, runtime geometry and patch
  hygiene passed. These are not a final NEES qualification claim.

## Whole-call cycle control

27 interleaved runs: three roots, three configurations, three rounds. One
evaluator, 750 ms limit, Windows/i5-12600K, Node26.7, 20 4x4 warmups,
private cache 4,096/shared 16,384. All 27 solved, agreed on WDL and deterministic
root witness, reported no errors and cleaned up without forced termination.

QueryThreadCycleTime brackets the complete evaluator solve call. All mode
actions and extra visits count. Preparation/root ingress precedes it; 7x6
specialization may occur during it. Other V8 threads are excluded. Strategist
cycles are separate in raw results. Total measured evaluator cycles across all
27 trials: **18,108,417,085**, total visited nodes **4,490,005**.

Median million evaluator cycles:

| Root (zero-based columns) | Previous full-depth control | New fixed DEEP | Change | Nodes in both |
|---|---:|---:|---:|---:|
| `2053635233350500` | 508.785 | 513.614 | +0.95% | 99,114 |
| `1320461024522311` | 881.522 | 889.971 | +0.96% | 238,251 |
| `132046102452231` | 900.204 | 895.005 | -0.58% | 238,252 |

The last root is the predecessor of the second, not an independent family.
Traversal counts matched exactly on every fixed-DEEP comparison. These small
timing differences have overlapping ranges; do not infer zero overhead, a
sub-1% guarantee, or a speed improvement. This measures the complete mode-capable
path, not the isolated reader or one branch instruction.

## Live switching diagnostic, not an optimization result

`modes-switch-check` requests shallow/deep/shallow/deep at fixed elapsed times.
This tests the control path, not an expansion detector or a recommended cadence.
All nine timing runs observed two applied settings: initial SHALLOW and DEEP.
Intermediate pulse settings coalesced under actual delivery timing, as permitted
by the persistent-flag contract. The deterministic unit tests separately exercise
all three live transitions. Do not claim the timed runs delivered every pulse.

The nine switching runs all solved, but work varied substantially. A visited
60,156 / 103,445 / 191,259 nodes; B visited 11,777 / 16,410 / 10,622;
B's predecessor visited 62,344 / 266,072 / 314,218. Those are chronological
effects of a diagnostic timer, not stable evidence for a strategy. All samples,
publication traces, observed setting counts and cycle totals are retained.

## Remaining decision

An expansion-sensitive strategist still needs a justified signal. Current
observations expose exact TT entries and aggregate counters, not the active
unresolved frontier width. Do not quietly put classification back in the worker
or claim completed-TT rank proves current expansion. First determine what the
strategist can infer cheaply from the existing observations; any additional
observation cost must be explicit and measured.

Reproduce with a fresh output path:

```sh
node --experimental-ffi experiments/strategist/modes-campaign.mjs <new-output.jsonl>
node --test test/*.test.mjs experiments/strategist/*.test.mjs
node experiments/strategist/build-modes.mjs --check
```

Raw evidence: `control.jsonl`. Preparation and publication code is unchanged
except for cold policy selection and the new strategist-owned mode commands.
