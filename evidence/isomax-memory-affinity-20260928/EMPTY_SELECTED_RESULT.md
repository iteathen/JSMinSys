# Owner-selected memory profile: empty-board ten-minute run

2026-09-28 local host. Profile locked in profiles/isomax-i5-12600k-memory-selected.json,commit48d49a2: shared268435456entries=10GiB+12bytes; private16777216entries=576MiB per worker. Four pinned P-core workers(0wide,1-3deep),full sharing,no strategist,no allocation growth. Aggregate cache payload12.25GiB+12bytes. This owner-selected hardware profile is not a proven universal optimum.

Source6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e,clean detached worktree. Windows11Pro10.0.26200,i5-12600K,approximately32GiB RAM; Node27.0.0-nightly20260928b59840b593,V8 14.6.202.34-node.36. Same fixed solver as memory curve. Accepted affinity masks1,4,16,64 saved. Process cycles via QueryProcessCycleTime over complete host/worker operation. No recursive instrumentation changes.

One fresh process,empty moves,timeout600000ms. No baseline rerun. Result TIMEOUT(errorCode102),rootWdl=null,move=-1. No solved-game claim.

| Metric | Value |
|---|---:|
| Wall |600064.1649ms|
| CPU |2374375ms|
| Process cycles |8754302336333|
| Total nodes |1586459254|
| Cycles/node |5518.1388|
| Nodes/second |2643816.023|
| Wide-worker nodes |179914627|
| Deep1 nodes |467024328|
| Deep2 nodes |471410396|
| Deep3 nodes |468109903|
| Shared hits |301722210|
| Shared stores |148311940|
| Store contention |2539546|
| Peak process RSS bytes |12793683968|

All four workers performed work and exited;cleanup=true;errors=[]. Application ceiling unchanged;64ms beyond600s includes termination/cleanup. No benchmark processes remained after completion. No exact solve-speed ratio against earlier censored empty-board windows: capacity,placement and private memory differ. No ply/progress percentage inferred from node count.

Raw stdout/stderr,complete result JSON,manifest and per-worker affinity reports are retained in empty-selected-10g-576m-* files. Reproduction packet:empty-selected-10g-576m-packet.json,run with run-packet.mjs using runtime.json pinned Node. Completed packet IDs are immutable; a future authorized run needs its own ID. Hardware selection remains10GiB shared/576MiB private; historical7worker/stable profile is separately scoped and preserved.
