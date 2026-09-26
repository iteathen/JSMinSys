# Flag dispatch and strategist discovery, pass 2

Experimental JSMinSys checkpoint, 2026-09-26. No production promotion. The
existing solver, TT, host, evaluator and lifecycle were not changed in this pass.
Only experimental behavior handlers, strategist, validation drivers and reporting
changed. This is not a standard Fhourstones score or complete NEES qualification.

## Decision

Use integer equality with an early return as the provisional experimental
dispatcher. XOR and per-feature change masks did not consistently improve whole
solve cycles. Keep the shared read at every completed node; skip reapplying a
persistent preference, not reading it. Default remains the original experimental
integer handler so these findings do not silently promote a policy.

No tested strategist has established a total-cycle advantage over one evaluator
on the 7x6 roots. Seeding and then retiring helpers reduces redundant two-worker
cost substantially, but costs more than starting with one worker on median.
Broader diversity and sharing settings interact with the root; 4x4 successes did
not transfer reliably to 7x6. These are useful rejected/generalization findings,
not a reason to promote a scheduler or redesign the TT.

## Source and accounting

- Windows / Intel Core i5-12600K / Node 26.7.0, V8 14.6.
- Dispatch source: `02f206916ee4e806b233000b30bb29ad7bd40a2d`.
- Strategy screen/comparison source: `0d4c387185d3421e3c290565b194b5d29af7987f`.
- Longer-root confirmation source: `5df151e` (full SHA in `confirmation.jsonl`).
- Each run metadata records a clean starting tree. No simultaneous timing runs
  or correctness suites. Sources and raw evidence are retained; no historical
  result was rewritten after review.
- Windows QueryThreadCycleTime brackets each complete evaluator solve or solve
  batch. Reported cycles sum all evaluators, including cancelled helpers and
  retirement tails. Strategist cycles are separate in raw data and summary.
- Solve-call accounting includes its root frame setup and return; cold ingress,
  thread setup and warmup are outside the bracket. It excludes other V8 threads.
  This does not establish isolated machine-instruction costs.
- Strategy trials: private capacity 4,096 per worker; shared capacity 16,384;
  20 untimed 4x4 warmups. First 7x6 specialization remains in measured work.
  One or two evaluators, 750 ms deadline (500 ms screens). No limit increase.
- Fixed requested 5 ms strategist interval commonly delivered about 15-17 ms on
  this host. Raw traces retain observed timing. No cadence tuning was performed.

## Flag dispatch

Four interleaved fresh-process blocks, four variants, two fixtures, three flag
scenarios = 96 measured batches. Each 4x4 batch contains 100 solves; each 7x6
batch contains 50. There are 100 initial and 20 per-scenario warmup solves.
The probe omits shared TT so changes to sharing flags do not change semantic
work. It checks identical node totals and value/move checksums. Live changing
flags come from a separate strategist; every changing batch observed updates.

Median whole-solve cycles per visited node (not cycles per flag read):

| Fixture / flags | Original integer | Early integer | XOR | XOR + group masks |
| --- | ---: | ---: | ---: | ---: |
| 4x4 empty / zero | 1575.16 | 1562.98 | 1582.95 | 1565.02 |
| 4x4 empty / persistent | 1574.48 | 1557.86 | 1573.31 | 1557.92 |
| 4x4 empty / changing | 1580.18 | 1570.38 | 1565.45 | 1574.98 |
| 7x6 A18 / zero | 3515.81 | 3506.11 | 3545.91 | 3522.18 |
| 7x6 A18 / persistent | 3504.71 | 3505.69 | 3537.75 | 3515.12 |
| 7x6 A18 / changing | 3530.15 | 3509.75 | 3546.82 | 3528.93 |

Early integer median differs from original by about -1.06% to +0.03%, with
overlapping individual samples. This is a provisional choice, not a proven
universal speedup. Dense per-node setting changes were not tested. The change
paths use masks/shifts for field extraction in every variant; the comparison is
about detecting/reapplying changes, not banning bit operations.

No extensions are read unless bit 31 requires them. Extended publication is
validated before early equality. STOP is never saved as an applied preference,
so repeated STOP remains effective. Unchanged primary settings need no action
dispatch. Changed settings select prepared ordering data and an existing cache
sampling mask; there is no allocation, string handling, new TT lookup, or
synchronous strategist interaction in the handlers.

## Strategy comparisons

Eleven strategy labels, two roots, three interleaved rounds = 66 trials. Two
additional nontrivial roots were selected from 11 baseline screens before
examining their policy outcomes. Confirmation: seven labels, two roots, three
interleaved rounds = 42 trials. All 119 trials completed EXACT with cleanup, no
errors or forced terminations. All comparison results match baseline WDL;
existing differential tests supply broader semantic coverage.

Move sequences below are zero-based columns. A16 and A18 share a prefix and
are not independent games. B16 is a distinct game. All tested 7x6 comparison
roots return absolute result 1 (P1 win); 4x4 empty returns 2 (draw).

Initial medians, total evaluator **million cycles**:

| Policy | 4x4 empty | 7x6 A18: 205363523335050016 |
| --- | ---: | ---: |
| One worker | 46.39 | 136.38 |
| Two workers, original completion | 122.51 | 284.41 |
| Inert strategist | 111.60 | 294.11 |
| Sparse 1/16 sharing | 93.01 | 289.35 |
| Anchor full / helpers 1/16 | 99.86 | 287.36 |
| Wider tie offsets + asymmetric sharing | 84.50 | 307.39 |
| Harvest | 103.96 | 283.18 |
| Wider offsets + harvest | 84.42 | 290.67 |
| Seed then retire | 106.70 | 210.46 |
| Wider offsets + seed then retire | 96.29 | 203.71 |
| Thin 1/256 sharing | 99.40 | 282.82 |

Harvest samples committed exact rows, switching helpers to full sharing after
two sampled records have at least eight remaining cells. Seed retirement stops
helpers after at least 256 stores and one such sampled record; worker 0 remains
live. These thresholds are heuristic signals, not proof of helper contribution.

Longer-root confirmation medians:

| Policy | A16 Mcycles | A16 nodes | A16 ms | B16 Mcycles | B16 nodes | B16 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| One worker | 514.47 | 99,114 | 141.73 | 903.27 | 238,251 | 247.49 |
| Two workers | 994.74 | 184,863 | 136.48 | 1868.37 | 490,626 | 255.09 |
| Inert strategist | 1018.10 | 188,928 | 139.99 | 1925.30 | 499,079 | 258.24 |
| Sparse | 1005.76 | 193,066 | 133.76 | 1788.13 | 500,827 | 240.27 |
| Wider + asymmetric | 1087.73 | 207,053 | 149.74 | 1687.69 | 496,750 | 228.71 |
| Seed then retire | 569.55 | 105,713 | 139.54 | 973.11 | 246,197 | 249.13 |
| Wider + seed then retire | 572.52 | 104,914 | 141.86 | 956.61 | 243,837 | 246.05 |

A16 = `2053635233350500`; B16 = `1320461024522311`. Columns are separate
medians, not one synthetic run. `summary.json` retains ranges, per-node costs,
strategist cycles and exact sample counts.

Seed retirement saves about 42-49% of continuing-two-worker cycles here, yet
remains 5.9-11.3% above one worker. Helpers actually finish cancellation before
anchor completion in all 12 longer-root seed trials. The strongest B16 wall-time
result is wider asymmetric sharing (228.71 ms), but it spends about 87% more
cycles than one worker. It does not meet the owner's total-hot-cycle objective.

## Review and boundaries

Independent review found no STOP, extension, mask or TT mutation defect. It
caught a trace-label defect: historical `retired` and `harvested` fields denote
threshold eligibility, including for policies that never retire. The source now
names those fields `retirementEligible` / `harvestEligible` and independently
reports `helperStopPublished`. Historical JSONL is unchanged. Actual early
retirement above is established from policy and evaluator completion times, not
the misleading old flag alone.

Verification: 163/163 repository plus experiment tests; catalog verification;
ordinary and experimental generated-source checks; runtime geometry audit;
patch hygiene. The evidence analyzer verifies cycle/node aggregation, values,
cleanup, and real changing-flag observations. The final trace-label correction
was separately reverified; no claim is made that timed files contain that fix.

Production `src/` and `addons/`, experiment host/evaluator/build/generated search
remain byte-identical to the pre-pass checkpoint. No memory, timeout, solver,
worker-lifecycle or TT redesign. No policy is promoted to production.

## Next justified experiment

Retirement itself is demonstrated; useful helper seeding is not. A next bounded
campaign should select roots where the existing full-sharing two-worker control
actually reduces anchor work, then test flag-only diversity/retirement there.
Keep a one-worker control. Do not add worker telemetry or tune cadence without
a strategy-specific reason. Current completed roots are too narrow to establish
behavior on empty 7x6, hard benchmark suites, or larger worker counts.

Reproduction commands are in `experiments/strategist/README.md`; exact metadata
and raw trials are adjacent. `analyze-pass2.mjs` regenerates `summary.json`.
