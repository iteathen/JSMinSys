# Pre-authorized one-band PFIF action

This optional worker variant isolates asynchronous release cost. It keeps the
existing two-positive-delta strategist trigger and stride 2. The command includes
its extent in advance; no release round trip is necessary for the worker.

Bit 9 arms one band at the next non-root, non-forced branch. The branch owns that
command and its native retained frame; descendants cannot start further regions.
At the end of its first band (or an earlier exact/cutoff completion), execution
restores DEEP and increments `bandCompleted`. Incomplete child obligations remain
in the same native frame and continue DEEP. No board reconstruction, rescheduling,
TT mutation or new evaluation is introduced.

The unchanged per-completed-node load/equality path remains. A changed bit 9 arms
the command; bit-8 snapshot toggles cannot rearm it. The strategist sees the
completion counter even when it misses the SHALLOW interval, clears bit 9, and
requires fresh DEEP width comparisons before another command. One command may be
outstanding per worker. STOP still aborts; an aborted band is not marked completed.

The experimental root loop stays DEEP; commands bind to recursive branches.
This matches the local-region action exercised by mid-solve width triggers. Tests
also cover an initial command before root traversal. This is a mechanical bounded
action selected by the strategist, not worker-owned width interpretation or policy.

Cost is explicit: admission tests at branch setup, a local ownership scalar and
completion tests/stores at existing branch/band boundaries. Ordinary cache/CPC
returns do not gain another control poll. Requested snapshots gain one raw word
for `bandCompleted` in the existing 12-word header; old observation variants store
zero there. No new per-node progress counter, clock or message was added.

## Screen

```
node --test experiments/strategist/one-band.test.mjs
node experiments/strategist/build-one-band.mjs --check
node --experimental-ffi experiments/strategist/pending-policy-campaign.mjs NEW_OUTPUT.jsonl 3 one-band
```

Four arms: unchanged DEEP, one-band-capable observation-only DEEP, prior delayed
release PFIF, pre-authorized one-band PFIF. Three roots and three rotated rounds,
one evaluator, unchanged 750 ms limit and 5 ms cadence. This measures both dormant
action overhead and whole-operation action costs. No production promotion or final
NEES claim follows from the experimental implementation alone.
