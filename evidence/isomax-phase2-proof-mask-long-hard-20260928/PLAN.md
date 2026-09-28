# Longer completed-solve proof-mask comparison

Owner authorized a five-minute ceiling, with ten minutes only if important.
This is separate from the unchanged official120-second benchmark evidence.
Fixture35333571, standard7x6, root ply8/34 cells remaining.
A=be7c2887defcefb37080fa61de7ce1dc38dc2990.
B=7f74e324457c4237590bc6b0f924852f6d728e4c.
Both fixed detached worktrees remain clean. Candidate's exact-source Verify
36464380804 passed. Existing180 correctness tests and24757 differential CPC
checks remain applicable: no solver modifications in this retest.

Four workers: one wide + three deep; shared4194304; private1048576 each;
full sharing; Node26.7.0 Windows QueryProcessCycleTime. Reuse the existing
cpc-proof-mask-source-sample.mjs measurement unchanged. No new hot instrumentation,
no cache/order/affinity/algorithm change. Root move and WDL must agree for all
completed runs; expected rootWdl=-1 from the official benchmark.

Predeclared sequence ABBAABBA, eight fresh serial processes,300000ms each.
Start with AB. If either is censored, stop the300-second series after that pair
and assess whether a separate600-second pair is justified; do not manufacture a
speed ratio. If both finish, complete all eight irrespective of favorable or
unfavorable timing. Report all results, four adjacent paired ratios and t95df3
intervals (descriptive, small sample), whole-process cycles primary. Any mismatch,
worker error, source drift or failed cleanup stops execution and preserves raw.

Live ply is not exported by these fixed sources. No claim of measured ply
histograms is made. Exact solve completion, root ply, visited nodes and actual
runtime establish this test's scope. Any depth instrumentation is a separate
future diagnostic, not silently inserted into this performance comparison.

Cold driver costs: up to eight launches plus git checks, O(raw bytes) parsing,
filesystem writes, fixed metadata checks; allocations/OS waits are nonzero and
outside the existing measured solve bracket. Full stdout/stderr is written before
classification. Resume reuses existing records without repeating completed work.
Reproduce from repository root with Node26.7.0: node <this-directory>/run.mjs.
