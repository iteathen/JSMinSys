# Fixed shallow/deep pair screen

Compare two mode-capable DEEP evaluators against one SHALLOW plus one DEEP.
Use both assignments to control for worker-index move ordering. The strategist
publishes one initial persistent command per worker, then only existing STOP;
no timed strategy switching. SHALLOW uses the existing retained, exact two-ply
bands, advancing horizons until resolution. Unfinished horizons never become WDL.
This tests that existing implementation, not every possible breadth-first method.

Only `mode-policy.mjs` and its two strategist call sites change. Evaluator, hot
mode decoder, generated recursion, host and TT are unchanged. Both-deep pays the
same mode-capable machinery; this is not a comparison against the native
production alpha-beta loop. All arms retain full CPC, full sharing and existing
root full-window probes. Prior CPC ablations are not composed into this screen.

All trials: two evaluators, private capacity 4096 each, shared capacity 16384,
20 private 4x4 warmups, common ready barrier, requested strategist cadence 5 ms,
750 ms solve deadline, original 1500 ms cleanup grace. One fresh process per
trial, no concurrent benchmarks. Three roots: previous zero-based A/B plus
Fhourstones 45461667 converted once to zero-based moves. Six permutations of
three policies balance position and predecessor, 54 trials total.

Primary: ready-barrier to first exact completion, conditional on successful final
validation and cleanup. Also report barrier-to-joined return. Timeout is censored
at the limit; never treat it as solved latency. One first-result timestamp belongs
to evaluator completion, not host polling. Warmup/startup are outside search
latency but retained in process-total timing/cycle accounting. Evaluator and
strategist thread cycles remain separate diagnostics. No extra hot telemetry.

Aggregate shared hits cannot attribute cross-worker benefit (own-entry reuse is
possible). Existing horizon/pass counts prove command execution; cache hit/store
counts describe traffic, not unique proof progress. Direct attribution would need
a separate diagnostic experiment. Validate oracle values, no conflicting exact
values, clean cooperative cancellation and zero forced exits. Preserve failures
without silent retries. This screen does not promote policy or certify full NEES.
