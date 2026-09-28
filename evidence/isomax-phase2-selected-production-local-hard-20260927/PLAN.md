# Local-host official hard qualification

Two complete ABBA blocks, eight fresh Node processes. A is
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`; B is
`00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee`. Documentation heads are not solver inputs.

Use each fixed revision's own `tools/run-isomax.mjs` with Node 26.7.0,
`--experimental-ffi`, and `{"moves":"35333571","timeoutMs":120000}`.
Seven workers, six deep plus one root-frontier, shared capacity 4194304,
private capacity 1048576 per worker, sharedSampleMask=0, rootFrontier=true.
No strategist, single-worker qualification, solver edits, or research-stack wiring.

Expected exact result is rootWdl=-1, move=4 (zero-based), from the earlier
qualified local standard benchmark at evidence/isomax-fhourstones-20260927/
1-35333571.stdout.log, committed in 5452c5c6c3cb67d359fbfe2e50047293163767e9.
Any exact disagreement stops execution. Timeout is censored, never a solved result.

Preflight: clean exact sources, matching profiles, Windows cycle counter,
candidate endpoint/privacy oracle, CPC, root-frontier and architecture tests,
generated-source/catalog/geometry checks, plus live PR Verify/schema/compatibility.
Direct synchronous unit oracles are correctness checks, not single-worker
performance qualification. Tests that launch one evaluator are excluded.

The cold driver captures full stdout/stderr per process and appends full parsed
samples. Its external 150-second containment is only for broken process cleanup;
the application ceiling remains 120000ms. No timing instrumentation enters search.
The same fixed three-second inter-process pause is used throughout. Commit raw
evidence between complete blocks; do not run tests during timed samples.
Preserve environmental failures and rerun their whole block only after diagnosis.

If all eight samples are exact, compare within-block B arithmetic mean / A
arithmetic mean for cycles, wall, CPU, all-worker nodes, winner nodes, shared hits
and stores. Report each ratio, mean percent delta and descriptive Student-t 95%
paired interval (two independent blocks; df=1). This tiny interval sample is not
strong inferential evidence. Otherwise report fixed-window descriptives only.
Whole-process solve cycles are primary, wall secondary; nodes explain work.

Publish raw results, environment, analysis and REPORT in this directory; summarize
in Connect4's canonical research and update PR #84. Do not merge as part of testing.
