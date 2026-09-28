# Ten-GiB continuation: placement and private-cache results

2026-09-28, local-host evidence. Shared TT fixed at 268435456 entries (10 GiB + 12 statistics bytes), allocated before search and never grown. This is the owner's testing selection, not a demonstrated global memory optimum. No additional empty-board run was performed.

## Reproduction and scope

Windows 11 Pro 10.0.26200, Intel Core i5-12600K, 6 P + 4 E cores / 16 logical processors, approximately 32 GiB RAM. Node v27.0.0-nightly20260928b59840b593, V8 14.6.202.34-node.36; runtime.json retains binary identity. QueryProcessCycleTime measures the complete selected host/worker operation including startup and cleanup. No recursive instrumentation was added.

Clean fixed source: 6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e. This retains selected be7c2887 solver semantics and adds a cold repair for large typed-array worker transport: restore the key view from its preserved SharedArrayBuffer once, without copying or growing it. Independent review and 180 passing correctness tests/catalog/generated audits preceded these runs; accounting correction a1c6aa7 is runtime-source-neutral.

Fixture 35333571, 300000 ms ceiling, four workers: worker 0 wide/root-frontier, workers 1-3 deep Lazy SMP. Full sharing, no strategist. Every process fresh. All 18 samples below returned EXACT, rootWdl=-1, move=4, four positive worker node counts, four exits, cleanup=true, no errors. These are completed hard-fixture comparisons, not empty-board solves. Normal desktop processes remained present; no exclusive machine/core ownership is claimed.

Run from this branch using the pinned runtime:

    node evidence/isomax-memory-affinity-20260928/run-packet.mjs evidence/isomax-memory-affinity-20260928/<packet>-packet.json

Completed packet IDs are immutable; do not rerun into their existing raw files. Manifests record source/harness revisions, runtime, commands/configuration, environment, topology and timestamps. Raw JSONL preserves complete stdout/stderr; samples JSONL retains cycle, worker, frontier, cache, memory and cleanup metrics.

## Disabled startup loader control

preload-off-v2, ABBA: no preload versus preload enabled with pinning disabled. Both unpinned, 1M private entries. Mean cycles 1,244,456,764,538 versus 1,243,962,372,516.5 (-0.040%). This small two-pair control does not establish a speed improvement. Initial preload-off Windows URL setup failure remains preserved; the complete block was rerun after correcting the cold harness URL.

## Placement: ABBAABBA, eight exact processes

A: unpinned. B: group 0 logical processors 0,2,4,6, validated as four distinct P-cores, one worker per core. Both arms load the same optional preload and use 1M private entries (36 MiB per worker). Accepted OS affinity masks 1,4,16,64 are saved per worker. Affinity is set once before private solver initialization, with no hot-loop check.

| Metric | Unpinned mean | P-core pinned mean | Mean paired delta |
|---|---:|---:|---:|
| Process cycles | 1,240,337,842,085 | 822,663,778,193 | -33.675% |
| Wall seconds | 91.120 | 56.255 | -38.263% |
| CPU seconds | 336.149 | 223.516 | -33.506% |
| Total nodes | 143,379,880 | 147,229,413 | +2.685% |
| Winner nodes | 42,194,881 | 41,808,788 | -0.902% |
| Cycles/node | 8,650.73 | 5,587.66 | -35.408% |
| Shared hits | 33,099,822 | 33,580,350 | +1.453% |
| Shared stores | 19,049,370 | 19,095,477 | +0.242% |
| Store contention | 1,124,800 | 1,296,293 | +15.253% |
| Peak RSS bytes | 10,996,678,656 | 11,005,172,736 | +0.077% |

Descriptive paired 95% t interval over four adjacent pairs: cycles [-35.409%, -31.941%], wall [-39.788%, -36.739%]. Cycle block ratios 0.664018 and 0.662497. Full metric intervals in placement-analysis.json. Placement qualifies on this hardware/profile/fixture. It does not prove L2 residency or identify whether migration, core selection, contention or other scheduling effects dominate; unpinned core residency was not traced.

## Private-cache screens

Both arms pinned to the same four P-cores; shared10GiB fixed. Each candidate has one fresh AB pair against private1M/36MiB. No confidence intervals or universal capacity claims from these screens.

| Candidate per worker | Control seconds | Candidate seconds | Cycles delta | Nodes delta |
|---|---:|---:|---:|---:|
| 16384 entries / 576 KiB | 55.448 | 75.303 | +35.848% | +66.875% |
| 32768 entries / 1.125 MiB | 55.620 | 75.200 | +35.140% | +65.518% |
| 65536 entries / 2.25 MiB | 55.785 | 74.648 | +33.723% | +61.209% |

Each P-core has 1.25 MiB L2 shared by its SMT siblings. A smaller table's nominal fit does not establish actual residency. The smaller private caches reduced cycles per node but expanded search enough to lose whole-solve cost. No candidate warrants the planned confirmation block. Retain 1M private entries; these three screens do not locate the best intermediate/private capacity or prove an empty-board optimum.

## Disposition and durability

Continue testing with owner-selected10GiB shared,1M private entries, and qualified optional four-P-core placement on this host. No automatic production default/merge or cross-hardware policy change. Historical failed/interrupted/censored runs remain intact. No timeout was raised during this continuation. The owner declined a further empty-board run.

Evidence checkpoints: startup1c6aa84, placement0271766, private576KiB8148582, private1.125MiB517c4ec; this commit adds the final private screen and combined report. Canonical Connect4 summary: research/semantic-quotient, research/isograph/optimization/2026-09-27-isomax-second-50-percent/SHARED_TT_L2_RESULT.md.
