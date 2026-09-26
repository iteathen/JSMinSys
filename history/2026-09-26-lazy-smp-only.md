# Lazy SMP execution cleanup

Owner direction: Lazy SMP is the only active IsoMax parallel execution model.
Baseline: `d41bd3d3042024b0c5a5a9c316d89be2b3a48fda` (159 tests passed).

Plan: remove the RBA-specific shared-work TT, Branch Manager composition and
publication/reconciliation evaluator; extract cold ingress; retain RBA algebra,
the private worker search kernel and consumer-neutral primitives. Update catalog
and tests, qualify, independently review, then integrate downstream into IsoMax.
Archive competing experimental branch heads before removing those branches.

The deleted source is recoverable from the baseline commit: `addons/rba-tt32.mjs`,
`addons/rba-branch-manager.mjs`, and the scheduling portion of
`addons/rba-connect4-solver.mjs`. Its dedicated tests and TT microbenchmarks are
historical evidence, not qualification of Lazy SMP. No compatibility exports or
inactive scheduler switches remain. Generic worker/BranchManager/session and
numeric primitives remain reusable library components, not another Connect4
solver. Four-front algebra remains a per-worker refinement/reference facility,
not a competing distributed execution architecture.

Cold ingress retains its existing semantics and moves to
`addons/rba-connect4-ingress.mjs`. The active worker, alpha-beta, coordinate,
front, CPC and exact-cache implementations are unchanged by this cleanup.
Catalog entries for deleted functions are removed, not assigned zero cost.
Remaining source guards and call edges continue to be checked.

This is architecture cleanup, not a claimed performance optimization or new
whole-system NEES certification. Historical failures and timings are preserved.

Qualification: Node 26.7.0, 138/138 tests passed (23 retired-model tests
removed, two architecture guards added); catalog 297 sealed functions and 113
add-on units; geometry audit passed; CPC/front A/B and retained addon benchmark
completed. Baseline was 159/159. Hot solver implementations compare identical
to the baseline Git blobs; only the host ingress import changed.
