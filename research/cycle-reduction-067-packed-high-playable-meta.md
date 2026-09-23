# Cycle reduction round-067 — pack high playable into transition meta word

For some runtime-configured two-lane boards, the high lane contains only a few physical cells.

Select this profile when:

rankBits + (cellCount - 32) + 3*columns <= 32

The packed field order is support above high-playable above rank. Rank remains in the low bits.

This preserves one-operation extraction for rank, side, and support. Crossing/high transitions update playable-high directly inside the already-loaded meta word.

Compared with packed support+ply, a crossing or high-lane move deletes one LOAD and one STORE and adds one packing SHIFT. Under the current L1 ledger this saves about 3.5 cycles on those paths.

Known-cell worst-case L1 changes from 26 to 22.5 on apply and from 25 to 21.5 on undo.

Initialization selects the representation from the bit-budget inequality. The 6x6 test vector only supplies a compact runtime-configured case that exercises both low-to-high crossing and a true high-lane move.
