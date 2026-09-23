# Cycle reduction round-080 — one-word caller-ply center-omitted state

Round 079 used caller-owned ply to omit the reflection-fixed center support field on odd-width two-lane boards.

The same invariant fully packs eligible one-lane boards when:

cellCount + 3*(columns - 1) <= 32

Field order is compressed support above playable. Ply is caller-owned and not stored.

This expands one-word eligibility beyond the earlier packed-all profile, which had to budget rank bits plus every support field.

General apply/undo cost 15-17 L1 cycles.
Known-cell apply costs 11-13.
Known-cell undo costs 10-12.

For odd widths, canonical reflection still ignores the omitted center field because it is unchanged by reflection; the compressed support reverses as an ordinary columns-1 packed-3 sequence.
