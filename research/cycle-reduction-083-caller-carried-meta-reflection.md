# Cycle reduction round-083 — caller-carried transition meta and incremental reflection

The pinned recursive cache-key path computes gameplayKey before each ordinary cache probe, and gameplayKey reflects support.

With caller-owned ply, 7x6 playable-high (10 bits) plus full support (21 bits) fit in 31 bits. Carry that value as a recursive scalar instead of mutable state.

Known-cell apply returns the child meta scalar. The caller already owns the played cell, so the usual cell return is not needed. Parent meta remains live across descent; undo therefore restores no support or playable-high state.

Carry reflected support as a second scalar. The child value is parentReflected + mirroredSupportDelta, where the mirrored delta is prepared at initialization. Recursive return restores the parent scalar for free.

For 7 columns this replaces a 14-cycle register reflection with one ADD before the unchanged orientation comparison.

Known-cell ledgers:
- apply: 13-21.5 L1 mutable-meta -> 8.5-17 L1 caller-meta, plus one reflected-support ADD;
- undo: 12-20.5 L1 -> 2.5-15 L1;
- high-lane undo performs only landing restoration.

The profile requires highBits + 3*columns <= 31 so the scalar never reaches the sign bit and needs no hot normalization.

Falsifier: reject at integration if the extra live meta/reflection scalars create register spills or call-frame traffic that exceeds the deleted state/reflection work.
