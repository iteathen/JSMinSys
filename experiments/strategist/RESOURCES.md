# Memory, worker count and prepared activation screens

Three independent short stages, no Cartesian combination campaign:

- Memory: four active workers, baseline private cache 4,096/shared 16,384 entries;
  double shared only, private only, then both. All workers remain DEEP.
- Pool count: 1/2/4/8 active workers, baseline per-worker/private and shared capacity.
  Aggregate private memory grows with worker count; shared capacity stays fixed.
- Activation: four workers fully prepared before search; fixed 1/2/4 active, or
  start one and activate another on sustained width growth, up to four.

The activation strategist uses two consecutive positive comparable pending-width
deltas from an active worker to admit one standby. It does not treat widths as
globally deduplicated states. Active workers remain DEEP and receive no different
move ordering, TT behavior, pause or migration. It can add workers, not suspend
or recycle already-running searches. Lazy-SMP helpers start at the common root;
this is not frontier partitioning and can duplicate work.

## Activation path

Bit 10 in the existing behavior word means admitted to search. Preparation, private
allocation, warmup and cycle-meter setup finish before the shared start barrier.
Standby workers then use an expected-value atomic wait on their own primary word.
The strategist publishes through the existing JSMinSys behavior publisher and
notifies that word. Changed value prevents a lost wake if activation races entry
to wait. STOP is also published and notified, so an unused standby exits without
entering search (`NOT_STARTED`, zero search nodes).

The activation gate is before the solve call. Recursive execution gains no new
activation load, conditional, promise, allocation or pause machinery. Thread-cycle
accounting begins before the gate, so its costs remain in total evaluator cycles;
OS sleep is not busy polling. The output includes admitted evaluators and individual
search start times. All prepared worker memory is charged, including inactive slots.

## Evidence boundary

Each stage: A/B solvable fixtures plus empty board, three rotated repetitions,
750 ms unchanged deadline, 20 warmups, 5 ms strategist observation cadence.
36 trials per stage; repetitions are not different strategies. Compare total
evaluator cycles, cycles/node, aggregate nodes and first-solution elapsed time.
Strategist cycles are separate. Empty-board timeout only measures bounded throughput
and cache behavior, not solve progress or eventual solving cost. No monotonic/linear
memory-scaling claim follows from a two-level screen.

`cacheMemory` reports typed-array payload bytes of the actual selected cache layout:
shared sequence/value/keys/stats and per-worker private stamp/value/keys. This is
not whole worker memory or peak RSS; prepared RBA state, JIT, stacks, warmup state
and runtime allocations are outside those cache-byte totals.

All candidates remain experimental; no production policy or final NEES qualification.

```
node --test experiments/strategist/pool-activation.test.mjs
node --experimental-ffi experiments/strategist/resource-campaign.mjs NEW_MEMORY.jsonl memory 3
node --experimental-ffi experiments/strategist/resource-campaign.mjs NEW_POOL.jsonl pool 3
node --experimental-ffi experiments/strategist/resource-campaign.mjs NEW_ACTIVATION.jsonl activation 3
```
