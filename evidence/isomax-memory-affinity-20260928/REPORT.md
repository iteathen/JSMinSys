# Memory/affinity execution checkpoint

Canonical plan: Connect4 research/semantic-quotient@62dfb858, SHARED_TT_L2_EXPERIMENT_PLAN.md.
Selected measured source is clean be7c2887, external fixed worktree. Evidence branch contains only cold harness/data at this checkpoint.
M16: empty, 600000ms, 67108864 shared entries, 1048576 private per worker, 1 wide + 3 deep, pinned Node nightly. Then shared ABBAABBA on 35333571, 300000ms. No concurrent benchmark processes.

Cold harness accounting: module sample performs O(moves + workers) validation/reporting, dynamic imports, source lookup, geometry preparation, process-cycle reads, and the entire solve (symbolic SOLVE(config,position,OS)); allocations/FFI/process spawning/IO are nonzero variable host costs. Process solveCycles brackets the complete host/worker operation, including initialization/cleanup. Controller costs are external and excluded. No changed production add-on units or generated seals. Existing interval-CPC mechanical-ledger undercounts remain a known prerequisite before NEES certification; these raw physical measurements are not a NEES certification.

Stages 3–5 pending cold affinity implementation/qualification. Do not claim cache residency, exact solve improvement from censored samples, or capacity promotion before repeated comparison.

## M16 observed result
TIMEOUT at600028.2634ms; rootWdl=null; no solve claimed.
1318300093 nodes;8133553305152 process cycles;2205126ms CPU.
Shared hits305322080,stores48791093,contention436562.
PeakRSS2944532480B; all4workers active/exited,cleanup=true,errorCode102,errors=[].
Previous same-source/nightly4M-shared empty run also timed out600017ms:
1478258352 nodes,8158168537640 cycles,204649042hits,43019502stores.
These are noncontemporaneous censored windows,not an exact solve-speed ratio.
The larger table increases reuse and per-node cost; completed hard controls follow.

RED tests reproduced four expected failures: missing optional affinity API,
malformed-topology API absent,and inherited CPC array/store accounting errors.
These are cold/accounting repairs; selected measured solver remains unchanged.

Owner stopped original8-run series after5 exact samples; index5 cancelled,6/7notrun. No complete8-run CI claimed. Next authorized test is one matchedAB hard pair:2.5GiB versus10GiB shared,5min ceiling,private unchanged. Budget is80% startup-available RAM less144MiB private and1GiB runtime headroom,rounded down to supported power-of-two capacity. No hot-path allocation/growth. Affinity/private stages deferred.

10GiB attempt failed before solving: Invalid atomic access index,138nodes,cleanup=true. Standalone transfer reproducer shows4GiB/8GiB Uint32Array views arrive in worker as length0 while SAB byte length survives;2GiB works. Checked one-time worker attachment restores only the view header,not backing allocation/copy/growth. Canonical worker and generated mirrors updated together with cold ledger;180/180tests and catalog/generated/audits pass. Rerun both capacities on identical repaired source; preserve failed pair separately.

Independent review: startup repair runtime scope sound; changed wide Number multiplication ledger to symbolic runtime cost because8GiB byte arithmetic is not u32 IMUL. Accounting-only correction does not alter tested6bbba7c source. No concurrent tests during matched timing.
