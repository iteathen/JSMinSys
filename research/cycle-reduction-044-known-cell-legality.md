# Cycle reduction round-044 — reuse landing cell for legality

## Structural observation

Known-cell apply profiles already rely on a caller that has the current landing cell for an independent reason.

A legality check should not then call:

```text
playableColumn32(landingCells, index, cellCount)
```

because that reloads the same maintained value.

The legality fact is simply:

```text
cell < cellCount
```

once `cell` is already owned.

## Function ledger

- `playableColumn32`: one load + compare = 5 L1 / 13 L2 under the current hot scenarios.
- `playableKnownCell32`: compare only = 1-2 cycles.

## Governing-unit composition

For a checked one-lane state-owned apply where no other producer supplies the cell:

Old shape:

```text
playableColumn32  -> load + compare
applyMove1x32     -> reload landing cell
```

Reuse shape:

```text
cell = landingCell32(...)
playableKnownCell32(cell, ...)
applyMove1x32KnownCell(..., cell, ...)
```

The landing state is loaded once and reused.

If tactical/scoring/proof work already owns `cell`, even that first `landingCell32` load may already belong to the other governing work.

## Falsifier

Do not move the landing load into the caller solely to call `playableKnownCell32` and claim the predicate itself as a total-cost win. The reduction is real when the same observed cell feeds another unavoidable consumer such as known-cell apply.

## Geometry

Only `cellCount` is configuration-derived. No fixed board width or height is introduced.
