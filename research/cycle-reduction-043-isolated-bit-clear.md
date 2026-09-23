# Cycle reduction round-043 — reuse isolated bit for clear

## Observation

The pinned hot set iterators already compute:

```text
lsb = active & -active
```

for bit indexing.

They then commonly clear the same bit with:

```text
active & (active - 1)
```

Once `lsb` is known to be a single set bit contained in `active`, this duplicates the relation.

## Reduction

The exact clear is:

```text
active ^ lsb
```

because toggling a bit known to be set clears it and cannot affect any other bit.

Profiles:

- signed bit-pattern result: one XOR = 1 cycle;
- unsigned numeric result: XOR + `>>> 0` = 2 cycles.

Existing general clear-lowest functions remain for callers that do not already have an isolated bit.

## Before / after

- `clearLowestSetBitI32`: 2 -> `clearIsolatedBitI32`: 1 cycle.
- `clearLowestSetBit32`: 3 -> `clearIsolatedBit32`: 2 cycles.

Together with round 042, a caller that already follows an isolate/index/clear iteration path can reuse the same lsb for both downstream operations.

## Falsifier

Do not compute an isolated bit solely to use XOR clearing. If the caller otherwise only needs the cleared word, the general `word & (word - 1)` form remains the correct 2-cycle signed profile.

## Correctness

Tests include ordinary masks and bit-31 signed/unsigned patterns.
