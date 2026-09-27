# Recurring PFIF: useful below the root, not universally cheaper

This tests the owner's refinement: after narrowing, advance; when expansion
returns, probe again. It is a worker behavior action selected by asynchronous
shared flags. The shared TT, ordinary solver, host scheduler, cache sizes and
timeouts are unchanged. No production policy is promoted.

Tested implementations:

- `a9e529f3be2a1aa24cc722acce3f6bf08eef53f2`: local recurring exploration.
- `f1aeecf3d92be4e871c9768453f337f0d21de257`: bounded recurring exploration.

## Setup and accounting

Windows, Intel i5-12600K, Node v26.7.0; one evaluator, an asynchronous strategist
for experimental policies, 750 ms unchanged trial deadline. Local cache 4,096;
shared cache 16,384. Twenty 4x4 warmups precede each measured 7x6 solve. Fresh
workers/cache per trial; rotated execution order for three-repeat comparisons.

Cycles are Windows QueryThreadCycleTime around the **entire evaluator solve
call**. All initial probes, re-entry, repeated nodes, control decoding, retention
and completion work count. Root ingress/preparation precedes measurement; first
7x6 specialization may occur inside it. Other V8 threads are excluded;
strategist cycles are separately captured in raw data and summary. There are
no clocks or reporting messages per search node. Cycles/node is an aggregate,
not the isolated marginal cost of reading a flag. No claimed five-cycle action
cost or complete process-wide CPU accounting is inferred.

The three roots are zero-based column sequences:

- A: `2053635233350500`
- B: `1320461024522311`
- B15: `132046102452231`, the immediate predecessor of B. This is **not** a
  third independent position family.

## Results

Million evaluator cycles, medians of the final three-repeat set:

| Root | Ordinary baseline | One-way 2-ply | Recurring bounded 2-ply | Recurring bounded 4-ply |
|---|---:|---:|---:|---:|
| A | 507.183 | 460.321 | 646.521 | 1,881.568 |
| B | 872.426 | 43.769 | 46.128 | 100.044 |
| B15 | 883.664 | 887.735 | 43.741 | 113.082 |

All 36 final trials solved and agreed on WDL and deterministic root witness.
Exact node counts were stable across repeats:

| Root | One-way nodes | Recurring 2-ply nodes | Cycles/node: one-way → recurring | Total-cycle change vs one-way |
|---|---:|---:|---:|---:|
| A | 89,042 | 122,551 | 5,169.7 → 5,275.5 | +40.45% |
| B | 5,838 | 4,262 | 7,497.3 → 10,823.1 | +5.39% |
| B15 | 238,252 | 4,263 | 3,726.0 → 10,260.5 | -95.07% |

On B the initial single screen favored recurrence by 8.1%, while the repeated
median was 5.4% slower, with overlapping cycle ranges. Do not claim a reliable
small timing win there. The stable 27% node reduction is insufficient evidence
of cycle savings. The large B15 benefit and A regression repeated clearly.

### Actual re-entry

Bounded 2-ply metrics, identical in all final repeats:

| Root | Local re-entries after earlier narrowing | Budget releases | Re-arms | Retained query skips | Max region depth relative to root |
|---|---:|---:|---:|---:|---:|
| A | 13,021 | 2,902 | 11,314 | 2,898 | 20 |
| B | 329 | 134 | 351 | 15 | 23 |
| B15 | 330 | 134 | 351 | 15 | 24 |

These are repeated local query events, not distinct global positions or global
frontier widths. B15 now reaches the useful probing opportunity below its
initial continuation; the one-way policy never probes there. This supports
recurrence as a useful mechanism, but does not establish that hundreds of
subsequent re-entries are each beneficial. A incurs excessive probing: horizon
stops rise from 5,507 to 28,244 and total work grows.

### Preserve the failed candidate

The initial unbounded local policy increased its horizon until narrowing.
All **18/18 active recurring trials timed out at 750 ms**; all 27 controls
solved. On A/B it spent the budget in the first new region without completing
child queries. B15 did re-enter once below a local release, then stalled.
Disabled recurrence preserved the one-way traversal exactly in all controls.
Timeout cycles are spent work, not cycles-to-solve.

The bounded variant probes one band, then advances normally until a forced
continuation or sufficiently few unresolved child queries re-arm it. The
12-trial initial bounded screen and 36-trial repeat set both solved completely.
Across all screens: 93 trials, 75 exact results, 18 timeouts, no reported errors,
no forced terminations, cleanup true throughout. Do not pool the different
implementations or the single screening pass into one timing median.

## Interpretation and limits

- Recurrence can recover an opportunity a root-only policy misses. B15 shows
  a large cycle benefit even after charging all extra work.
- Unconditionally widening probes until collapse is a poor policy on these
  roots. A one-band budget prevents that failure but still over-probes A.
- Four-ply recurrence loses to two-ply on all three roots here.
- The present action retains the local parent frame, order, alpha/best and
  completed-query markers. It can revisit unresolved descendants. It does
  **not** materialize a complete retained frontier or partition it among workers.
- This is a one-evaluator mechanism screen, not an empty-board benchmark,
  multiworker scaling result, full PFIF validation, or final NEES qualification.
- Next useful experiment: a cheap flag-controlled re-entry eligibility policy
  that distinguishes productive narrowing from repeated unproductive probing.
  Measure whole-call cycles and include A as a rejection control. Do not add
  per-node strategist messaging or assume fewer nodes justify more cycles.

## Correctness and reproduction

181/181 tests passed (`bounded-tests.txt`), including both variants against an
independent physical minimax on 48 seeded 4x4 positions and mirrors (192
variant/position solves), exact witnesses, tiny caches, local re-expansion,
live disable/STOP and real worker deadline cleanup. Generator consistency,
298-function/137-add-on cycle catalog, runtime-geometry audit and patch hygiene
passed. These checks do not replace broader 7x6 corpus qualification.

```sh
node --experimental-ffi experiments/strategist/recurring-campaign.mjs <new-output.jsonl> bounded 3
node experiments/strategist/analyze-recurring.mjs evidence/strategist-recurring-20260926
node --test test/*.test.mjs experiments/strategist/*.test.mjs
```

Use the original implementation SHA for the original unbounded measurements.
Raw files are `screen.jsonl`, `bounded-screen.jsonl`, `bounded-recheck.jsonl`;
`summary.json` reproduces every group, cycle sample and recurrence counter.
Metadata dirty entries refer only to earlier untracked evidence files;
measured implementation changes were committed before both campaigns.
