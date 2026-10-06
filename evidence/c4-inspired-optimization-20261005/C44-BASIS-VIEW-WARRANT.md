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

## Current-parent transport addendum (2026-10-05, before C44 replay)

Execute against retainedc035266: C58/C54withC61private8388608nativeentries=256MiB,shared4GiB/fourdeep/CPU0,2,4,6/nightlyJ052400/9600. Oldparent/C48and1200/4800text is historical, not current authority. C48was costedout; do not restore it.

Viewcanonicalizer MUST publish canonical supporthandle into scratch.map[0]. Current C54frontier.child expects rawhandle+reflectionbit, so companion calls child(canonicalHandle,0,depth+1) to avoid double reflection; live orientation still uses actualreflectionbit. Pass childBi=canonicalHandle*maxBasis as scalar recursion argument. Root ingress validation runs afterready; terminalrootneednot match unused supportbasis, nonterminalroot must exactly match size/IDorder. Full WDL/window/TT/first-terminal behavior unchanged.

Complete-view scratch onlyneeds inverse(shapeCount), map(onehandle), mirror(keyWords). Exclude unused legacyseen/mirrorBasis/size arrays in companion initialization; old ABI parameters remain allowedignoredinputs, no hot tests added. This is deadstorage eliminated by full-viewprecondition, not a new tactical/quotient family. All three arrays/prepared metadata allocated before ready. Viewcofactor retains the required inverse rebuild; no full inverse tables. Default/fallbackordinaryworkers untouched, requested/selectedbasisViews reported explicitly. Admission onlycompleteclosures+mirror map, minimalworkerBooleanoption, unsupported geometry/budgetfallsback atinit.

Generate companions from exact existingclosure/reflection/8worker authorities, no hand7x6fork. Dense/prepared/span/three and normal/nonwinning routines qualify against independent physical q on100dimensions whereplansadmitted; ordinaryfallbackchecks coverrest, no WDLholdouts. Proxy-write traps plus nested/sibling frame transport and nonempty/reflectedrootvalidate shape identity. Actual4workers/native/sharedbound variants and exactoracle beforeoptimized JIT/fulltimings. Selectedbasisview pointer/row replaces perchildbasis copies; addedsharedreadlocality risk remains empirical. Init/geometrybudgets and allotherconfig unchanged. Restoreallnew activehelpers/companionworkers/hostoption/launcher/ledger cleanly ifnotretained; keep fullprototype/evidence.
