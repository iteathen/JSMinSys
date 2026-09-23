# Cycle reduction round-092 — delta-updatable residual class hash

The pinned IsoMax residual-class dictionary stores a 32-bit class hash only as a locator/fingerprint. Full ordered slot-tuple equality remains authoritative.

The current `hashChunkTuple` rescans all 10 chunk ids for every new class. For each coordinate it loads the id, adds one, strong-mixes the coordinate, folds it through another multiply, and finally strong-mixes the aggregate again.

That is unnecessary when the transition already knows the exact tuple delta.

## Selected representation

Use a separable raw fingerprint:

`H(tuple) = XOR_i imul(id_i + 1, M_i)`

with deterministic odd slot multipliers. The raw fingerprint is stored in the existing class-hash word. Bucket addressing applies the existing 5-cycle `mix32` finalizer and the ordinary power-of-two mask, so low-bit structure in the separable accumulator is not exposed directly to table indexing.

`xorTupleHash32` builds the representation for parentless construction.

`updateXorTupleHash32` uses:

`H(child) = H(parent) XOR contribution(old_i) XOR contribution(new_i)`

for each changed slot.

No class identity is weakened. Hash equality remains only a cheap filter before full slot-tuple equality.

## Governing-unit effect

Using the current JSMinSys strong-mix ledger and L1 loads, the pinned 10-slot full-hash shape is roughly 250+ static serial-ledger cycles before/through final addressing.

The new full separable builder is 133 L1 ledger cycles for 10 slots. Existing `mix32 + powerOfTwoIndex32` adds 6 cycles for bucket addressing.

More importantly, a parent-derived child no longer needs a full tuple scan. Its hash work is:

- one parent-fingerprint load;
- 15 cycles per changed slot;
- 6 cycles for final address mixing/masking.

For one changed slot that is about 25 L1 ledger cycles instead of a 10-slot rescan.

The transition already owns parent id, old chunk id, new chunk id, and changed slot. No reconstruction is introduced.

## Tradeoff / selection

A full rebuild remains available for parentless construction and for cases where many coordinates change. Under the current L1 ledger, the incremental path is most attractive for sparse tuple deltas; integrations should select based on the observed changed-slot distribution rather than assuming every child is sparse.

## Qualification control

A deterministic structured smoke distribution over 4096 ten-coordinate tuples, after the existing `mix32` address finalizer, occupies all 256 low-byte buckets with maximum bucket load below 40. This is only a falsification control, not governing-unit proof.

## Falsifiers

- exact tuple equality is not retained;
- the transition does not already own parent hash and exact old/new coordinate values;
- actual changed-slot distributions make repeated incremental updates more expensive than the full builder;
- the raw fingerprint develops an unacceptable 32-bit collision rate as a prefilter;
- final mixed bucket distribution or linear-probe locality regresses enough to erase the deleted hash work;
- current generated code invalidates the assumed IMUL/XOR lowering.
