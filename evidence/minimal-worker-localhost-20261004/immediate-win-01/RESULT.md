# Immediate-win precheck: isolated localhost full solve

Solver commit: `cb4c896d0f13f4e2248bbed9a698a719aac7d8a3`.

Only production change from share-exact-01: the RBA coordinate support library finds a playable mover singleton before child descent. The worker returns that exact win and uses its column as the root move. The previous maximum-value cutoff and exact-sharing change remain enabled. No CPC/NDC, forced-block handling, heuristic scoring, TT, memory, runtime or worker-topology changes. Twenty-eight targeted tests and catalog verification passed before measurement.

## Configuration and timing

Same recovered localhost invocation as the previous run, with only source identity and output/temp destinations changed. Empty standard 7x6 root, no RLC, four deep/minimal workers, no root frontier, sharedSampleMask=0. Shared capacity 134217728 entries (5 GiB payload); local capacity 16777216 entries per worker (528 MiB each). Node v27.0.0-nightly20260928b59840b593 / V8 14.6.202.34-node.36, Intel i5-12600K. Exact runtime executable SHA256 verified against prior invocation. Process affinity 85 and worker logical CPUs 0,2,4,6 verified before solver initialization.

Internal timing includes the host call, TT allocation, worker initialization, full empty-board solve and worker cleanup. Cold geometry/cycle-counter setup is outside the internal interval and inside the external interval. The generic OS wrapper description mentions RLC; this invocation performs none.

## Completed result

- Status EXACT; first-player WDL +1, selected zero-based move 3 (human column 4).
- Internal wall: 596690.8619 ms (9 minutes 56.691 seconds).
- External process wall: 597148.9623 ms.
- Process cycles: 8514663685787.
- Process CPU: 2308484.375 ms.
- Peak RSS: 7697059840 bytes.
- Shared cache hits: 278354602.
- Shared successful stores: 676319381.
- Shared store-contention events: 14022197.
- Cleanup true; all four workers exited; post-run process check found no remaining benchmark.
- Error code 0. Neither the internal 600000 ms nor outer 650000 ms deadline fired.
- Child exit status 3 is the existing launcher's over-10000-ms performance-target code; it is not a solver failure or timeout.

This is one completed measurement. It does not meet either the 10000 ms governing objective or a 60000 ms threshold. The immediately preceding configuration timed out at 600092.7367 ms, so its full solve time is unknown. Do not report a percentage solve-time improvement or treat this one near-deadline completion as a noise-qualified performance promotion. The absence of a completed baseline prevents an exact before/after speed ratio. The historical approximately 35-second packaged solve used runtime-computed RLC advancement and a different solver kernel.

Raw output, executable/source identity, launch environment, affinity reports and OS measurements are retained. Node counts and winner-worker identity are not exposed by the unchanged minimal benchmark launcher; cache counts are not node counts. No timing instrumentation was added to the hot loop.
