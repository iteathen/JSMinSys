# Cycle reduction rounds 002–003

## Round 002 — state transition write fusion

`applyMove32` and `undoMove32` previously wrote `playableLo` and `playableHi` before and after the above-cell update.

The optimized form keeps those two values in locals and performs one final store per lane.

Above-cell path:

- `applyMove32`: 94.5 -> 85.5 L1 serial cycles; 206.5 -> 181.5 L2.
- `undoMove32`: 100 -> 91 L1 serial cycles; 220 -> 195 L2.

No-above paths are unchanged.

## Round 003 — boundary and classification structure

### landingCell32

The checked/full-column branch was redundant with the already-separated `playableColumn32` predicate.

The function is now a trusted landing-cell primitive:

```text
LOAD height + IMUL + ADD
```

Cost:

- L1: 8 cycles
- L2: 16 cycles

The caller owns the playable-column precondition.

### cardinalityClass2x32

The classifier now branches on lane emptiness first and only runs the single-word multiple-bit test on the one live lane.

Static predicted-path range:

- before: 3–13 cycles
- after: 4–8 cycles

The zero path becomes one cycle more expensive while the worst/common nonzero paths become materially shorter. This tradeoff should be revisited if workload evidence shows zero overwhelmingly dominates.
