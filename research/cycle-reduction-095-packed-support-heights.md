# Cycle reduction round-095 — derive heights from packed support

The pinned IsoMax state maintains both:

- `supportCode`, with one 3-bit height field per column (plus rank in the pinned layout);
- a separate mutable `heights[]` array containing the same column heights.

Packed support is independently required by ordinary cache identity, reflection, and transition updates. The height array is therefore a candidate duplicate representation, not the authority.

## Selected profiles

`heightFromPacked3Support32(supportCode, fieldShift)`

performs one shift and one mask: **2 cycles**.

`landingCellFromPacked3Support32(...)`

adds the configured-column multiply and physical-column add: **6 cycles**.

The pinned height-array cell path is:

`LOAD(height) + IMUL + ADD = 8`

L1 static serial-ledger cycles.

The larger structural benefit is that a state layout selecting packed support as the sole height authority can delete the per-move height store on apply, the restoring height store on undo, the height-array working set, and its allocation/setup.

## Setup accounting

This round does not hide field selection.

If `fieldShift` must be loaded from configuration, that load remains outside the function ledger. If it is derived hot from the physical column, that arithmetic remains visible. Exact/configured move-slot profiles may carry a constant/prepared shift when the integration already owns it.

With a hot two-operation `3*column` derivation, height extraction reaches L1 load parity rather than claiming a read saving; the deleted height stores still remain a governing-unit reduction.

## Relationship to maintained landing cells

A maintained landing-cell array still provides a 4-cycle L1 load and can be superior when its update stores are already justified by other consumers.

Do not replace it merely to qualify for this profile.

The packed-support profile is for workloads like the pinned IsoMax state that already maintain supportCode and a redundant heights[] mirror, or for layouts where eliminating the mirror lowers total transition/state cost.

## Falsifiers

- packed support is not independently required;
- rows exceed the 3-bit field domain;
- field-shift acquisition costs more than the deleted height traffic;
- another hot consumer independently requires heights[] strongly enough that the mirror cannot be removed;
- maintained landing-cell state has lower total governing-unit cost;
- generated code does not retain the expected shift/mask/IMUL realization.
