# Cycle reduction round-096 — caller-owned residual frame restoration

The pinned IsoMax state keeps three per-ply history arrays:

- p0 residual class;
- p1 residual class;
- status.

Every apply writes the child triple to history. Undo decrements ply, reloads the parent triple, then stores those values back into live state.

That explicit history is a second recursion stack.

## Ownership evidence

On ordinary cache misses, native frontier work necessarily consumes both current residual class ids. A selected integration may hoist those two already-required class loads into the recursive caller and preserve the scalars through child descent.

A node that proceeds to legal expansion has also already proved its own status is `ONGOING`. Parent status therefore does not require a history load.

This profile is admitted only when those facts are already owned. Loading p0/p1 solely to avoid history would merely move work.

## Selected profile

The selected apply path performs no per-ply class/status history writes.

After the child returns, `restoreCallerOwnedResidualFrame32` restores:

- parent p0Class;
- parent p1Class;
- the already-proved parent status.

Function-local ledger:

`3 * STORE_COST`

with a 1.5-cycle hot/local throughput minimum under the reference NEES store model.

## Governing-unit deletion

Relative to the explicit-history recurrence, each descent/return pair deletes:

- 3 history stores on apply;
- 3 history loads on undo.

The three required live-state restore stores remain.

At the L1 reference and minimum local-store throughput, the deleted explicit history traffic is at least:

`3*LOAD + 3*STORE_COST = 13.5`

static serial-ledger cycles per expanded child.

The history arrays and their working set can also disappear for a state layout that selects this ownership model globally.

## Important tradeoff

Parent residual classes must survive a recursive call. That may increase register pressure or frame spills. The profile therefore does not claim those scalars are free merely because JavaScript locals express them compactly.

Generated-code / recursive-worker qualification must reject this profile if spill/load traffic equals or exceeds the deleted history accesses.

## Falsifiers

- current-node work does not already load/own both parent residual classes;
- parent status is not proved before descent;
- exceptions/cancellation paths require a restoration source not available from the caller frame;
- parent class liveness causes spill or frame traffic that erases the history reduction;
- another independently required consumer needs the per-ply history arrays;
- the selected runtime cannot inline/preserve the caller-owned state safely.
