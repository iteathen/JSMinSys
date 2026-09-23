# Cycle reduction round-038 — caller-known landing cell on apply

## Consumer evidence

The pinned Connect4 workloads repeatedly establish landing/height information before some applies:

- incumbent search at `3c7524321d49c11c3cb6c519425e3bd0ed4bb42b` reads `heights[column]` for legality and tactical winning-move checks before recursive apply;
- IsoMax at `a26ef2254c850243f68505eeff1d849ad0f4f0c0` has proof paths that already carry an exact forced cell and move-order code that computes the current landing cell from height.

The optimization is therefore a profile, not a universal assumption.

## Structural change

Known-cell apply profiles accept the already-observed physical cell and skip:

```text
cell = landingCells[index]
```

They still write:

```text
landingCells[index] = cell + columns
```

so ordinary legality and undo representations remain intact.

No move-column or move-cell history is added. Undo is unchanged.

## Governing-unit rule

The reduction is valid only when the caller already owns the landing cell for an independent reason.

If the caller performs a load solely to call the known-cell primitive, the load has merely moved and the governing-unit reduction is zero. The catalog precondition states this explicitly.

## Cycle reductions

| profile | before L1 | after L1 | before L2 | after L2 |
|---|---:|---:|---:|---:|
| one-lane, state ply | 25-27 | 21-23 | 57-59 | 45-47 |
| two-lane, state ply | 27-35.5 | 23-31.5 | 59-75.5 | 47-63.5 |
| one-lane, caller ply | 19.5-21.5 | 15.5-17.5 | 43.5-45.5 | 31.5-33.5 |
| two-lane, caller ply | 21.5-30 | 17.5-26 | 45.5-62 | 33.5-50 |

The difference is exactly one avoided maintained-landing load at each cache level.

These are NEES additive static serial ledgers, not wall-clock latency claims.

## Qualification

Tests compare each known-cell state transition against its ordinary counterpart, including a low-lane cell whose next landing crosses into the high lane.

The test geometries are examples only; the primitives still receive runtime-configured `columns` and `cellCount`.
