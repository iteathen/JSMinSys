# Cycle reduction round-035 — preferred move-slot index space

## Structural observation

The hot transition primitives do not actually require their array index to equal the physical column.

They use the index to load maintained `landingCells[index]`; that value is the physical cell. The configured `columns` argument remains the physical row stride, and the precomputed `supportDelta` already arrives as a scalar.

Therefore preferred move order can become the hot index space itself.

## Initialization

`fillLandingCellsByOrder32` prepares:

```text
landingCells[moveSlot] = physicalColumn
```

Other move-indexed configuration data, especially support deltas and score slots, must be arranged in the same slot order.

This is runtime configuration, not hard-coded 7x6 geometry. The preferred order may be chosen at initialization and is immutable during hot execution.

Initialization cost remains visible:

```text
2 + C*(3 + LOAD + STORE_COST)
```

where `C` is configured column count.

## Hot selection

`argMaxPlayableSlot32` is the pairwise selection scan with the physical-column remap removed.

The existing score sentinel remains:

- unplayable = `-2147483648`;
- every playable score is greater;
- if no candidate is playable, `bestIndex` naturally remains `-1`.

Ledger:

```text
4 + P*(2*L+7) + T*(L+4)
P = floor(N/2)
T = N & 1
```

For N=7:

- before `argMaxPlayable32`: 63 L1 / 127 L2 cycles with a hit;
- after `argMaxPlayableSlot32`: 57 L1 / 113 L2 cycles.

The reduction deletes the final selection control and repeated-recursion `order[bestIndex]` load.

## Physical-column boundary

When an external API/UI needs a physical column, `physicalColumnFromMoveSlot32` performs the deferred map:

- L1: 4 cycles;
- L2: 12 cycles;
- L3: 47 cycles.

This cost is not hidden. The governing-unit win requires hot recursion to consume the move slot directly. If an integration converts every slot back to a physical column immediately before every transition, it has merely moved the lookup and must use the original total-cost comparison.

## Qualification target

Tests cover:

- selected-slot result and no-candidate sentinel;
- initialization-time landing permutation;
- physical-column boundary mapping;
- direct apply/undo using a move slot while retaining runtime-configured physical stride.

Existing physical-column-indexed profiles remain available.
