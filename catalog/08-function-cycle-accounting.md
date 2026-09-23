# Function cycle accounting — v0

JSMinSys requires every admissible emitted operation to have a cycle model. The authoritative machine-readable map is `catalog/cycle-model-v0.json`.

## Hard invariant

> No operation may be admitted to the emission vocabulary unless it has a cycle-cost mapping.

A mapping may be:

- **fixed** — one cycle value;
- **range** — bounded minimum/maximum cycles;
- **expression** — symbolic cost resolved from cache level, branch behavior, operand type, iteration count, or another explicitly named parameter;
- **unbounded** — blocking behavior for which no finite elapsed-cycle upper bound exists.

The current catalog has complete coverage: **62 admissible emissions / 62 cycle models / 0 missing**.

## Static function total

For an executed path `P` under scenario `S`:

```text
C_serial(P, S) = Σ C(operation_i, S)
```

Rules:

1. Count each operation that actually executes.
2. For a loop, multiply the body cost by the executed iteration count.
3. For a conditional, count the selected path only.
4. For short-circuit operators, count the RHS only when evaluated.
5. For a call, include the callee's function cost plus call/return overhead once qualified.
6. Resolve memory operations against an explicit cache scenario.
7. Add branch-misprediction penalties only when the modeled scenario contains a miss.
8. Keep unresolved values symbolic rather than replacing them with zero.
9. If an executed path contains an unbounded blocking operation such as `Atomics.wait`, report active CPU cycles separately from blocked elapsed time.

## Reference Zen 3 cache scenarios

For simple dependent reads:

- L1 data hit: **4 cycles**
- L2 hit: **12 cycles**
- L3 hit: approximately **47 cycles** on the first reference Zen 3 profile

Branch misprediction reference:

- approximately **15–16 cycles** with µop-cache hit
- around **19 cycles** with µop-cache miss

These values are profile parameters, not universal constants.

## Required function reports

Until assembly-level dependency scoring is available, a function should report at least:

```text
hot_L1_serial_cycles
hot_L2_serial_cycles
cycle_range
unresolved_symbolic_terms
blocking_terms
operation_counts
```

Example:

```text
f:
  3 × ADD32     = 3
  2 × AND32     = 2
  1 × LD32      = 4 (L1) / 12 (L2)
  1 × TESTZ     = 1
  1 × BRANCH    = 1 if predicted

hot_L1_serial = 11 cycles
hot_L2_serial = 19 cycles
```

This is deliberately additive and easy to audit.

## Important limitation

Modern out-of-order CPUs overlap independent operations. Therefore the additive serial total is a **cost-accounting metric**, not automatically the measured wall-clock latency of the function.

The later qualification pipeline should also calculate:

- critical dependency path;
- reciprocal-throughput floor;
- µop/port pressure;
- memory-level effects;
- actual emitted V8 assembly.

The additive total remains valuable because it gives every representation and function a common, deterministic cost ledger before those refinements.
