# Cycle reduction round-093 — exact ten-slot separable hash

Round 092 changed residual class hashes to a separable ordered fingerprint so parent-derived children can update only changed tuple coordinates.

The pinned IsoMax residual representation has an independent invariant:

`FRONTIER_SLOTS = 10`

That count is fixed by the selected residual representation, not by a hot-loop decision.

The generic `xorTupleHash32(ids, count)` therefore carries unnecessary loop control and multiplier progression when used for the pinned full-rebuild path.

`xorTupleHash10x32` writes the same ten slot multipliers directly and is algebraically identical to `xorTupleHash32(ids, 10)`.

## Ledger

Generic ten-slot builder under the current L1 model:

`3 + 10 * (LOAD + 9) = 133` cycles.

Exact ten-slot builder:

- 10 loads = 40;
- 10 adds = 10;
- 10 IMULs = 30;
- 9 XORs = 9;
- final uint32 normalization = 1.

Total: **90 L1 static serial-ledger cycles**.

The existing `mix32 + powerOfTwoIndex32` address finalization remains 6 cycles and is unchanged.

This is a 43-cycle full-build reduction with no changed collision partition, fingerprint semantics, setup cost, or caller work.

## Selection

Use the exact profile only when the residual tuple length is proved to be ten at initialization. The generic builder remains authoritative for other configured tuple lengths, while `updateXorTupleHash32` remains preferred for sparse parent-derived deltas.

## Falsifiers

- tuple length is not exactly ten;
- a runtime-selected representation can change tuple length after initialization;
- emitted code does not retain the straight-line form;
- code-size/front-end effects at the governing unit outweigh the deleted loop work.
