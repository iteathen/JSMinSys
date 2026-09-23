# Cycle reduction round-081 — specialize the omitted center slot

In the odd-width center-omitted layout, the omitted physical center column has compressedSupportDelta = 0.

The general compressed transition still loaded/stored meta and executed add/subtract by zero.

For a center move whose played and above cells both remain in the low lane, meta contains neither affected playable bits nor stored center support. It is unchanged and need not be touched.

A center-slot-specific profile therefore:

- deletes one meta LOAD and STORE on low/same moves;
- deletes the known-zero support ADD/SUB on every center move;
- still touches meta when a move crosses into or already occupies the high lane.

Known-cell low/same apply changes from 2*LOAD + 3*STORE + 8..12 ALU to LOAD + 2*STORE + 7..11 ALU, a 5.5-cycle L1 reduction.

The profile is valid only when the caller already knows the transition is the omitted center slot from independent move-slot structure; introducing a new hot test solely to select it must be charged separately.
