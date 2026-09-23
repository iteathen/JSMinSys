# Cycle reduction round-042 — isolated-bit indexing

## Workload evidence

Pinned Connect4 hot loops already use the standard set-bit iteration shape:

```text
lsb = active & -active
index = ...
active = active & (active - 1)
```

This occurs in the IsoMax residual pool and BSFP set-cell iteration. The isolation is therefore already produced for independent iteration semantics.

Calling a general first-set-bit helper after that point would repeat:

```text
word & -word
```

for no benefit.

## Profiles

Low lane:

```js
31 - Math.clz32(bit)
```

High lane global index:

```js
63 - Math.clz32(bit)
```

Both are 2-cycle static ledgers: CLZ + subtract.

The high-lane form folds the ordinary `+32` global offset into the subtract constant.

## Before / after

When the caller already owns an isolated lsb:

- general `firstSetBitIndex32`: 4 cycles;
- `isolatedBitIndex32`: 2 cycles.

The two-lane general helper remains necessary when the caller has not established the active lane or isolated bit.

## Governing-unit falsifier

Do not isolate a bit solely to call these functions and then claim the 2-cycle cost. The reduction applies only when isolation already exists for set iteration, removal, or another unavoidable operation.

## Correctness

Tests cover low/high endpoints, including signed bit-31 patterns and global high-lane index 63.
