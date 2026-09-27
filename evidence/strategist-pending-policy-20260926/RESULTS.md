# Width-triggered repeated PFIF: first policy screen

Tested clean JSMinSys commit `51000dc47a4778fb320eb8bbe6688f02513f2848`.
Local date 2026-09-26; raw UTC 2026-09-27. All 27 trials solved with matching
baseline values/witnesses and clean shutdowns. The candidate is not promoted:
median whole evaluator cycles increased on every tested root.

This negative result applies to this trigger/action/delivery combination, not to
all PFIF strategies or all width signals. One fired intervention reduced work on
A, but it did not repeat consistently. B and B15 consistently paid more work when
the strategy fired. B15 is B's predecessor, not a third independent root family.

## Implemented behavior

The asynchronous strategist requests raw per-worker pending-branch snapshots.
Two consecutive positive width deltas in comparable DEEP snapshots request the
existing SHALLOW stride-2 action. The first acknowledged SHALLOW snapshot showing
a completed incomplete band requests DEEP. Fresh comparable DEEP observations
can trigger another intervention. No elapsed-time threshold chooses modes.

The existing evaluator algorithms, move ordering, TT, capacity and deadline are
unchanged. Three existing pass/region counters were added to requested snapshots;
all progress interpretation lives in the strategist. No new per-node counter or
decision was added. The worker publishes three more uint32 words per request.

The strategist derives completed incomplete bands from:
`modePasses - modeRegions + modeRootPasses - 1`.
This measures completed traversal bands, not solved positions or proof depth.

The release is asynchronous and soft, not a hard one-band work budget. Diagnostic
`maxBurstBands` is progress at the release decision, not at worker acknowledgement.
Raw trace samples permit inspecting the later DEEP acknowledgement too.

Implementation/protocol: [PENDING_POLICY.md](../../experiments/strategist/PENDING_POLICY.md).

## Method

Windows, Intel Core i5-12600K, Node v26.7.0 / V8 14.6.202.34-node.28.
One evaluator plus one strategist; three roots; three variants; three rotated
repetitions = 27 trials. Each has 20 warmups, fresh caches (local 4,096/shared
16,384 entries), unchanged 750 ms solve limit, and 5 ms observation cadence.

Controls: unchanged `modes-deep`; current observation-only `modes-pending-read`.
Candidate: `modes-pending-pfif`. Observer and candidate use identical snapshot
layout. All snapshot work and action execution are charged to evaluator cycles.

Windows QueryThreadCycleTime brackets the whole evaluator solve call; strategist
thread cycles are recorded separately. Preparation and other V8 threads are outside
these brackets. These are thread-cycle measurements, not full-host instruction
counts. The async strategist still consumes CPU/cache resources.

Raw measurements: [screen.jsonl](screen.jsonl). Qualification: [tests.txt](tests.txt).

Across all 27 trials: 21,746,988,671 evaluator cycles, 213,540,662 strategist
cycles and 5,389,723 evaluator nodes. All trial costs are retained, including
candidate runs that never fired an intervention.

## Results

Median whole evaluator cycles, millions:

| Root (zero-based moves) | DEEP | Observer only | Width PFIF | PFIF vs DEEP |
|---|---:|---:|---:|---:|
| A `2053635233350500` | 509.578 | 510.062 | 513.080 | +0.69% |
| B `1320461024522311` | 882.441 | 906.001 | 1,143.244 | +29.55% |
| B15 `132046102452231` | 885.639 | 892.981 | 1,016.908 | +14.82% |

| Root | DEEP nodes | PFIF median nodes | DEEP median cycles/node | Observer median cycles/node | PFIF median cycles/node |
|---|---:|---:|---:|---:|---:|
| A | 99,114 | 99,114 | 5,141.33 | 5,146.22 | 5,194.13 |
| B | 238,251 | 284,539 | 3,703.83 | 3,802.72 | 3,837.37 |
| B15 | 238,252 | 272,072 | 3,717.24 | 3,748.05 | 3,978.27 |

Each column is independently median-reduced; median cycles divided by median
nodes need not equal median per-trial cycles/node. Every control preserved its
original node count. Whole-cycle ranges show A is unresolved noise at the median,
while B/B15 candidate cycles exceed their controls in every repetition:

| Root | DEEP range, Mcycles | Observer range | Candidate range |
|---|---:|---:|---:|
| A | 490.966–547.990 | 508.747–521.047 | 456.465–514.811 |
| B | 875.582–883.502 | 879.961–921.337 | 1,075.117–1,160.219 |
| B15 | 884.249–918.034 | 883.337–901.729 | 947.831–1,116.128 |

Median strategist cycles, millions:

| Root | DEEP | Observer | Candidate |
|---|---:|---:|---:|
| A | 4.320 | 6.916 | 7.227 |
| B | 6.519 | 8.934 | 10.423 |
| B15 | 6.461 | 9.483 | 10.330 |

## Did the action actually happen?

Candidate repetitions in chronological order:

| Root | Trigger counts | DEEP release requests | Nodes | Horizon stops |
|---|---|---|---|---|
| A | 1 / 0 / 0 | 0 / 0 / 0 | 87,257 / 99,114 / 99,114 | 588 / 0 / 0 |
| B | 2 / 2 / 2 | 2 / 2 / 2 | 297,924 / 281,813 / 284,539 | 23,554 / 17,410 / 19,431 |
| B15 | 0 / 2 / 1 | 0 / 2 / 1 | 238,252 / 275,936 / 272,072 | 0 / 14,821 / 14,799 |

Six of nine candidate trials triggered; four demonstrated repeated interventions.
A's fired trial solved before the strategist observed a release condition. It
visited 11.96% fewer nodes than DEEP and used 456.465M cycles, versus the DEEP
median 509.578M. That is a useful isolated positive observation, not a repeatable
strategy win: neither other A trial triggered.

For B, maximum completed-band progress at the release decision was 18 / 16 / 26
across repetitions. At the later sampled DEEP acknowledgement, the corresponding
largest spans were 20 / 17 / 27. For B15's fired trials they were 9 / 11 at release
and 10 / 12 at acknowledgement. The spans include asynchronous delivery and
transition; they are not an exact count of exclusively SHALLOW bands. Some progress
can occur while retained regions finish after DEEP is received.

All fired decisions occurred 14–23 plies below the supplied root. The signal
observes the active recursive query stack; it does not reconstruct an early,
global level frontier. A deeper active path itself can increase pending width.

## Interpretation and disposition

1. This is primarily a work-inflation problem on B/B15, not merely the cost of
   reading flags. Their nodes increase substantially along with total cycles.
2. Two positive stack-width deltas do not reliably identify a beneficial place
   for the existing SHALLOW action. No new pruning proof follows from this signal.
3. The intended short intervention is loosely controlled: many bands complete
   before asynchronous release. This does not prove a faster polling cadence would
   fix the strategy; it establishes a delivery/action granularity limitation.
4. A shows that an intervention can reduce work, but the benefit was dependent on
   where the asynchronously sampled trigger landed. Three repetitions are a small
   causal screen, not a general distributional claim.

Retain the candidate as reproducible experimental evidence; leave production
unchanged. Do not promote, extend timeouts, or tune broad parameter grids on this
result. A next candidate should justify a better connection between the observed
expansion and the action's useful scope, while retaining the observer-only control.
Any hard work-bounded action would be a separately measured worker-action change;
it must not be smuggled in as a strategist-only optimization.

## Qualification and reproduction

202/202 tests passed, including real native mode changes preserving exact answers,
root restoration, repeated rearming, ignoring stale/duplicate snapshots, mode and
horizon scope guards, plus two-worker asynchronous delivery and clean cancellation.
All measured trials returned value=1 and baseline witness A=3, B=3, B15=1; this is
agreement with existing solver qualification, not a new independent full-7x6 oracle.
No timeout, worker error, conflicting exact value or forced termination occurred.

Catalog, generated observed-worker equality, runtime geometry and patch whitespace
checks passed. No generated evaluator traversal code was changed. This is not a
final NEES qualification or a production promotion.

```
node --test test/*.test.mjs experiments/strategist/*.test.mjs
node tools/verify-catalog.mjs
node tools/audit-runtime-geometry.mjs
node experiments/strategist/build-observed-modes.mjs --check
node --experimental-ffi experiments/strategist/pending-policy-campaign.mjs NEW_SCREEN.jsonl 3
```
