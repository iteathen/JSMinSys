# Pre-authorized one-band screen

Clean tested commit: `9e5889ca8bd1a3bdb7aeaa76dadcc584268c0045`.
36 trials, three roots, four arms, three rotated repetitions; one evaluator,
20 warmups, unchanged 750 ms deadline and 5 ms observer cadence. Windows i5-12600K,
Node 26.7.0. Thread cycles bracket entire solve calls; strategist cycles are
separate in [raw evidence](screen.jsonl). Cold preparation and other V8 threads
are not included. B15 is B's predecessor, not an independent root family.

Median evaluator cycles (millions):

| Root | DEEP | Band-capable observer only | Delayed-release PFIF | One-band PFIF |
|---|---:|---:|---:|---:|
| A `2053635233350500` | 497.385 | 514.346 | 614.533 | 536.963 |
| B `1320461024522311` | 880.807 | 899.157 | 1,083.524 | 917.227 |
| B15 `132046102452231` | 890.163 | 910.046 | 1,085.237 | 924.154 |

One-band versus DEEP: +7.96%, +4.13%, +3.82%. It is substantially cheaper than
delayed release in this screen, but does not earn production promotion. The dormant
action/observation path itself also costs cycles; those costs are not excluded.

One-band nodes by repetition:

- A: 99,114 / 99,114 / 99,114; baseline 99,114.
- B: 238,270 / 238,265 / 238,254; baseline 238,251.
- B15: 235,529 / 238,180 / 238,258; baseline 238,252.

Delayed-release nodes ranged 109,892–115,945 on A, 264,969–343,470 on B,
268,840–278,383 on B15. Bounding execution removes the large work inflation;
the current width trigger still has not demonstrated enough useful work reduction
to pay for its entire machinery. These are small stochastic screens, not a proof
about PFIF generally or a standard full-game benchmark.

Admitted/completed one-band commands by repetition: A 0/1/1, B 2/2/2, B15 2/2/1.
Every admitted command completed; each created exactly one local shallow region.
Early exact/cutoff completion legitimately yields zero *incomplete* band retries.
The explicit command counter acknowledges it even if the strategist never samples
SHALLOW. Snapshot requests did not rearm consumed commands.

All 36 solves preserved baseline absolute value=1 and deterministic single-worker
witnesses (A/B column 3, B15 column 1, zero-based). All controls retained identical
node counts; no errors, timeouts or forced termination. [206 tests passed](tests.txt),
including automatic completion, repeated asynchronous commands, STOP, root restoration,
and request-token non-rearming. Catalog, generated source and geometry audits passed.
This is an experiment, not final NEES qualification or production promotion.

Reproduce:

```
node --test test/*.test.mjs experiments/strategist/*.test.mjs
node experiments/strategist/build-one-band.mjs --check
node --experimental-ffi experiments/strategist/pending-policy-campaign.mjs NEW_OUTPUT.jsonl 3 one-band
```

The raw metadata scope string describes the earlier delayed-release policy; the
explicit `profile: one-band`, four labels, tested source and this report identify
the actual comparison. No historical measurement was rewritten.
