# CPC and hash revisit

Objective: eliminate repeated CPC work and the general per-node hash loop
without changing decisions, TT identity/slots, publication, STOP or move order.
Keep the already-qualified live update and interleaved TT in every arm. The
reference is f35c7e352e8178abb23b380d6ab7afe4962ebe22 (runtime 8812c9d).
Production addons, source library, BSFP and frozen main remain unchanged.

The prior two-sample screen had baseline drift of 2.7 seconds. Its rigid 1%
gate excluded a 0.983% cycle result without resolving measurement uncertainty.
The first CPC approach also added packed boundary return/decoding. Neither
result establishes that the underlying optimization opportunity is exhausted.

Implementation C fuses the private singleton helper into its sole caller,
keeping the stopping index and flags as locals. Remove duplicate semantic
output resets from fork derivation and pass the stopping index directly. Keep
the original early-return priority and all tactical guards. No new counters,
scratch stores, return packing, clocks or allocations in the recursive path.
H unrolls the identical fourteen-word hash recurrence. Every output bit and
TT slot must remain identical. X enables C and H together; A enables neither.

Qualification before timing: existing differential suite; legal 5542 regression
showing one singleton-prefix visit and one semantic output clear; exact hash
comparison; whole deterministic single-worker cache comparison and STOP tests.
All variants must preserve the existing live/layout correctness gates. Use
separate JIT inspection only as mechanism evidence, never as full-solve timing.

Freeze exact revisions, then run one unscored baseline warm-up and these four
balanced sequential blocks (one instance of each arm per block and position):

    A C H X
    C X A H
    H A X C
    X H C A

Use the existing exact host/runtime/affinity/memory/timing contract: computed
five-move prefix from empty, one search, four deep workers pinned 0/2/4/6,
5 GiB shared TT and 576 MiB private each. Timeout 300 seconds. Do not run
other tests or benchmarking in parallel. Keep failed and incomplete evidence.

Report each raw run, per-arm mean, and per-block ratios versus A for wall time
and process cycles. Examine all four block deltas and their variation, with a
descriptive t interval (df 3, multiplier 3.182446) on log ratios. Four blocks do
not support a strong statistical claim, and the interval assumes approximately
independent normally distributed block effects. No fixed 1% speedup cutoff.

If X is consistently faster than A, all correctness checks pass, and the
component comparisons show no consistent material penalty, retain both.
A component with ambiguous standalone gain is not automatically rejected.
If an apparent component penalty or mixed combined result remains, perform a
targeted further ABBA/BAAB comparison before choosing the final configuration.
Never enable a known regression merely to claim four completed optimizations.

Report implementation status separately from performance evidence. Correctness
tests and removal of redundant operations do not prove fastest possible code.

## Targeted follow-up frozen after the sixteen-run diagnosis

All sixteen scored runs completed and passed. The helper-based combined result
was effectively tied with A (+0.013% wall improvement, +0.002% cycle improvement).
Actual solver compiler traces then showed the decisive implementation issue:
V8 inlined the original general hash into search but rejected the unrolled
helper because it exceeded its bytecode inlining limit. Isolated hash-code
inspection had not exposed this call-site behavior.

Candidate B now emits the identical fourteen-step recurrence directly at the
recursive search site, with no hash helper call and no loop. It also retains
fused CPC, live and layout. All 43 legal key-frame offsets are compared against
the original hash over 250 random word arrays; deterministic solver/TT equality
and the full suite remain qualification gates. Actual solver JIT trace must
confirm the modified search reaches optimized compilation. Do not alter engine
flags in the timed benchmark to coerce inlining.

Compare the current baseline A with B using **ABBA BAAB**, four samples each,
under the identical memory/runtime/affinity/timing contract. Analyze the four
adjacent AB/BA pair log ratios with the same descriptive t interval and report
every run. This is a new implementation test, not repeated sampling until the
old helper achieves a favorable score. Keep the complete inconclusive screen.

## Address-arithmetic refinement

The direct-hash eight-run comparison remained inconclusive: -0.134% geometric
wall improvement with a descriptive interval spanning -0.839% to +0.567%.
Inspecting the actual compiled search then found thirteen `jo` overflow guards
in the straight-line hash address calculation. For this private prepared 7x6
worker, depth-frame base is 14*depth (0..588), and every accessed word index
lies in 0..601. `(keyOffset+lane)|0` therefore preserves every valid address.
It makes wrapping int32 arithmetic explicit, removing those thirteen overflow
guards without removing typed-array bounds checks or changing any hash bits.
Actual compiled excerpts show 13 guards before and zero afterward, with all
fourteen hash multiplications retained. Whole-function size fell 18432→18252
bytes in that diagnostic run; this is not itself performance evidence.

Freeze this final refinement and run **ABBA BAAB** against the same A, four
samples each. Preserve both preceding complete inconclusive comparisons.
The actual emitted hash is tested at every one of the 43 legal frame offsets.
