# C48: monotone empty-resource bounds

Frozen before implementation or new scalar replay. This is a rules-derived
search experiment, separate from the late algebra/OOO qualification campaign.
Formula holdouts remain sealed. No CPC/NDC/BSFP changes or solved inputs.

## Source argument

Current canonical RBA owner coordinates represent live winning residuals.
In `connect4RbaCofactorKnownHeight`, a surviving owner0 bit requires an active
parent owner0 bit; likewise for owner1. Reflection only permutes coordinates.
Therefore an entirely zero owner channel remains zero under every legal
nonterminal continuation. Immediate wins require a singleton bit in that
owner channel. Guard already-terminal positions before applying this argument.

Thus, for a legal nonterminal position:

- Empty mover channel implies mover value <= DRAW.
- Empty opponent channel implies mover value >= DRAW.
- Both empty imply exact DRAW: neither can ever win and finite capacity ends
  every play at a full-board draw.

The predicate is exactly OR(owner words)==0, fixed for every valid position.
No thresholds, per-carrier exceptions, known moves or witness repairs.

Physical game termination remains first win or full board. A proof of future
draw must NOT write terminal2 into a nonfull physical position or change public
cofactor terminal semantics.

## Small isolated realization

Add an explicit experimental minimal-worker resourceBounds option, false by
default, selecting generated worker variants at initialization. Ordinary
workers remain unchanged. The support libraries own resource extraction and
projection; workers consume their certificate.

Generate companion closure functions from the current authority. Keep public
regular three/span cofactors unchanged. Companion returns low2 physical
terminal bits and flags4(owner0 empty),8(owner1 empty) only for nonterminal
children; target metadata and basis remain byte-equivalent to ordinary
projection. For the cold-selected three-word companion, reuse six local output
accumulators to derive flags without rereading child coordinates. This is a
new shared-overhead use of C39, not retention of C39's neutral standalone form.
Span and no-plan fallback may scan final owner coordinates with a pure helper;
no hot allocation. General dimensions select actual coordinate widths at init.

Pass the certificate as a scalar recursive argument. Capture caller alphaOrig
and betaOrig BEFORE structural tightening. Use the same zero-bound algebra as
the existing cache: upper0 cuts when alpha>=0 and otherwise caps beta at0;
lower0 cuts when beta<=0 and otherwise raises alpha to0. Cuts return a sound
bound0, never an unwarranted exact classification. Preserve TT key/hash/gauge,
seqlock, replacement/sampling and all existing original-window classification.

Both-empty children can return value0 before canonicalization/live update/
recursion without marking the physical board terminal. Root must still obtain
a legal move through the existing worker's center/live ordering, including
both-empty roots; do not return exact with move=-1. Stop/abort contract remains.

## Gates and measurements

Watch missing resource helpers/variants fail; then test the actual generated
search bodies for both owners across every ordered three-valued window. Check
returned exact/bound inequalities against independent toy-tree values and
unchanged default workers. Physical transition tests compare low terminal
bits, words/bases, reflection, poisoned/disjoint frames and flags with direct
channel ORs. Exercise first wins and full-board draws without premature
metadata. Fast physical dimensions1..10 remain covered, with no minimax/scalar
replay on3x6-k4 or5x3-k4. Independent four-worker physical minimax on admitted
training/regression boards follows. Verify Node optimized realization, current
generators/catalog/source ledger and no hot reporting/allocations.

Record a fresh resourceBounds=false full7x6 control on the same new source if
needed to separate module-layout effects. Compare true at the immediately
retained localhost capacities/runtime/JIT/affinity; repeat competitive full
solves. Primary prepared-empty wall determines search performance; init and
whole-operation cycles are secondary. Extra return-mask/flag tests, live locals
and register pressure are real costs, not assumed free. Reject or remove the
entire realization if no qualified primary or independently justified benefit.

Any semantic mismatch falsifies this implementation and requires diagnosis,
not patching individual positions. Do not conflate these elementary resource
bounds with a complete closed scalar formula or an OOO qualification.
