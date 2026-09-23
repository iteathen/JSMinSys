# Cycle reduction round 001

Status: implementation complete; qualification pending at commit time.

## Objective

Reduce function-level static cycle ledgers without weakening semantics or NEES governing-unit requirements.

## Changes

- `reflectPacked3x32`: Connect4 path 117 -> 26 function-local cycles; 22 if constant guards fold after inlining.
- `firstSetBitIndex32`: 2-6 -> fixed 4 cycles by using the defined `Math.clz32(0) === 32` behavior; empty sentinel standardized to -1.
- `popcount32`: 15 -> 14 cycles.
- `popcount2x32`: 31 -> 29 cycles.
- `mix32`: 14 -> 13 cycles.
- `nextPowerOfTwo32`: value-dependent `3 + 3*K` -> fixed 5 cycles.

## Correctness repair discovered during optimization

The original `maskContains32` and `maskContains2x32` compared signed bitwise results directly with unsigned required masks. That fails when bit 31 is present.

The corrected forms cost one or two additional static cycles but restore uint32 semantics. This is not counted as an optimization regression because the previous cheaper ledger described an invalid implementation.

## Governing-unit notes

- Reflection keeps the generic fallback; only the 7-column / rankShift-21 path is specialized.
- The `nextPowerOfTwo32` replacement is substantially cheaper for capacities requiring one or more growth shifts. The old loop was cheaper only at the degenerate value 1; capacity consumers normally operate above that point.
- No change in this round introduces allocation, synchronization, or new admitted primitives.
