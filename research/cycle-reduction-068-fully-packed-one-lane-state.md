# Cycle reduction round-068 — fully pack one-lane transition state

For sufficiently small runtime-configured boards, rank, playable, and support all fit one uint32.

Selection condition:

rankBits + cellCount + 3*columns <= 32

Field order is support above playable above rank.

Rank and side remain low-field AND operations. Support remains one unsigned shift. Playable extraction for external consumers is shift+mask, while transition updates toggle playable bits directly in the packed word.

Compared with the packed support+ply one-lane profile, each transition deletes one state LOAD and one state STORE and adds one bit-position shift.

General apply/undo improve from 19.5-21.5 L1 to 16-18 L1.
Known-cell apply improves from 15.5-17.5 to 12-14 L1.
Known-cell undo improves from 14.5-16.5 to 11-13 L1.

The qualification vector uses runtime-configured 3x4 solely because its bit budget fits; the generic selection is the bit-budget inequality.
