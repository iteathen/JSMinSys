# Performance First Iterative Frontier: worker-action experiment

The owner explicitly authorized supplying actions inside the worker. Existing
cache/CPC/tie controls could not implement a bounded frontier. This experiment
adds that missing capability without changing the ordinary solver or TT.

## Actions and execution

- Primary word bits 16..21: stride, 1..63 plies relative to the solve root.
- Bit 23: enable successive bounded passes.
- Bit 22: release into full continuation. Clearing enable also releases.
- Bit 0: existing STOP. Bit 31: existing extension protocol.

The existing per-completed-node reader applies changed words. Stride changes
take effect on the next pass. Release increases the current horizon immediately
at that control boundary; it does not abandon or restart the active frame.
The strategist publishes the initial command after warmup and before the run
barrier. It never writes TT contents or search frames.

`build-frontier.mjs` produces an opt-in specialization of the existing native
CPC/RBA search. The evaluator selects it cold for `frontier-*` policies. The
ordinary worker has no new horizon comparison. All root/action storage is
preallocated. Root RBA ingress, live-state initialization, and cache epoch reset
occur once per solve, not once per pass. Each unresolved node stops after cache
and CPC evidence at the selected horizon. Numeric 4 means unfinished, distinct
from cancellation and WDL. It is never negated through a forced chain, cached,
or used to update alpha. A witnessed cutoff remains valid despite unfinished
siblings; otherwise an unfinished child keeps the parent unfinished.

Exact TT facts and solved root-action values persist between passes. Root order
is unchanged. An earlier unresolved action prevents choosing a later tied
witness. This first candidate uses full-window probes for unresolved root
actions; that loses some baseline root pruning and is a deliberate, measured
limitation. It retains exact values, not a complete set of partial action
intervals or a materialized frontier. No new queue/manager/TT authority exists.

This is the first PFIF worker-action candidate, not the complete original
multiworker routing strategy. It does not yet expose surviving branch counts or
assign distinct retained branches to workers. Do not label it successful PFIF
solely because the actions execute correctly.

## Qualification and accounting

1. Failing tests first establish absent worker actions.
2. Qualify increasing horizons, forced transit, exact cache retention, mirrors,
   deterministic root witness, terminal ingress, live stride/release/STOP,
   tiny-cache collisions, independent physical minimax, and real worker cleanup.
3. Screen baseline, zero-action worker, full-continuation specialization, strides
   2/4/8, and stride 4 released after 32 ms. Three rotated repetitions on each
   of the two established independent 7x6 root families; 750 ms unchanged limit.
4. Compare whole-operation evaluator thread cycles, nodes, cycles/node, wall
   time, horizon stops and pass counts. Every repeated pass is charged. A timeout
   is incomplete, not a cheap solve. Record strategist cycles separately.

Hot cost ledger: unchanged flags retain one shared read and comparison; changed
flags add bounded masks/shifts and prepared scalar assignments. The PFIF search
adds a horizon comparison, unfinished-result handling, and repeated-pass work.
The full-continuation control isolates the new path from actual deepening. No
per-node clocks, callbacks, messages, strings, allocation, or reporting were
added. Windows QueryThreadCycleTime brackets each evaluator solve, including
in-call initialization and cancellation tails; it excludes warmup, cold setup,
other V8 threads and the separately recorded strategist. Do not infer an exact
five-cycle dispatch cost from these measurements or claim sealed NEES promotion.

Research context remains the Core 0.19 IsoMax DP campaign and the primary engine
sources in ACTION_CAMPAIGN.md. In particular, exact-only TT facts must not be
silently treated as direction-bearing alpha/beta bounds. An unfinished horizon
is not a game evaluation. This experiment stays entirely within native RBA.
