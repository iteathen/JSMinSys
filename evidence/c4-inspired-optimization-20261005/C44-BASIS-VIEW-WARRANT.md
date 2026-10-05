# C44 immutable support-basis views — frozen probe design

Status: authorized bounded optimization experiment, not retained runtime.
Primary: prepared empty7x6 -> exact result; initialization secondary.
Parent: retained C26 support/closure/reflection kernel with C27/J04/C40 settings;
C48 must be assessed first. Do not implicitly carry an unqualified C48 branch.
If C48 is retained, freeze that explicit parent in RESULTS before implementation.

## Cost and alternatives

Complete plans already own every support basis in immutable shared storage.
Current child loader reads that row, writes a private frame, and builds inverse;
reflection then copies a second row if selected. A support-view worker can use
that same row and an integer offset throughout recursion. This removes the
private basis stores/copies and per-worker frame allocation, not the necessary
inverse build. It may lose locality when later reads use a random plan row
instead of the L1-private copy. No assumed speed gain.

Full precompiled inverse/transition tables add substantial random-table memory
and were unqualified in C30/C30B; they are not part of this probe. A per-node
slice/object also violates the hot allocation goal. The selected implementation
is complete-plan-only row handles, with an ordinary cold fallback.

## Contract

Select the private companion worker only at application initialization when
both complete closure and reflection maps are available. Otherwise preserve the
ordinary selected worker, report basisViews=false and do not partially apply it.
The requested option is Boolean, minimal-worker only. Generic dimensions can
select the companion whenever their own complete plan is admitted; no literal
7x6, state exceptions or lookup values.

Companion loader computes the existing child support handle, iterates the same
basis IDs and writes the exact image inverse. It does not write a child basis.
Companion closure projection is generated from current authority, changing only
that loader; parent basis and slot order are identical.

Companion canonicalizer preserves support and owner comparisons, coordinate
permutation, meta publication and reflection return bit. It removes basis copy
and transports scratch.map[0] to mirrorProfiles[handle] when reflected. Recursive
child bi=transportedHandle*maxBasis points into immutable plan.basis. Parent bi
is a scalar local, so nested scratch reuse cannot corrupt it. Live orientation
and action transport still consume the original reflection return bit.

Root computes its handle from actual canonical heights after ready/root handoff
and validates size and IDs against ingress at cold one-shot entry before using
the view. This position-dependent work remains within primary timing. Root q
coordinates must use exactly that row's slots. Root full-board/first-win metadata
and cancellation behavior remain ordinary. No writes through plan.basis, no
per-node objects/slices, no allocation, no clocks, no added hot selector.

## Qualification

Watch missing companions fail before implementation. Differential physical
cofactor/canonicalization tests cover dense/span/normal/nonwinning, offsets,
poison, first wins/full draw, reflected/asymmetric/symmetric supports and
multiple native ID widths. Wrap immutable row storage to reject writes where
practical. All100dimensions physical checks remain; sealed3x6-k4/5x3-k4 get no
scalar outcomes. Root-entry and recursion row transport tests must include
nonempty roots and repeated sibling/nested scratch reuse. Four-worker independent
physical minimax and legal optimal root move checks precede performance.

Check generators and NEES source ledger, then inspect actual optimized Node
realization under retained1200/4800 flags. Compare unprofiled complete7x6 solve
with immediate retained parent at exact capacities/runtime/topology; repeat
competitive results and remove the entire runtime realization if its primary
benefit or independent memory/simplicity value does not justify its surface.
No TT/search-window/CPC/NDC/move-order/terminal/gray hash changes. Any root/row
transport mismatch falsifies the implementation rather than a patched witness.
