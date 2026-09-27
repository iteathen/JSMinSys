# Research-guided worker actions: bounded campaign results

## Outcome

Implemented three new optional worker flag actions: bypass/restore shared-cache
access, enable the existing stronger CPC frontier-response proof, and select
prepared reversed recursive tie precedence. These compose with existing cyclic
tie selection, sharing sampling and STOP. The asynchronous strategist has ten
candidate policies/combinations plus inert and sparse-sharing controls.

**188/188 performance trials completed EXACT**, agreeing on value and root move,
with clean shutdown and no forced termination. All evaluator cycles, including
losing-worker tails, are counted. This is a short experimental campaign, not
production promotion, a Fhourstones score or full NEES machine qualification.

The useful lead is workload-dependent proof effort. Stronger CPC plus 1/8
sharing saved about 6.0% of one-worker cycles on B16 in confirmation, but added
3.8% on A16. Private-only with one worker saved about 3% versus the sparse
one-worker control. No tested two-worker strategy beat one worker's total cycles.

## Research and scope

[ACTION_CAMPAIGN.md](../../experiments/strategist/ACTION_CAMPAIGN.md) records the
existing IsoMax Core-0.19 DP report, all-leads negatives, shared-result provenance
census, current IsoGraph authority, DP-0.8 candidate ideas, and primary Stockfish
and Pascal Pons sources. No chess pruning rule, bound-valued TT, search window
protocol, root reorder or replacement solver was imported.

IsoGraph's key contribution here is to preserve the objective (exact value AND
required root witness), identify alternative sufficient computation paths, then
measure whole-operation cost. Historical hit counts and static graph occurrence
counts are not proof of useful work avoided. The new DP-0.8 proposal is treated
as unqualified guidance; this pass does not claim a new formally rendered DP
campaign. Core 0.19's current integrated qualification is revision-scoped.

No `src/`, `addons/`, existing host, evaluator, build generator or generated search
change. All actions select existing prepared worker fields at completion
boundaries. The strategist never writes TT content or adds worker telemetry.
Worker flags remain numeric; handlers allocate nothing and use no strings.

## Frozen evidence

| Stage | Source | Trials | Purpose |
| --- | --- | ---: | --- |
| screen.jsonl | 0332ef4 | 60 | Nine policies plus six controls, two roots, two interleaved rounds |
| isolated.jsonl | 5f13889 | 72 | One-worker action costs, proof + sparse interaction, winning-mover prefix, three rounds |
| confirmation.jsonl | 6cb7303 | 56 | Two finalist actions and five controls, two roots, four interleaved rounds |

Full SHAs, clean starting status, Node version, date and parameters are embedded
in each file. `summary.json` is regenerated and validated by
`experiments/strategist/analyze-actions.mjs`. No trial was dropped or silently
retried. Confirmation followed measured screening; it is not an independent
unselected holdout. The initial confirm invocation rejected a candidate name
before any trial began; this runner defect was fixed and recorded in a3721a0.

Windows / Intel i5-12600K / Node 26.7.0. QueryThreadCycleTime brackets whole solve
calls; sum every evaluator. Cold ingress/warmup/thread setup are excluded, while
solve-call frame setup/return and first 7x6 specialization remain included.
Other V8 thread work is not attributed to these counters. Strategist cycles are
recorded separately. Requested observation cadence stays 5 ms, with actual trace
timestamps retained. Case timeout remains 750 ms, private cache 4,096 slots per
worker, shared cache 16,384 slots, 20 untimed 4x4 warmups. Timings did not overlap
other campaign timing or correctness suites.

## Confirmed comparison

Median **total evaluator million cycles**, four repetitions:

| Configuration | A16 | B16 |
| --- | ---: | ---: |
| One worker, original completion/full sharing | 500.78 | 879.86 |
| Two workers, original completion/full sharing | 1003.06 | 1900.20 |
| Two workers, inert action strategist | 1054.52 | 1926.25 |
| Two workers, 1/8 sharing | 962.72 | 1796.69 |
| One worker, 1/8 sharing | 490.60 | 872.75 |
| One worker, stronger CPC + 1/8 sharing | 509.44 | 820.49 |
| One worker, private-only cache access | 475.96 | 843.73 |

Zero-based roots: A16=`2053635233350500`; B16=`1320461024522311`.
Both return absolute value 1 (P1 win; a loss for the even-ply mover).
The isolation stage also includes B15=`132046102452231`, a winning P1 mover
root. B15/B16 are adjacent positions, not independent game families. Therefore
the campaign covers only two distinct game families.

Whole-operation detail, confirmation medians:

| Root / one-worker action | Nodes | Cycles/node | Solve ms |
| --- | ---: | ---: | ---: |
| A16 sparse | 99,114 | 4,949.81 | 134.49 |
| A16 proof + sparse | 99,114 | 5,139.97 | 141.26 |
| A16 private-only | 99,114 | 4,802.10 | 132.06 |
| B16 sparse | 238,251 | 3,663.15 | 238.39 |
| B16 proof + sparse | 218,816 | 3,749.66 | 226.06 |
| B16 private-only | 238,251 | 3,541.35 | 230.83 |

Stronger proof reduces B16 visits by **8.16%** while raising cost per visited
node. The net cycle reduction pays for the extra proof effort there. A16 has no
node reduction and pays pure overhead. This is why neither source instruction
count, nodes/second nor node reduction alone decides acceptance.

The earlier isolation stage found 3.6% (B16) and 2.5% (B15) cycle savings for
proof + sparse versus sparse, and 3.2% extra cost on A16. Confirmation strengthens
the root-specific signal but does not establish one universal percentage.
Raw ranges and strategist cycles are retained in the summary.

Private-only gains are specifically one-worker observations. A private worker
still uses its existing local cache, but loses the shared table as a second
cache level and as a communication channel. Do not extrapolate the one-worker
gain to multiple workers.

## Policies that did not earn promotion

- Private helpers and delayed sharing after 64 observed hits did not beat the
  existing 1/8 shared-access control consistently. Hits include self reuse and
  are not a demonstrated cross-worker benefit signal.
- Stronger proof only on helpers, including private helpers, did not establish
  sufficient avoided duplicate work to beat one evaluator.
- Delaying proof enablement until 64 observed hits did not improve on immediate
  proof selection. Both delayed policies really changed flags during search;
  traces and private change counts confirm they were not inactive tests.
- Reversed recursive ties, alone or with stronger helper proof, did not show a
  consistent total-cycle gain. Root-order machinery was not changed.
- Two-worker stronger-proof + sparse reduced visits on B roots in isolation,
  but still cost over twice the corresponding one-worker proof + sparse solve.
  Higher throughput is not evidence of a better solve.

## Verification and review

Independent review found no live CPC scratch/frame, shared-reference lifetime,
root-order, STOP or extension correctness defect. It found two runner defects:
nullable timeout formatting and confirmation's stale candidate allowlist. Both
were fixed; the 132 earlier exact trials were unaffected. Historical files stay
unchanged. The final action timeout test exercises cancellation on empty 7x6
without inventing a result; it is a correctness control, not a performance score.

167 repository/experiment tests pass, including live combined-action WDL and
root-witness differential tests, extension overlap, repeated STOP and deadline
cleanup. Catalog, both generated-source checks, runtime geometry and patch
hygiene checks pass. These do not constitute new sealed-profile qualification.

## Next question

The missing strategy is a cheap applicability signal for stronger proof work.
The result is not permission to enable it universally or classify roots from
their names. Any proposed signal must be obtainable by the strategist within
the existing observation scope, survive unseen-root tests, and repay its full
evaluator action cost. If existing observations cannot supply that signal,
record that limitation rather than add worker instrumentation outside scope.

Reproduce with the commands in `experiments/strategist/README.md`; finalist run:

```text
node --experimental-ffi experiments/strategist/action-campaign.mjs confirm NEW.jsonl proof-sample8-one private-one
```
