# Canonical library / initialized geometry qualification

Scope: correct rc.2's private 7x6-only containment realization. The algorithm now lives in RBA geometry/profile/coordinate support libraries and every initialized IsoMax worker family consumes those kernels. The generic Worker base remains responsible for identity and execution. Production CPC and BSFP are unchanged. Connect length remains four; variable width/height is bounded by documented integer domains and available memory, not unlimited allocation.

## Ownership and preparation

Geometry initialization compiles strict nonempty superset masks by two passes over at most14 proper subsets per catalogue shape. No quadratic all-pairs predicate search remains in containment-plan compilation, and workers no longer compile their own masks. The separate optional dense subset table retains its existing initialization cost. Immutable arrays are shared with workers and borrowed by profiles. Word indices select native8/16/32-bit arrays from the prepared word count; offsets/masks remain uint32. These are direct TypedArray loads, with no runtime encoding or decoding. Required containment bytes are reported separately from optional dense-removal/subset specialization budgets.

Worker setup selects dense or prepared kernels once for every standard/general/wide/packed/unpacked family. Dense kernels directly address the prepared removal table. Sparse kernels retain the already-selected exact removal function. Canonicalization also has a prepared-only library entry point, avoiding the optional selected-set output check. The optional public API remains available. Scratch ownership is explicit: seen must stay disjoint from target/inverse while closure is constructed.

Generated prepared kernels derive from the canonical source with exact checked transformation anchors. CI checks regeneration. The obsolete private feature flags are rejected rather than accepted and ignored. Public canonical functions and prepared variants are exported and included in the cycle ledger.

## Hot-path obligations and costs

No node reporting, allocation, table growth, clock reads, geometry/layout dispatch, new shared atomic statistics or new synchronization is added. Existing behavior STOP loads and exact TT synchronization remain. Necessary dimensions are initialized geometry fields; loads, loop bounds, type/bounds guards, register pressure and JIT lowering are not priced as zero. All current absorption/ownership and first-win-before-draw guards remain. Native width is monomorphic for a worker's lifetime; there is no hot constructor selection.

The initial all-uint32 generalized realization cost31.162s versus29.634s for rc.2 in a matchedABBA screen. A blanket scalar-field hoist was tested rather than presumed faster: it moved some loads before early exits, increased printed cofactor code size, and did not recover the regression. It was rejected. Native-width storage is a separate realization tested with unchanged semantics; see final report for its matched results. A slower realization does not falsify general geometry or compiled containment.

The symbolic ledger charges source tests, scalar/table property loads, source/child traversals, mask intersections, bit extraction, inverse lookup and publications. Preparation counts arrays and temporary peak storage. V8 locality, spills, bounds/overflow guards, deoptimization and machine costs remain explicit debt. The machine-code diagnostics exercise the actual recursive caller with small caches, separately from scored large-memory runs. They do not establish that the full worker process never deoptimizes or provide a universal NEES seal.

## Verification and experiment limits

Independent physical line/residual oracles cover7x5,7x6, small/no-line and wide/tall boards; test fixtures cross word index255. Optional scratch, offsets/canaries, stale inverse values, both owners, reflections, exact keys/bases, terminal precedence and prepared canonicalization are compared. Actual workers include7x5 dense and sparse initialization. Cancellation/reuse and unpacked-order controls are retained. Hot-call-graph audits follow the actual imported kernel aliases across all ten profiles rather than auditing the unused public fallback.

Full-capacity measurements use the historical Node27 nightly, i5-12600K and four pinned deep P-core workers0/2/4/6. Each sample computes its structural prefix from an empty board, then runs exactly one unchanged exact root solve.7x6 computes five local moves, first searchply6;7x5 computes four, first searchply5. Baseline and candidate use identical capacities within each geometry. Different geometries have different native TT entry sizes; their times are not treated as equivalent workloads. No solved WDL is a runtime input. Holdouts remain sealed.

Cold geometry preparation is outside the historical primary solve timer; structural calculations, solver/worker initialization, search and cleanup are inside it. External shell/runtime/affinity setup is excluded. Process cycles and peak RSS are external; no hot counters. This is not full-game self-play. Small-cache JIT diagnostics are not timing evidence. The final package records exact runtime and evidence commits separately.
