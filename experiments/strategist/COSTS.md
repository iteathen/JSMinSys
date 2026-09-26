# Experimental hot-path accounting

This campaign is an opt-in JSMinSys experiment, not a new sealed profile or a
full NEES qualification. No baseline add-on is changed. Generated solver input
is the existing cycle-ledgered optional solver; build.mjs records its exact
normalized SHA and changes only import routing to the experimental checkpoint.
All recursive operations retain their existing ledger costs. The only new
transitive search function is controls.mjs::completeBehaviorNode32.

At every completion: prepared Wasm primary load (including wrapper/guards),
uint32 interpretation, extension mask/test, STOP mask/test, value return.
Delta from existing completion: last-word field load and inequality/branch.
On change: 2 unsigned shifts, 2 masks, enable/range tests and short-circuit
branches, selected prepared-array/field reads, 2 state-field assignments,
optional shift/subtract/shift/uint32 conversion for sampling, last-word store,
private change-counter load/add/store. This cost is variable, not zero.
Extension path delegates to the existing sequence-validated reader and ledger;
overlapping publication defers without spinning. No clocks, strings,
allocations, shared writes or observer callbacks occur at checkpoints.

Preparation creates one typed permutation per column and scalar fields, outside
search. Order selection changes future node ordering; previously stored parent
move lists remain intact. Shared sampling uses the already-existing hash mask
test; it does not add another per-TT-access control check. It changes the number
of atomic key/value reads and writes, which measured solve cycles must include.

Evaluator wrapper meters once before/after the solve call, using Windows
QueryThreadCycleTime. It includes root frame initialization, solve return and
measurement-call boundary overhead. It does not isolate assembly loop cycles or
charge helper GC/JIT threads. Warmup/ingress/setup are excluded. Strategist
thread cycles are separate. Tail until cooperative STOP is part of evaluator
cycles; do not report only winner cycles. Node count excludes terminal cofactors,
so completed count is also available as cofactors+1 only for completed solves.

Strategist timer, allocation, trace recording and JSON reporting are off the
search path. Their contention/scheduling/cache effects can still increase
evaluator cycles or elapsed time. No claim that those effects are free.
