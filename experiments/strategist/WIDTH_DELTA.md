# Width-delta strategist candidate

Owner-approved question: use change in unresolved search width to select
SHALLOW/DEEP, with all decisions and new observation work in the strategist.
No evaluator source, flag decoder or generated worker changes in this pass.

## What can be observed

The shared exact cache contains completed values, not pending branch topology.
It cannot identify worker-private unresolved frontier width. The first candidate
therefore uses a **root-derived projected frontier**, reconstructed privately
by the strategist with existing JSMinSys RBA cofactor/canonicalization/CPC
helpers. Root q and prepared geometry arrive once through cold initialization.
There is no physical replay, worker instrumentation or TT mutation.

Width is the number of distinct canonical q at one complete projected ply,
excluding terminal/CPC-exact q and q whose exact TT record was observed. Legal
forced/preemption restrictions use the same native CPC contract. Full content
deduplicates identities; hashes locate only. Basis follows support/cofactor.
It is not TT occupancy, a legal move count, active worker width, or a complete
alpha/beta dependency graph. In particular private bounds and pruned obligations
are invisible; convergence beneath a since-closed ancestor can remain counted.

Each accepted observation processes the whole retained frontier. Refreshes at
the same ply remove newly observed exact entries; completed advances move one
ply deeper. Both compare unresolved q counts under the same projected-frontier
definition. Reads are individually version-bracketed, not one global atomic
snapshot. Exact facts remain valid; unresolved entries may already have closed
elsewhere by publication time. This is an explicitly approximate search signal.

## Policy

Initial mode DEEP. First sample establishes width, not a delta. For each later
complete revision of the same scope:

- positive delta selects SHALLOW;
- negative delta selects DEEP;
- zero holds the current mode;
- incomplete/duplicate/stale observations do not change the policy;
- a different scope resets the comparison and defaults to DEEP.

The relative candidate additionally requires growth >=25% of prior width to
enter SHALLOW. That is a screening parameter, not a researched optimum.
Observation-only runs compute the same signal but retain DEEP for every worker.
No elapsed-time, tick-number or store-count threshold selects these modes.
The existing asynchronous cadence schedules observations only.

## Bounds and cost

Two private prepared arenas hold up to 512 q each; dedup has 1,024 slots.
Each loop processes at most 64 parents, yielding between chunks. An overflow
discards only the partial next layer and keeps the last complete width.
No fabricated collapse or truncated-width decision is allowed. While blocked,
the observer refreshes the retained layer and retries expansion only after it
shrinks. The policy may consequently hold an unproductive mode; measure that
failure rather than introducing a time-based escape disguised as width logic.

All native observer algebra runs in the strategist. The read-only TT helper
uses the existing publication/equality contract without the normal probe's
shared hit increment. Fixed prepared numeric arrays and JSMinSys span/probe
primitives handle reconstruction/dedup. No production-library API change.

The evaluator hot path is byte-identical to the mode-control checkpoint.
Indirect contention/cache/CPU effects still count: compare fixed DEEP with
observation-only before interpreting active-control results. Whole evaluator
solve-call cycles are primary; strategist cycles, work and capacity events are
reported separately. Cold setup is outside that cycle interval, as before.
No final NEES or production promotion claim.

## Qualification and reproduction

Tests compare the first three projected plies against independent ingress-based
enumeration on 4x4 roots/mirrors, validate exact identity/collision/odd-version
behavior, prove the TT arrays/counters remain unchanged, reject incomplete
capacity samples, and exercise actual asynchronous width-driven flags.

```sh
node --test experiments/strategist/width-policy.test.mjs experiments/strategist/width-observer.test.mjs
node --experimental-ffi experiments/strategist/width-campaign.mjs <new-output.jsonl> 1
```

Two established 7x6 families are screened; the third root is B's predecessor,
not an independent family. Each trial remains bounded at 750 ms. Only repeat
the initial screen if it provides useful information to sharpen.
