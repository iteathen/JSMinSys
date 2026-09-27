# Memory, worker count and strategist activation screens

Clean tested commit: `0b459dc51c0ce22b390bfd6e711134ff3648dd8a`.
Three independent stages, 36 trials each: four configurations, three fixtures,
three rotated repetitions. These are 12 configurations, not 108 strategies.
72 exact fixture solves and 36 clean empty-board timeouts; no execution failures,
conflicting exact values or forced termination. [209 tests passed](tests.txt).

No candidate is promoted. On these two solved roots, one active worker minimizes
total cycles. Larger pools do not provide a useful consistent latency improvement.
Doubling cache capacities has mixed effects. Width-triggered activation is cheaper
than starting four workers immediately, but substantially dearer than staying at one.

## Scope and accounting

Windows, Intel i5-12600K, Node v26.7.0 / V8 14.6.202.34-node.28. Each trial has fresh
caches, 20 warmups, an unchanged 750 ms solve deadline and 5 ms strategist cadence.
A is `2053635233350500`; B is `1320461024522311`; both returned the previously
qualified absolute value 1. Empty board produced no WDL. Helpers use existing
lazy-SMP root traversal and action-order offsets; no frontier partitioning was added.
Different worker offsets may return different equally valid witnesses, so this
screen checks exact value agreement rather than requiring one identical move.

Total evaluator cycles sum every evaluator thread through its returned result,
including helper drain and standby gate costs. Windows QueryThreadCycleTime is
used at operation boundaries, not per node. Strategist cycles are separately
reported. Cold preparation/warmup and other V8 threads are excluded; this is not a
full-host cycle count. No CPU affinity was imposed. Three repeats on one host are
a causal screen, not broad statistical or hardware qualification.

For solved roots, wall time is first exact completion. For empty-board tables,
wall time includes cooperative STOP and shutdown, so it can exceed 750 ms. The
deadline was not increased. Aggregate nodes include all workers and are not unique
states. Throughput below uses aggregate nodes / operation wall time including drain;
it is not proof progress or a prediction of full solve duration.

Raw evidence: [memory.jsonl](memory.jsonl), [pool.jsonl](pool.jsonl),
[activation.jsonl](activation.jsonl). All medians are independently reduced.

Across the 108 trials: 541,813,012,331 evaluator cycles; 1,174,234,988 strategist
cycles; 139,025,599 aggregate evaluator nodes. All trial costs are retained.

## Memory: four active workers

Private cache is per worker. Shared cache is one common TT. Standard geometry
uses 14 key words. Exact typed-array cache payloads:

| Configuration | Private entries/worker | Shared entries | Total cache bytes, four workers |
|---|---:|---:|---:|
| Baseline | 4,096 | 16,384 | 2,048,012 |
| Shared 2x | 4,096 | 32,768 | 3,096,588 |
| Private 2x | 8,192 | 16,384 | 3,047,436 |
| Both 2x | 8,192 | 32,768 | 4,096,012 |

Baseline private payload is 249,856 bytes/worker; shared payload is 1,048,588 bytes.
These are cache bytes only, not peak RSS or total worker memory. RBA frames, stacks,
JIT/runtime and warmup state are additional. This stage varies cache capacities,
not arbitrary worker heap limits.

Median evaluator cycles (millions) and first-result time (ms):

| Configuration | A cycles | A ms | B cycles | B ms |
|---|---:|---:|---:|---:|
| Baseline | 2,353.034 | 154.51 | 4,098.415 | 272.00 |
| Shared 2x | 2,401.592 | 159.22 | 4,071.474 | 270.18 |
| Private 2x | 2,350.398 | 155.73 | 3,958.184 | 268.80 |
| Both 2x | 2,161.344 | 144.74 | 4,344.079 | 284.57 |

Both 2x saves about 8.1% cycles on A but adds 6.0% on B. Private 2x is essentially
neutral on A and saves about 3.4% on B; it is a possible holdout candidate, not a
general win established by this screen. Shared-only doubling produces no substantial
consistent gain. Two capacity levels cannot establish a linear scaling law.

Empty-board bounded throughput:

| Configuration | Median nodes | Cycles/node | Aggregate Mnodes/s |
|---|---:|---:|---:|
| Baseline | 3,317,717 | 3,441.87 | 4.222 |
| Shared 2x | 3,100,514 | 3,616.48 | 4.022 |
| Private 2x | 3,207,294 | 3,497.86 | 4.165 |
| Both 2x | 3,201,682 | 3,552.67 | 4.099 |

All timed out. Higher capacity might still help a longer solve; this 750 ms screen
does not establish its longer-run hit-rate/replacement economics. It provides no
positive short-run throughput evidence for a broad memory increase.

## Active worker count: baseline caches

Each worker receives the same 4,096-entry private cache; shared capacity stays
16,384. Total private memory therefore grows with worker count.

| Workers | A cycles, M | A first result, ms | A nodes | B cycles, M | B first result, ms | B nodes |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 539.925 | 148.17 | 99,114 | 912.695 | 252.17 | 238,251 |
| 2 | 1,048.311 | 143.04 | 193,066 | 1,893.047 | 253.57 | 500,240 |
| 4 | 2,412.064 | 161.18 | 395,081 | 4,378.989 | 293.70 | 1,033,632 |
| 8 | 6,280.271 | 205.16 | 736,798 | 8,193.732 | 265.68 | 1,369,884 |

Two workers give A a small latency reduction at nearly twice the cycle cost; B
does not improve. Eight workers spend about 11.6x/9.0x the single-worker cycles
on A/B without improving first-result time. Increased node visits with weak latency
improvement are consistent with redundant lazy-SMP work and contention. This screen
does not separately quantify unique-state duplication, cache traffic or scheduler
placement, so those mechanisms are interpretations rather than individually proven
causes.

| Workers | Empty median nodes | Cycles/node | Aggregate Mnodes/s |
|---:|---:|---:|---:|
| 1 | 1,078,201 | 2,611.43 | 1.379 |
| 2 | 2,034,140 | 2,697.73 | 2.703 |
| 4 | 3,219,529 | 3,483.21 | 4.182 |
| 8 | 5,385,916 | 4,083.19 | 7.093 |

More workers increase aggregate visitation throughput, but each visited node costs
more and duplicate visits count. No empty-board solve occurred, so this does not
establish that eight workers get closer to a solution faster.

## Prepared four-worker pool activation

All four workers allocate, warm and prepare before measurement. Fixed 1/2/4 active
are compared with a strategist that starts one and admits another on two consecutive
positive comparable pending-width deltas. No SHALLOW action is combined with this
screen. Running workers receive no pause or reactivation machinery. Unused workers
wait before solve entry and exit on STOP without search nodes.

All configurations retain memory for four prepared workers, including standby
caches. This separates activation economics from pool preparation/memory allocation.

| Activation | A cycles, M | A ms | B cycles, M | B ms |
|---|---:|---:|---:|---:|
| Fixed 1/4 | 515.385 | 140.22 | 906.931 | 251.73 |
| Fixed 2/4 | 1,073.037 | 144.10 | 1,925.751 | 260.49 |
| Fixed 4/4 | 2,384.408 | 155.27 | 4,365.618 | 295.40 |
| Width grow 1→4 | 699.029 | 143.68 | 3,360.386 | 289.60 |

The growth policy activated 3/2/2 workers on A across repetitions and all four on
B and empty board. It saves cycles against starting four immediately, but costs
about 35.6% more than fixed one on A and 270.5% more on B, without latency benefit
against fixed one. The current width signal does not justify these activations
on these solved cases.

| Activation | Empty median nodes | Cycles/node | Aggregate Mnodes/s | Evaluator cycles, M |
|---|---:|---:|---:|---:|
| Fixed 1/4 | 1,051,901 | 2,640.07 | 1.369 | 2,777.091 |
| Fixed 2/4 | 2,040,693 | 2,737.99 | 2.655 | 5,599.027 |
| Fixed 4/4 | 3,160,439 | 3,534.43 | 4.111 | 11,198.415 |
| Width grow 1→4 | 2,326,560 | 3,325.19 | 3.016 | 7,736.249 |

Median strategist cycles for A/B/empty (millions): fixed one 5.800/9.245/20.412;
fixed four 7.329/11.932/25.889; growth 6.443/11.040/23.284. The async strategist is
not free; all its samples, decisions and flag writes remain in the raw evidence.

## Disposition and reproduction

Keep one active worker as the cycle-efficiency control. Do not raise production
memory or worker counts from these measurements. Retain private-cache doubling as
a narrow follow-up candidate on independent solvable roots; defer conclusions
about longer empty-board memory economics. Standby activation is implemented and
tested, but this width-growth admission rule has not earned promotion.

No production solver, TT semantics or BSFP code changed. Catalog (298 sealed
functions + 137 add-on units), runtime geometry, generated one-band source and
patch hygiene checks passed. This is not final NEES qualification.

```
node --test test/*.test.mjs experiments/strategist/*.test.mjs
node --experimental-ffi experiments/strategist/resource-campaign.mjs NEW_MEMORY.jsonl memory 3
node --experimental-ffi experiments/strategist/resource-campaign.mjs NEW_POOL.jsonl pool 3
node --experimental-ffi experiments/strategist/resource-campaign.mjs NEW_ACTIVATION.jsonl activation 3
```
