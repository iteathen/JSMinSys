# J05 larger cumulative-inlining experiment

Frozen before candidate correctness/diagnostic/performance replay.
Parent is the retained post-C48 configuration, recorded after its crossover gate.
Do not implicitly carry unqualified source. Exact four-worker empty7x6 solve,
prepared-empty primary time; initialization/whole-operation cycles secondary.

The1200/4800 trace inlines the selected cofactor but leaves several TT store and
CPC target calls outside negamax when cumulative budget is exhausted. Test one
predeclared larger pair: --max-inlined-bytecode-size=2400 and
--max-inlined-bytecode-size-cumulative=9600. Nothing else changes: same nightly,
shared/private capacities, support plans, policies, publication, affinity and
solver source. No source-size estimates used as performance evidence.

Larger graphs may remove caller/callee and redundant typed-array checks, or
lose through spills, code/I-cache pressure and after-readiness compile cost.
Actual inlining eligibility alone is not sufficient. Independent four-worker
oracle, physical dimensions and current window regressions run under the actual
flags, then partial optimized diagnostic and unprofiled full solve. Repeat
competitive results before retention; flags revert completely if net primary
benefit does not justify them. No hot profiles/counters in timed runs; no
position work moved outside measured empty-board execution. This is one pair,
not an unfrozen adaptive sweep. C44 remains a separately frozen queued probe.

Pre-replay interaction ruling: C48 standalone is UNQUALIFIED after three pairs;
retained configuration remains resourceBounds=false/1200/4800. For this probe,
use temporary C48=true at2400/9600, compare its same-source1200/4800 controls,
and if competitive explicitly ablate C48 at2400/9600. Neither C48 nor J05 is
promoted from bundle timing alone. This changes the parent classification,
not the frozen flag pair, before any J05 correctness/performance replay.
