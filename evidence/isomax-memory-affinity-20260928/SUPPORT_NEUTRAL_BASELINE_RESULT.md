# Support-neutral TT: authoritative fresh localhost baseline

## Live selection and reproduction

Fresh run for Connect4#174,2026-09-29 UTC. Live branch experiment/isomax-memory-affinity-20260928 was8fa454f at recovery. Current selected profile remains isomax-four-pcore-10g-576m-i5-12600k-20260928 in profiles/isomax-i5-12600k-memory-selected.json. New remote support-neutral branches only add hosted workflows; they do not replace the owner-selected localhost profile. Latest issue174 correction agrees. Solver source is the profile's clean6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e; evidence launcher revision06acb88aca32d0cb8782a821156f5f9dbf529298. No addons/tools/catalog/profile changes during this task; existing run-packet.mjs and sample.mjs reused unchanged.

Windows11Pro10.0.26200,Intel Core i5-12600K,10physical/16logical,approximately32GiB RAM. Node v27.0.0-nightly20260928b59840b593,V8 14.6.202.34-node.36. Runtime identity/environment in companion files. Four pinned P-cores,logical0/2/4/6:worker0 wide/root-frontier,workers1-3 deep Lazy SMP. Accepted affinity reports retained. Shared268435456entries(10GiB TT plus counters);private16777216entries/worker(576MiB each),sharedSampleMask0,rootFrontier=true. Aggregate cache payload13153337356bytes(12.25GiB plus12bytes). No support-neutral mask/owner mask/observer/q/CPC/ordering/TT changes. No single-worker/default-profile substitution.

Existing launcher command,using runtime.json nodeExe:

    node evidence/isomax-memory-affinity-20260928/run-packet.mjs evidence/isomax-memory-affinity-20260928/support-neutral-local-baseline-20260929-packet.json

Packet fixes empty7x6,600000ms and references current selected source/config. Manifest includes exact executed child arguments. Raw evidence checkpoint148b1874f643bd359c17d3bb1266ef784c89b337. One fresh process,no retries. Existing completed packet ID must not be reused.

## Outcome

TIMEOUT,errorCode102;rootWdl=null,move=-1. No solve claimed.600070.6333ms wall,including deadline shutdown;2370922ms CPU. All4workers active/exited,cleanup=true,errors=[]. No benchmark process remained after completion. Runtime/source worktree stayed clean.

| Metric | Value |
|---|---:|
| Total visits |1587225050|
| Whole-process solve cycles |8742141954711|
| Visits/s |2645063.701|
| Process cycles/visit |5507.8150|
| Shared TT hits |301836783|
| Shared TT stores |148369034|
| Store contention counter |2514741|
| Peak RSS bytes |12793901056|
| Post-cleanup RSS bytes |10828632064|
| Harness sharedBytes |10739185189|
| Start skew |0.3348ms|
| First search start relative to measured operation |56.1714ms|

| Worker | Role | Visits | Share |
|---|---|---:|---:|
|0|wide/root-frontier|179843292|11.331%|
|1|deep|470317860|29.631%|
|2|deep|468287348|29.504%|
|3|deep|468776550|29.534%|

Deep contributions are balanced. The wide worker clearly participates; its different workload makes equal visits an inappropriate requirement. All completion flags are0 and terminal timing/frontier summaries are0: source rba-connect4-lazy-smp-worker-frontier.mjs writes those after solve returns,whereas node counts reside in shared storage. Host deadline termination therefore preserves visits but not those final summaries. Do not interpret zero frontierPasses as proof the wide path never ran. Roles are established by selected configuration/worker routing,not inferred solely from counts. No unexpected error,allocation rejection,idle worker or orphan is apparent.

Reuse volume is substantial:0.1902shared hits/visit,0.09348stores/visit. These are not hit probabilities: a shared-probe denominator is not provided. Contention/store count ratio1.695% is not a stall-time fraction. Hits and visits do not measure unique proof progress.

Earlier same-profile empty run:1586459254visits,8754302336333cycles. Fresh run differs+0.0483%visits,-0.1389%cycles. Close agreement supports reproducibility,not a statistically qualified speedup. Neither empty run solved.

## Recurring-cost implications

QueryProcessCycleTime measures all process threads,JIT/runtime/startup/cleanup,not isolated hot-loop instructions. Let C=5507.815 observed process cycles/visit and d be the candidate's measured aggregate incremental cycles averaged over EACH visit. Charging d at the observed workload gives:

| Added cycles/visit | Added billion cycles | Fraction of current cycles |
|---:|---:|---:|
|5|7.936|0.091%|
|10|15.872|0.182%|
|25|39.681|0.454%|
|50|79.361|0.908%|
|100|158.723|1.816%|

Sensitivity only,not permission to spend these cycles. If a comparable completed proof saves fraction r of equivalent baseline work and otherwise preserves average economics,break-even requires (1-r)(C+d)<C,or d<C*r/(1-r). A1%equivalent-work saving could tolerate about55.6cycles/remaining visit under that model;0.1%about5.51;5%about289.9. Without measured savings,there is NO evidenced positive maximum budget. Multiple generator emissions must be charged at actual frequency; one OR per emission is not one OR per node. Include extra hash/equality/undo/storage/memory/cache effects,not just mask OR cost.

This censored run cannot establish candidate proof savings. A plausible next screen should preserve profile/source boundary and measure whole-operation cost plus correctness; completed exact controls are needed to resolve economics. More visits/s or extra TT hits alone cannot select a winner because a collapsed state may change work per visit. No candidate implemented here.

## Authority correction

The earlier Actions run36521093784,oldmain93aca175,2all-deep workers,64Kshared/64Kprivate,is STALE-PROFILE DIAGNOSTIC EVIDENCE ONLY. It must not be used as the support-neutral localhost A/B denominator. Later hosted4M/1M scaled runs are also distinct populations. Preserve their historical results; do not rewrite failures. This report and the prior same-profile local record describe the actual selected hardware profile. No PR merged,including#84.
