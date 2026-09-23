# Deferred functions requiring primitive review

These functions are deliberately excluded from the active implementation pass.

The rule is:

> A missing primitive does not stop independent catalog implementation. Record the blocked function here, complete everything expressible with the admitted vocabulary, then review this queue as a separate primitive-admission phase.

## allocateTypedCapacity

**Block:** capacity growth / rehash  
**Status:** deferred — missing primitive  
**Missing capability:** dynamic typed-storage construction (`new Uint32Array(...)` or equivalent allocation)

Already implemented without allocation:

- `isPowerOfTwo32`
- `nextPowerOfTwo32`
- `rehashOverwrite32` into caller-provided storage

The deferred question is therefore narrow: whether JSMinSys itself needs a storage-allocation primitive, or whether capacity allocation belongs entirely outside JMS-SEALED execution and storage should always be supplied by the owning boundary.

## Rejected as unnecessary: Number.isInteger

`Number.isInteger` is not deferred for primitive admission.

The checked application boundary may validate arbitrary JavaScript input, but JMS-SEALED internal indices enter with an established integer-domain invariant. The requirement disappears at the restricted boundary, so no JSMinSys primitive is required.
