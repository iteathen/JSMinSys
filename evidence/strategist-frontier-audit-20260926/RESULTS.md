# Frontier implementation audit and narrowing repair

The owner's challenge was substantiated. The initial fixed-pass implementation
omitted the stopping condition that makes exploration useful: stop bounding
the search when the remaining work is narrow enough. It continued deepening
after only one root action remained unresolved, even in the one-worker screen.
Those timeouts were not a fair test of the complete PFIF strategy.

Inspected live predecessor `87e05ac299e2fcf40df6e68ca9e0087d4befd553`.
Repair and timed retest: `c2eb8a6758de4261d82992af9eafc8320fdf46d2`.
No ordinary solver, TT, host, BSFP, or scheduler changes.

## Verified implementation failures

1. **No narrowing stop.** On B, stride 2 resolved six of seven root actions in
   the first 46 visited nodes, but continued fixed passes to the diagnostic
   800,000-node budget without completing. The baseline completed in 238,251.
   On A, one root action remained after 7,898 nodes, but fixed passes likewise
   exhausted the budget; baseline completed in 99,114.
2. **Weak retention.** Each pass traversed from the root again. It retained
   exact TT facts and exact root-action values, but no partial action intervals
   or materialized frontier. Returning sentinel 4 erased non-closing interval
   information; it was safe for WDL but weak for future pruning.
3. **Wide shallow work, not merely repeated prefixes.** On B, fixed stride 4
   visited 49,208 nodes at relative plies 1–8 by the diagnostic budget, compared
   with 1,109 in the complete baseline solve. Horizon cutoffs prevented deep
   proof propagation and left many siblings unresolved. Moving the horizon
   check earlier would make a node cheaper while discarding still more proof;
   it would not repair this structural problem.
4. **Incomplete strategist.** Its fixed stride/timed-release policies did not
   observe a surviving frontier or route workers to retained branches. The
   original campaign had one evaluator, so it could not test multiworker routing.
5. **Root-window deviation.** The specialization uses full-window root child
   probes. The baseline's root-window optimizations were not preserved. This
   is a real limitation, but not the cause of these two failures: the full-
   continuation control matches baseline node counts exactly on both roots.

The measurement harness did record timeouts and cleanup honestly. The bad
inference was treating that impoverished implementation as a useful test of
the broader idea. Correct WDL tests alone did not qualify the intended strategy.

## Narrow repair

Primary flag bits 24..28 carry a remaining-root-action target. Zero disables
automatic release. The strategist's `frontier-{2,4,8}-narrow` policies set it to
worker count. The worker maintains one pending-root counter and releases into
full continuation immediately when the target is reached. The check runs only
on root entry and newly resolved root actions; no new recursive-node check,
per-node telemetry, messages, copying, TT mutation or scheduler was introduced.
Existing native frames and exact caches survive the release.

This is a **root-concentration guard**, not a count of all frontier leaves.
The complete retained-frontier, partial-bound, and multiworker routing design
is still not implemented. Do not expand this result into such a claim.

The failure was reproduced first by a deterministic test: the original policy
could not finish B within 300,000 nodes. The target-release action finishes with
the same WDL/root witness. Tests also cover an already-met target, actual
strategist/evaluator wiring, invalid encodings, STOP, and independent physical
minimax on seeded 4x4 positions with automatic release both enabled and disabled.

## Matched cycle retest

Same Windows/i5-12600K host, Node 26.7.0, one evaluator, private/shared exact cache
4,096/16,384, 20 4x4 warmups, three rotated repetitions, same **750 ms timeout**.
A = zero-based moves `2053635233350500`; B = `1320461024522311`.
Cycles are whole evaluator solve-call medians, including all exploration,
repeated work and final continuation. Strategist cycles are separately captured.

| Configuration | A cycles M | A nodes | B cycles M | B nodes | Solved |
|---|---:|---:|---:|---:|---:|
| Baseline | 498.847 | 99,114 | 882.519 | 238,251 | 6/6 |
| Frontier worker, full continuation | 507.515 | 99,114 | 887.880 | 238,251 | 6/6 |
| Old fixed 4-ply policy | 2,849.404 | 411,900* | 2,773.570 | 424,370* | 0/6 |
| 2-ply + narrowing release | 470.758 | 89,042 | 48.144 | 5,838 | 6/6 |
| 4-ply + narrowing release | 1,291.143 | 196,801 | 50.587 | 5,983 | 6/6 |
| 8-ply + narrowing release | 1,298.590 | 197,629 | 202.111 | 22,117 | 6/6 |

\* Work consumed before timeout, not work to solve.

All **18 repaired-policy trials solved**, with identical node counts within
each configuration, exactly one automatic release, matching baseline WDL and
root move, and clean shutdown. The six old fixed-policy controls still timed
out. The complete retest is 36 trials: 30 solved, six timed out, no failures or
forced terminations.

The repaired 2-ply candidate reduced median cycles **5.63% on A** and **94.54%
on B**. Wall medians: A 138.85 → 129.56 ms; B 244.33 → 13.56 ms. Its cycles/node
were worse: A 5,033 → 5,287; B 3,704 → 8,247. Work reduction paid for the added
cost. These whole-call ratios include fixed setup/JIT costs and are not isolated
instruction costs per node. The 4/8-ply candidates remained about 2.6x as expensive as baseline on A,
despite completing; the narrowing repair does not make arbitrary strides good.

## Why the large B improvement is credible

An instrumented, non-timed action trace reproduced the same node counts:

| Root action (zero-based column) | Baseline cumulative nodes | Repaired 2-ply cumulative nodes |
|---|---:|---:|
| 3 | 183,624 | 7 |
| 2 | 185,259 | 14 |
| 4 | 207,179 | 20 |
| 1 | 207,349 | 27 |
| 5 | 224,753 | 33 |
| 6 | 232,451 | 38 |
| 0 | 238,251 | 5,838 |

The bounded probe finds short exact refutations for the first six root moves
without following the baseline's expensive deep continuations. At 38 nodes,
one unresolved root move remains; the repaired guard releases it immediately.
That final move costs 5,800 more nodes, exactly the baseline's final increment.
The old policy instead bounded that remaining move again and expanded broadly.
This separates the useful exploration effect from the implementation mistake.

On A, release occurs only after the 2-ply sequence reaches relative depth 6.
Larger strides overshoot into a much more expensive prefix before resolving
the narrowing condition, explaining their remaining regression.

## Evidence and limits

- `work.jsonl`: original implementation, deterministic 800k-node diagnostic.
- `recheck.jsonl`: uninstrumented worker timing trials at the repaired SHA.
- `repaired-work.jsonl`: instrumented root-action/depth explanation; **not timing evidence**.
- `summary.json`: exact aggregates and cycle ranges from timing trials.
- `tests.txt`: all 176 tests pass. Generator/catalog/runtime-geometry and patch checks pass.

Only two independent losing-root fixtures and three repetitions were timed.
This is strong evidence for the omitted stopping condition and a promising
2-ply candidate on these roots, not general solver qualification or NEES
promotion. Root ties remain deterministic, the timeout was not increased,
and neither historical failures nor previous timing files were rewritten.

Reproduce with fresh output paths:

```text
node experiments/strategist/audit-frontier.mjs NEW-WORK.jsonl fixed
node experiments/strategist/audit-frontier.mjs NEW-NARROW-WORK.jsonl narrow
node --experimental-ffi experiments/strategist/recheck-frontier.mjs NEW-TIMING.jsonl
node experiments/strategist/analyze-frontier.mjs evidence/strategist-frontier-audit-20260926 recheck.jsonl
```

The next meaningful investigation is whether the same short-refutation benefit
persists on independent winning/drawing roots and how to retain useful partial
bounds within the authorized worker-action scope. Do not use this repair as
permission to create another shared authority or rewrite the ordinary solver.
