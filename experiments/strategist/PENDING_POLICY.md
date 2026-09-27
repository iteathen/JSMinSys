# Width-triggered PFIF experiment

Optional strategist-only policy `modes-pending-pfif`. Ordinary worker traversal,
TT, move ordering, timeout and memory limits are unchanged. It uses the existing
observed worker and SHALLOW/DEEP flags. There is no worker-owned mode decision.

For each evaluator independently:

1. Start DEEP and request raw pending-branch snapshots.
2. Require two consecutive positive width deltas in the same solve, DEEP mode
   and horizon scope. Flat/negative deltas reset the run. Duplicate/stale revisions
   do not advance it. Time is not an input to this policy.
3. Request existing SHALLOW stride 2 and another snapshot.
4. Once an acknowledged SHALLOW snapshot shows a completed incomplete band,
   request DEEP. Discard cross-mode delta history.
5. Begin fresh comparisons on DEEP acknowledgements; future expansion can repeat
   the intervention. There is no global one-shot budget.

The requested snapshot exposes three additional existing counters: `modePasses`,
`modeRegions`, `modeRootPasses`. No new per-node progress counter was added.
The strategist derives completed incomplete bands as:

`modePasses - modeRegions + modeRootPasses - 1`

Each new local region starts one pass; each further pass starts after exhausting
an incomplete prior band. Root pass 1 is initial, so later passes similarly imply
completed incomplete root bands. This is execution progress, not a WDL proof.

The first observed completion ends the intervention. Delivery is asynchronous:
many bands may complete before the strategist samples and the worker receives
DEEP. `lastBurstBands` and `maxBurstBands` expose this overshoot. This is a soft
band-based release, not a hard one-band work limit or immediate interrupt.

The worker snapshot copies three more numeric words per request. No additional
node-level conditional, counter or action was introduced. The experimental layout
now has 12 header words; the standard 7x6 aligned region is still 1,408 bytes.
The historical observer-cost report remains tied to its prior exact revision.

## Qualification

Compare unchanged `modes-deep`, current `modes-pending-read` (observation only),
and `modes-pending-pfif` on the same three short fixtures. Three rotated rounds,
one evaluator, 20 warmups, unchanged 750 ms solve limit, 5 ms observation cadence.
All costs of observations and changed worker execution are inside evaluator cycles.
Record strategist cycles separately. Exact runs must preserve the known baseline
value and witness; controls must also preserve baseline node counts. Timeouts are
recorded as incomplete, never an exact result or a cycle-saving success.

```
node --test experiments/strategist/pending-policy.test.mjs experiments/strategist/pending-observation.test.mjs
node --experimental-ffi experiments/strategist/pending-policy-campaign.mjs NEW_OUTPUT.jsonl 3
```

Pending width remains a per-worker query-stack measure, not a global distinct-state
frontier. Going deeper may widen it. This campaign tests whether the signal predicts
a useful action; it does not presume that relation. The same candidate must pay
for observation overhead against unchanged DEEP before any promotion. No final
NEES or production optimization claim is implied by the experiment.
