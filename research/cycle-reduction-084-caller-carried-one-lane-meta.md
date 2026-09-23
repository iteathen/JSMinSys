# Cycle reduction round-084 — fully caller-carried one-lane state

If caller-owned ply is already live and:

cellCount + 3*columns <= 31

then all one-lane playable bits plus full packed support fit in one nonnegative scalar.

Known-cell apply toggles playable inside that scalar, advances packed support with a pre-shifted delta, stores the next landing cell, and returns the child scalar. No mutable state word is touched.

On recursive return the caller still owns the parent scalar, so undo only restores landingCells[index].

Ledger:
- apply: 7.5-9.5 L1;
- undo: STORE_COST only, 0.5-cycle hot-local minimum.

Incremental reflected support from round 083 composes unchanged and costs one additional ADD per child when selected.

The 4x4 qualification vector is only an eligible runtime-configured example; selection is solely the bit-budget inequality.

Falsifier: reject if carrying meta/reflection through the real recursive worker causes spills larger than the deleted state traffic.
