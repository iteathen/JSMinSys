# C51 guarded whole-reservoir non-loss — frozen tactical experiment

Status: bounded discovery/proof and measured optimization, not retained.
Parent: retained configuration after J05/C48 ablation; record exact parent before
implementation. Current-position certificates only, no solved inputs, CPC/NDC/
BSFP production modules unchanged. Initialization secondary, prepared-empty
exact7x6 four-worker wall primary. No per-node reporting/allocations.

## Identified omission and proof

The current minimal prepared whole-reservoir WIN certificate requires one own
residual wholly in guaranteed response cells AND denial of every opponent
residual under one common legal pairing policy. The second premise alone proves
controller NONLOSS, not WIN. This claim is independent of old mixed CPC/NDC
implementations. Recover its legal strategy explicitly:

Controller is previous mover; opponent moves next. Remaining capacity is even.
Pair even column tails as lower->upper. For odd tails, pair their initially
playable frontier cells in ascending column order, then vertically pair each
remaining tail. A response fills the paired partner of the trigger. Partners
are disjoint and become playable by gravity. Every opponent line is denied if
it contains a fixed upper response cell strictly above its frontier OR both
members of one current frontier pair. Thus the opponent cannot complete any
live line before a response; at finite exhaustion the controller may win or
draw. Already-terminal states/incorrect controller/odd capacity are unresolved.
No parity-only ownership claim, no omitted frontier/tempo/deadline guard.

Optional own guarantee promotes the SAME policy to WIN as before. Without own
guarantee, report NONLOSS only. Never infer DRAW from a failed own guarantee.
Target-truncated certificate remains WIN-only because its above-target deadline
uses an actual own win; do not remove that premise.

## Optimized realization and integration

Reuse existing geometry-only prepared response tables and worker-local partner
scratch. Companion evaluates common-policy opponent denial FIRST, returning
unresolved at the first uncovered residual. Only after full denial check own
fixed-response guarantee; return0 unresolved,1 controller WIN,2 NONLOSS. This
shares preparation/denial between old WIN and new NONLOSS instead of adding a
second full scan. Public original WIN function/module and legacy NDC unchanged.
Generate companion from current authority with asserted transformations; no
manual solver fork or literal7x6 logic.

Minimal negamax captures original caller window as before. Controller NONLOSS
means current mover<=DRAW: depth&&alpha>=0 may return0 as an upper bound;
otherwise cap beta at0. Retain stronger target WIN check when not already cut.
Physical stops remain first win/full board. Root must obtain a legal optimal
witness through existing moves, not return move=-1. Existing original-window
TT classification, gauge/reflection/publication and ordering remain unchanged.
Change base minimal authority then regenerate center/proof/native/resource
companions; no new permanent option grid. This is one isolated source candidate,
so restore all affected runtime/ledger paths completely if unqualified.

## Gates

Missing module/function test must fail before implementation. Independent literal
physical policy builds legal pairs without candidate geometry tables and
classifies0/1/2. All nonterminal reachable4x3 and3x4 states, both physical and
canonical frames, both controllers; after evaluation, independently verify
positive1 is loss for mover and positive2 value<=DRAW. Original WIN positives
must remain admitted as1 under the same policy. General dimensions/reflection/
poison/disjoint frames, terminal/odd/controller negatives and non-loss-without-win
controls. No scalar replay on sealed3x6-k4/5x3-k4. Actual generated search window
controls cover cache bounds/cutoffs/legal root witnesses; four-worker independent
physical minimax follows. Fast1..10 dimensions physically covered, full7x6 only
for optimization. Verify generators/source ledger and actual optimized V8 path.

Compare full unprofiled exact7x6 against immediate retained parent with recovered
512MiBprivate/4GiBshared/complete plans/fourPcores; repeat competitive trials.
Extra scanning/branch/JIT pressure may outweigh cuts. Failure rejects this child
policy/realization, not broader CPC/live-line pruning. No witness exceptions or
post-replay rule patches. Node work metrics remain unavailable without hot cost.
