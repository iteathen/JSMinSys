# Cycle reduction round 007 — runtime-configured geometry correction

## Configuration model

The application selects board geometry during initialization. Width and height are then invariant for the lifetime of that configured engine, but mechanical hot-path functions must work across supported configurations.

The earlier 7x6-only specialization crossed that boundary and is superseded.

## Preserved optimizations

The following reductions are geometry-independent and remain:

- update only the active 32-bit mask lane;
- derive cell masks from the cell index rather than loading mask tables;
- fuse playable-state updates before the final store;
- caller supplies the exact undo column, removing write/read move-history traffic from the primitive;
- derive side-to-move from `ply & 1`;
- precompute the support-code delta for each column during initialization.

## Dynamic transition contract

`applyMove32` / `undoMove32` consume:

- configured `columns`;
- configured `lastRow = rows - 1`;
- a per-column `supportDelta` prepared during initialization.

The current two-lane mask primitive supports configured boards with at most 64 cells. Larger boards require a wider lane composition rather than hard-coding another geometry.

## Reflection

`reflectPacked3x32` again accepts runtime-configured column count and rank shift. It remains representation-specific: it applies when the configured support encoding uses 3 bits per column and fits in one uint32.

Per-column multiplication was removed by carrying source and target shifts incrementally.

Cycle ledger:

```text
8 + 10*C
```

where C is the configured column count.
