# Requested raw pending-branch observations

Experimental only. Production solver, TT semantics, ordering, pruning, memory
limits and deadlines are unchanged. This is observation qualification, not a
width-driven strategy or final NEES qualification. All measured workers stay DEEP.

The worker retains numeric branch counts and child-completion markers that its
traversal produces. The strategist requests a snapshot by toggling bit 8 of the
existing behavior word. The existing per-completed-node reader arms the request;
the next branch-before-child boundary publishes it without waiting for a reader.
The strategist reads the snapshot, calculates width and delta, then toggles the
request bit again. No TT scan or board reconstruction is involved.

## Meaning and scope

Each active branch frame contains outstanding alternatives. A deeper frame refines
one outstanding alternative of its parent. Therefore the strategist calculates:

`pending query width = sum(unresolved alternatives) - (active frames - 1)`

Forced gaps have no branch row. The root uses its existing result markers; other
frames reuse existing completion markers. These are per-worker pending query
obligations, not unique game states or a globally deduplicated frontier. Widths
must not be added across workers and described as unique positions. A snapshot is
not a proof that any alternative will ultimately require expansion.

Deltas require the same solve epoch, mode and horizon-stop count. Shallow horizon
returns can coarsen unfinished obligations without pruning; such discontinuities
invalidate comparisons. Fixed-DEEP qualification avoids that ambiguity. The last
snapshot can remain positive after completion and is not a completion indicator.

## Ownership and consistency

Each worker owns one shared region, initialized once before search. A monotonically
increasing even sequence brackets publication with an odd in-flight value.
All shared fields use numeric atomic accesses. The strategist accepts only an
unchanged even sequence and never spins waiting for publication. Sequence exhaustion
stops publication rather than wrapping. A fresh region is required for binding.

One outstanding request per worker bounds traffic. The worker copies the fixed
header and only active-depth rows/count-selected markers. This is requested copying
of raw scalar metadata, not zero-copy observation. The strategist owns interpretation,
allocation of report objects and delta calculation. No hot strings, allocation,
clocks, messages, waiting or new evaluation occur in the worker observation path.

For 7x6: 1,408 shared bytes and 172 private count bytes per evaluator. Existing
completion storage is reused. Standalone preparation also creates a cold default
region, replaced by the host-owned region before measured execution.

## Costs that must be counted

Even with no requests, the optional generated variant clears a private count at
node entry, stores branch counts, initializes completion markers and records child
completion, and tests a private pending-request scalar at branch boundaries.
Unchanged behavior words retain the original load/extension/equality path. Changed
request words also pay the request decode. Requested publication pays all atomic
stores and the scalar-copy loop within evaluator solve cycles.

Compare unchanged `modes-deep`, `modes-pending-off` and `modes-pending-read` with
rotated trial ordering. Report whole evaluator solve-call cycles and cycles/node,
strategist cycles separately, raw publication counts and width ranges. A substantial
cost is a failed cheap-observation candidate, not permission to hide that cost.
The 5 ms reader cadence is a fixed observation screen parameter, not an optimized
strategy cadence. No width-driven mode switching is enabled here.

## Reproduction

On the cycle-capable Windows Node host:

```
node --test experiments/strategist/pending-observation.test.mjs
node experiments/strategist/build-observed-modes.mjs --check
node --experimental-ffi experiments/strategist/pending-campaign.mjs NEW_OUTPUT.jsonl 3
```

Three roots, three variants, three rotated repetitions: 27 trials. Each has one
evaluator, 20 warmups and the unchanged 750 ms solve limit. Two roots are related
(B15 is B's predecessor). Every trial must solve with identical WDL, witness and
node count across variants. This is a small causal screen, not a standard full
benchmark or general performance claim.
