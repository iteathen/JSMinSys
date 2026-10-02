# Structural cost campaign

Owner asks to investigate ten proposed optimizations, act on valid claims, and
finish with the qualified implementation packaged in `isomax/` on main.
Main package promotion recovered as a9c4ed9db50a837337d38bbfe64b1e7b62d31f7a.
Qualified runtime baseline: 302ebcd91bca13e76cc8d1b0de25631b5e768af4; source/evidence
checkpoint fb0f60adcb9341b42af770f05899bbf61fd3c129. No release/registry publication.

Hard boundaries: exact WDL and legal deterministic selection; gray-owner exact
key identity; CPC/BSFP authority unchanged; variable geometry selected cold;
no runtime solved oracle, no hot reporting, no unsealed formula holdouts.
Each candidate is frozen and correctness-qualified before whole-solve timing.
Performance governs selection; a plausible mechanism alone does not qualify it.

## Profile and first experiment

Node --cpu-prof sampled each of four pinned workers on the existing 4 GiB shared,
576 MiB/private benchmark. Profiling is diagnostic, excluded from scored timing.
Raw profiles, invocation result, affinity and offline analysis are retained.
Nearest named ancestor estimates: cofactor/basis/subset 64.27%, private TT12.03%,
shared TT7.93%, recursion/inlined5.94%, CPC5.85%, canonical2.84%, live/order0.96%.
Inlining and native frames limit attribution; no PMU memory-stall claim.

The strongest bounded experiment is strict-superset CSR compiled from geometry.
625 standard shapes have 2922 strict containment pairs. Uint32 offsets and Uint16
IDs take8348 bytes/worker. Keep image insertion/absorption; enumerate only known
supersets and check exact membership in the current child basis. childIndex is
stale outside the current basis: BOTH index<cn AND matching shape ID are required.
Do not precompute ownership, WDL, search decisions or support-specific outcomes.

Preallocate the plan in the existing worker execution-profile preparation. It is
separate bounded worker scratch, like existing private cache/frame allocations;
it does not change the geometry constructor's dense-table budget. Generic board
kernels remain unchanged. No per-node plan selection, allocation or cache miss.
Original production modules remain read-only. Test sparse geometry tables too.

Then test generated constant specialization where the profile supports it.
Other claims receive explicit valid/stale/unsupported disposition with evidence,
not speculative implementation merely to tick off a list.

## Measurement

Use original Node27 nightly/V8, i5-12600K, four deep workers pinned0/2/4/6,
shared134217728 entries (4GiB), local16777216 entries (576MiB/worker), sampleMask0,
300s ceiling. Empty-board structural prefix plus ONE exact root search and cleanup.
No counters. External cycles/CPU/RSS. Allseven controls, exact result/move and cleanup
must pass. Small initial ABBA screen; only promising candidates get eight-run
ABBA BAAB confirmation against the unchanged baseline. Keep all runs and failures.
Do not claim50% or assign cost shares beyond evidence.
