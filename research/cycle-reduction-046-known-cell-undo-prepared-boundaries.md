# Cycle reduction round-046 — prepared boundaries for known-cell undo

## Observation

After round 039, known-cell undo already receives the exact played cell and restores:

```text
landingCells[index] = cell
```

It nevertheless reconstructed:

```text
next = cell + columns
```

only to answer:

1. whether an above cell exists;
2. whether that above cell remains in the low lane;
3. which bit represents the above cell.

None requires reconstructing `next`.

## Initialization invariants

Prepare once per configured engine:

```text
lastRowStart = cellCount - columns
lowLaneAboveLimit = 32 - columns
```

Then:

```text
hasAbove = cell < lastRowStart
aboveStaysLow = cell < lowLaneAboveLimit
aboveBit = bit << columns
```

JavaScript's 32-bit shift semantics naturally provide the correct lane-local bit when the physical above cell crosses the 32-bit boundary.

Setup cost is two one-cycle subtractions during initialization for the two-lane profile; one-lane needs only `lastRowStart`.

## Cycle reduction

Every known-cell undo path deletes one hot ADD:

- one-lane state-owned: 21-23 -> 20-22 L1;
- one-lane caller-owned ply: 15.5-17.5 -> 14.5-16.5 L1;
- two-lane state-owned: 23-31.5 -> 22-30.5 L1;
- two-lane caller-owned ply: 17.5-26 -> 16.5-25 L1.

L2 ranges fall by the same one ALU cycle.

## Governing-unit rule

The thresholds are configuration invariants. They are prepared once, not recomputed before each undo. If an integration recomputes them in the hot caller, those costs remain part of the governing unit.

## Correctness

Differential tests continue to cover one-lane and cross-lane undo. An explicit top-row vector verifies the no-above path with `lastRowStart`.
