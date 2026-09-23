# Cycle reduction round-039 — retain apply result for undo

## Structural observation

Every JSMinSys apply transition already returns the exact played physical cell.

Recursive search ordinarily has a natural lifetime for that value:

```text
cell = apply(...)
child = recurse(...)
undo(..., cell)
```

The value can remain a local across the recursive call. Undo therefore does not need to reload `landingCells[index]` merely to derive:

```text
cell = next - columns
```

The known-cell undo profiles instead derive:

```text
next = cell + columns
```

That replaces one subtract with one add, so arithmetic count is unchanged while one memory load disappears.

## Governing-unit rule

This is a real reduction only when the caller retains the cell already returned by the paired apply.

Do not create a move-cell history array or reload `landingCells` solely to call these functions. Such a caller has moved the work rather than deleted it and must use the ordinary undo profile for total-cost accounting.

## Cycle ledger

| profile | before | after |
|---|---:|---:|
| one-lane state-owned ply | 25-27 L1 / 57-59 L2 | 21-23 L1 / 45-47 L2 |
| two-lane state-owned ply | 27-35.5 L1 / 59-75.5 L2 | 23-31.5 L1 / 47-63.5 L2 |
| one-lane caller-owned ply | 19.5-21.5 L1 / 43.5-45.5 L2 | 15.5-17.5 L1 / 31.5-33.5 L2 |
| two-lane caller-owned ply | 21.5-30 L1 / 45.5-62 L2 | 17.5-26 L1 / 33.5-50 L2 |

These are NEES additive static serial ledgers for `node26-v8-14.6/x86_64-amd-zen3`, not wall-clock latency claims.

## Qualification

Differential tests pair ordinary and known-cell apply/undo for:

- runtime-configured one-lane geometry;
- caller-owned-ply one-lane state;
- two-lane low/high boundary crossing at cell 31;
- caller-owned-ply two-lane state.

No fixed board geometry is introduced.
