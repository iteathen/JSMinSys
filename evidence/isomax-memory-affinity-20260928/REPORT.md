# Memory/affinity execution checkpoint

Canonical plan: Connect4 research/semantic-quotient@62dfb858, SHARED_TT_L2_EXPERIMENT_PLAN.md.
Selected measured source is clean be7c2887, external fixed worktree. Evidence branch contains only cold harness/data at this checkpoint.
M16: empty, 600000ms, 67108864 shared entries, 1048576 private per worker, 1 wide + 3 deep, pinned Node nightly. Then shared ABBAABBA on 35333571, 300000ms. No concurrent benchmark processes.

Cold harness accounting: module sample performs O(moves + workers) validation/reporting, dynamic imports, source lookup, geometry preparation, process-cycle reads, and the entire solve (symbolic SOLVE(config,position,OS)); allocations/FFI/process spawning/IO are nonzero variable host costs. Process solveCycles brackets the complete host/worker operation, including initialization/cleanup. Controller costs are external and excluded. No changed production add-on units or generated seals. Existing interval-CPC mechanical-ledger undercounts remain a known prerequisite before NEES certification; these raw physical measurements are not a NEES certification.

Stages 3–5 pending cold affinity implementation/qualification. Do not claim cache residency, exact solve improvement from censored samples, or capacity promotion before repeated comparison.
