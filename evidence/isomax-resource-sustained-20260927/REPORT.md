# IsoMax joint worker and memory campaign

Host: Intel i5-12600K, 10 physical cores / 16 logical processors, about 32 GiB RAM; Windows, Node v26.7.0. Native Lazy SMP with full exact-cache sharing (mask 0). No strategist, affinity, ordering or solver changes.

Primary metric is elapsed time to an exact solve. QueryProcessCycleTime supplies all-thread process cycles, not an estimated GHz conversion. All-worker visits are read after join; cycles/visit uses all-worker visits. These visits are not distinct positions or Fhourstones reference nodes.

## Completed-solve worker screen

Position `353335714` is a legal child of the P0-losing standard Fhourstones `35333571`, with expected absolute WDL -1. It is **not an official Fhourstones input or score**. Each cell below is the mean of three complete fresh-process solves. All 123 completed trials returned the expected WDL and joined cleanly. A 30-second containment deadline was never reached.

M = 1,048,576 entries. Private capacity is per worker; shared capacity is per process.

| Workers | 1M shared / 1M private (s) | 2M / 2M (s) | 2M / 2M cache MiB | 2M / 2M total cycles (B) | 2M / 2M visits (M) |
|---:|---:|---:|---:|---:|---:|
| 4 | 6.723 | 6.440 | 616 | 96.55 | 23.80 |
| 5 | 6.303 | 6.020 | 738 | 113.15 | 27.12 |
| 6 | 6.237 | 5.881 | 860 | 132.84 | 30.84 |
| 7 | 5.704 | 5.498 | 982 | 145.32 | 32.03 |
| 8 | 5.907 | 5.550 | 1104 | 167.38 | 35.00 |
| 9 | 6.064 | 5.881 | 1226 | 199.26 | 39.53 |
| 10 | 6.349 | 6.000 | 1348 | 225.63 | 43.03 |
| 11 | 6.648 | 6.407 | 1470 | 264.26 | 47.74 |
| 12 | 6.908 | 6.549 | 1592 | 293.69 | 51.33 |

## Independent memory axes and refinement

Every row is three complete solves. Keep phases separate: the repeated 7-worker 2M/1M control exposes session variation. Min/max are observed ranges, not confidence intervals.

| Phase | Workers | Shared M | Private M/worker | Mean s | Min–max s | Total cycles B | Cycles/visit | Cache MiB | Observed RSS MiB |
|---|---:|---:|---:|---:|---|---:|---:|---:|---:|
| axes | 4 | 2 | 1 | 6.444 | 6.382–6.527 | 96.65 | 4043 | 372 | 496 |
| axes | 4 | 1 | 2 | 6.561 | 6.460–6.625 | 98.30 | 4012 | 552 | 676 |
| axes | 4 | 4 | 4 | 6.328 | 6.216–6.507 | 94.87 | 4048 | 1232 | 1354 |
| axes | 6 | 2 | 1 | 5.990 | 5.901–6.050 | 135.14 | 4279 | 494 | 653 |
| axes | 6 | 1 | 2 | 6.262 | 6.165–6.332 | 141.20 | 4320 | 796 | 954 |
| axes | 6 | 4 | 4 | 5.995 | 5.887–6.080 | 135.38 | 4375 | 1720 | 1872 |
| axes | 7 | 2 | 1 | 5.499 | 5.422–5.562 | 145.22 | 4612 | 555 | 732 |
| axes | 7 | 1 | 2 | 5.761 | 5.652–5.916 | 151.88 | 4571 | 918 | 1093 |
| axes | 7 | 4 | 4 | 5.308 | 5.213–5.379 | 140.16 | 4615 | 1964 | 2119 |
| axes | 8 | 2 | 1 | 5.670 | 5.601–5.785 | 171.06 | 4791 | 616 | 810 |
| axes | 8 | 1 | 2 | 5.928 | 5.868–6.039 | 178.53 | 4812 | 1040 | 1232 |
| axes | 8 | 4 | 4 | 5.561 | 5.481–5.605 | 167.77 | 4855 | 2208 | 2361 |
| axes | 12 | 2 | 1 | 6.568 | 6.515–6.611 | 294.56 | 5752 | 860 | 1123 |
| axes | 12 | 1 | 2 | 6.918 | 6.835–6.964 | 309.66 | 5725 | 1528 | 1788 |
| axes | 12 | 4 | 4 | 6.521 | 6.418–6.580 | 292.45 | 5789 | 3184 | 3336 |
| refine | 7 | 2 | 1 | 5.474 | 5.296–5.594 | 144.57 | 4597 | 555 | 732 |
| refine | 7 | 4 | 1 | 5.296 | 5.115–5.496 | 139.99 | 4574 | 683 | 859 |
| refine | 7 | 4 | 2 | 5.294 | 5.213–5.423 | 140.06 | 4615 | 1110 | 1288 |
| refine | 7 | 8 | 1 | 5.237 | 5.207–5.278 | 138.42 | 4550 | 939 | 1115 |
| refine | 7 | 8 | 2 | 5.404 | 5.359–5.492 | 142.83 | 4699 | 1366 | 1542 |
| refine | 7 | 8 | 4 | 5.466 | 5.385–5.525 | 144.46 | 4777 | 2220 | 2371 |
| refine | 7 | 8 | 8 | 5.630 | 5.591–5.672 | 148.54 | 4784 | 3928 | 3763 |
| refine | 8 | 8 | 2 | 5.535 | 5.397–5.634 | 167.27 | 4919 | 1488 | 1681 |

## Five-minute empty-board confirmation

Seven workers and 1M private entries per worker are held fixed. Shared capacities ran in order 4M, 2M, 8M, one trial each. TIMEOUT means incomplete; neither visits/sec nor cycles/visit demonstrates solution progress or a solve-time optimum.

| Shared M | Status | Seconds | Visits M | Visits/s M | Cycles/visit | Total cycles B | Shared hits M | Stores M | Cache MiB | Observed RSS MiB |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 4 | TIMEOUT | 300.03 | 2149.69 | 7.165 | 3579 | 7692.94 | 313.69 | 61.41 | 683 | 888 |
| 2 | TIMEOUT | 300.04 | 2208.32 | 7.360 | 3483 | 7692.74 | 197.15 | 69.22 | 555 | 761 |
| 8 | TIMEOUT | 300.04 | 2178.08 | 7.259 | 3532 | 7693.53 | 413.00 | 47.15 | 939 | 1143 |

The 4M run recorded approximately 314M shared hits versus 197M at 2M, despite fewer visits. This supports materially changed reuse, not a conclusion that lower visitation throughput is a regression. Cache-hit counts do not measure how much remaining proof work was eliminated.

## Interpretation and limits

On the completed position, seven workers with 4M shared / 1M private entries averaged 5.296 s, 21.2% below the four-worker 1M/1M control. Its cache payload is 683 MiB (256 MiB shared plus 7 × 61 MiB private), excluding engine/runtime storage. Doubling only shared capacity to 8M averaged 5.237 s, a 1.1% difference with overlapping observed ranges. Treat 4M/1M as an economical **provisional benchmark profile**, not a universal optimum. No production default is changed.

The initial worker knee is around seven to eight on this host and position. More workers consume more aggregate cycles and perform more total visits without proportionate closure. Workers beyond seven repeat nominal recursive tie rotations; the hybrid CPU also has limited full-speed cores. This campaign does not isolate duplicate ordering from contention, bandwidth, clock changes or OS scheduling, so none is claimed as the sole cause.

Private memory need not scale upward per worker: more workers already multiply its total footprint. The separate axes show a stronger benefit from shared growth. Larger private caches can reduce collisions yet lose through access cost or altered parallel traversal; whole-solve results decide. Allocation size alone is not resident memory. RSS was sampled once per second in the cold host and is an observed maximum, not a guaranteed peak.

The screen uses one completed derived position. The sustained runs use one order and one repeat per capacity; they cannot prove a memory saturation point for empty-board solve time if they time out. Workers 5, 9, 10 and 11 were tested at 1M/1M and 2M/2M only; the adaptive larger-memory follow-up concentrated on the best counts plus four/twelve controls. The full Cartesian optimum across positions, worker counts and memory is not established.

## Reproduction and provenance

- screen: tested `10a73c3a5de2301e60221525aaf24e6b29ed81b7`, 54 trials; [manifest](../isomax-resource-screen-20260927/manifest.json), [samples](../isomax-resource-screen-20260927/samples.jsonl), [raw subprocess output](../isomax-resource-screen-20260927/processes.jsonl).
- axes: tested `cbde3a48af56b615143db4fdcaa30615db7b85d8`, 45 trials; [manifest](../isomax-resource-axes-20260927/manifest.json), [samples](../isomax-resource-axes-20260927/samples.jsonl), [raw subprocess output](../isomax-resource-axes-20260927/processes.jsonl).
- refine: tested `e3da2e9501772ad3852b760d76879780ce6236b0`, 24 trials; [manifest](../isomax-resource-refine-20260927/manifest.json), [samples](../isomax-resource-refine-20260927/samples.jsonl), [raw subprocess output](../isomax-resource-refine-20260927/processes.jsonl).
- sustained: tested `282a1b192e6b600e2325f9752f9941be8861b738`, 3 trials; [manifest](../isomax-resource-sustained-20260927/manifest.json), [samples](../isomax-resource-sustained-20260927/samples.jsonl), [raw subprocess output](../isomax-resource-sustained-20260927/processes.jsonl).

Run `node experiments/worker-scaling/resources.mjs experiments/worker-scaling/resource-{screen,axes,refine,sustained}.json NEW_DIRECTORY` (one plan at a time) from a clean checkpoint. The driver enables experimental FFI and the diagnostic loader. It preserves failures before validation and does not retry. Production addon hashes are identical across all four stages, verified by this analyzer.

Cycle totals include startup, native search, join and host measurement. They are not retired-instruction counts or final NEES assembly-path certification. The existing diagnostic loader redirects the existing node increment to one padded per-worker shared slot; no extra per-node increment is added. Cold worker timestamps and host RSS polling are identical across configurations.
