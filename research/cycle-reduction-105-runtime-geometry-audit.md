# Round 105 — runtime geometry correction and full-library audit

Status: implemented on `research/isomax-rba-primitives-v1`.

## Owner correction

Board width and height are application configuration selected during
initialization. The proving workload's 7x6 geometry is not an application
authority. The earlier round-104 RBA/TT specialization incorrectly promoted
7x6-derived carrier dimensions into an add-on contract before merge.

That specialization was removed and replaced.

## Full source audit

Every current `src/*.mjs` and `addons/*.mjs` source file was reviewed for
fixed board assumptions.

Core source contains no literal 7x6, 42-cell, 69-line, or 625-shape application
constant. Existing fixed-width functions fall into explicit specialization
families:

- one-/two-/three-/six-/eight-word lane operations;
- fixed candidate selectors;
- packed-3 support/reflection profiles whose catalog preconditions state
  `rows <= 7` or their exact configured column count.

Those remain optional profiles. They are not the geometry-general contract.

The audit found missing general counterparts in the newly expanded substrate.
Round 105 adds:

- runtime word-span equality/subset/Boolean/reversal;
- runtime-width skyline insertion and streamed join product;
- runtime-width exact key mix/probe/publication;
- runtime-count interval reduction;
- runtime-width packed-bit permutation;
- runtime-count dependency publication/direct handoff; and
- arbitrary-cell-count playable-bitset apply/undo.

The function catalog now exposes the general path alongside the specializations.

## RBA correction

The fixed `rba-tt8x32` and `rba7x6-*` add-ons were deleted before merge.

The replacement stack is:

- `rba-tt32.mjs`: initialization-selected keyWords, basisCapacity, edgeCapacity;
- `rba-connect4-geometry.mjs`: derives geometry and carrier dimensions from
  configured columns/rows;
- `rba-connect4-coordinate.mjs`: support-local q/cofactor/reflection mechanics;
- `rba-connect4-front.mjs`: dimension-derived four-front arena/algebra; and
- `rba-connect4-solver.mjs`: RBA-native evaluation/publication/reconciliation.

Support is one uint32 height per configured column in the general RBA profile.
This intentionally avoids a three-bit height ceiling. Residual coordinate width
is derived from the configured winning-line count. Dependency capacity equals
configured columns. Exact TT key width is derived from support/meta/coordinate
width rather than frozen at eight words.

## Qualification

Controls include:

- 4x4 derived carrier and independent residual differential;
- 10x10 derived carrier (238 winning lines, eight coordinate words/player,
  27-word q, ten dependency slots);
- reflection equivalence on both sizes;
- depth-1/depth-2 four-front bounds against an independent physical oracle; and
- a 4x4 boundary-depth-zero solve that closes through RBA-native shared-q
  traversal, not physical-state fallback.

`tools/audit-runtime-geometry.mjs` is now a CI gate. It rejects proving-board
constants in core/RBA add-on source and verifies the runtime-sized APIs and
JMS-DATA-007 general-path rule remain present.

## Remaining specialization policy

Specialization is still encouraged when initialization can prove its
preconditions and whole-operation measurement shows a win. It must remain an
alternative selected from the configured profile, never the only path behind a
geometry-general API.


## Cold-selected optimization profiles

The corrected general path does not prohibit board-size optimization. After
geometry is prepared, `prepareConnect4RbaExecutionProfile` selects applicable
specializations once.

Current selections are structural rather than board-name based:

- dense cell-removal lookup when its table fits the configured specialization
  memory budget, otherwise sparse four-cell shape removal;
- dense residual subset lookup when its table fits the remaining budget,
  otherwise sparse set comparison;
- three-word coordinate permutation when the configured coordinate width is
  exactly three words, otherwise the runtime-span permutation; and
- six-word skyline/product when a front generator is exactly six words,
  otherwise the runtime-span implementation.

The prepared front arena/evaluator holds those selected operations. Hot calls do
not branch on columns or rows to choose them.

Qualification compares a specialization-enabled configured board with the same
board prepared using `specializationBudgetBytes: 0`, requiring identical q,
basis and four-front query results. Wider 10x10 controls remain on the span
coordinate/front path.

This is the intended rule for future specializations: initialization may branch
aggressively on proven configured invariants; the chosen hot implementation must
remain exact and the general path must remain available.
