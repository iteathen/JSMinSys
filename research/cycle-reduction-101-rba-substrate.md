# Round 101 — IsoMax/RBA substrate expansion

Status: implemented on `research/isomax-rba-primitives-v1`; performance qualification remains application-governing-unit work.

This round intentionally adds the reusable low-level shapes exposed by the native
RBA integration while keeping Connect4 semantics out of JSMinSys.

## Added as necessary substrate

- fixed three-/six-word set relations and eight-word exact equality;
- six-word subset-minimal skyline insertion;
- streamed six-word join product with immediate absorption;
- exact eight-word locator/probe/publication;
- durable monotone interval intersection.

## Added as extremely useful substrate

- fixed-degree up-to-seven min/max interval reduction;
- prepared action-major sparse ID transform with dedup/sorted emission;
- three-word packed-bit permutation;
- generation-stamped intrusive list primitives with coalescing and O(1) removal.

## Added as handy substrate

- eight-word locator specialization;
- scalar immutable-span publication;
- seven-slot mask helpers;
- sorted set-bit emission used by small sparse bases.

The previously implemented `atomicTryClaimLoadFirst32` already satisfies the
load-first atomic-claim candidate; no duplicate function was added.

## Deliberately not added

No conventional minimax/alpha-beta expansion, board apply/undo path for native
RBA execution, replay-to-RBA conversion, Connect4 625-shape semantics, four-front
game semantics, another seven-column reflection implementation, BigInt, or
generic arbitrary-width container framework was introduced.

## Cost/evidence status

All 30 new functions use the already admitted operation vocabulary and carry
symbolic NEES serial-ledger expressions in `catalog/functions-v0.json`.
No new source emission or independent machine-cost authority was introduced.
The focused behavioral suite exercises lane boundaries/bit 31, skyline
absorption/capacity, exact wide identity, interval conflicts, sparse transform
and remapping, seven-slot masks, and generation-stamped intrusive lifetime.

These library additions are implementation candidates. They do not by themselves
establish an IsoMax solve-speed improvement; whole-operation qualification must
compare their use against the current application code before promotion.
