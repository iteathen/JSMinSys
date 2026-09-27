# Asynchronous strategist exploration campaign

## Goal and design

Owner authorizes implementation and quick experiments, including combinations.
Search hot-path cycles across evaluator threads are primary. Strategist thread
cycles are reported separately; interference and instruction latency matter.
No production promotion, baseline replacement, TT mutation by strategist, or
bound-cache redesign is included. The existing optional flag reader is the base.

Use a separate experiment directory and generated specialization of the existing
behavior search. Ordinary src/addons remain untouched. The sole manual solver
authority stays the existing JSMinSys implementation. Build-time generation is
checked exactly; no runtime source rewriting. Numeric controls select prepared
move-order tie permutations and the existing shared-cache sampling mask. New
settings affect future work; no stack reset, missing moves, or fabricated WDL.
These are persistent, state-independent settings: delayed delivery is safe but
may waste cycles. Each trial owns fresh memory/threads so stale trial writes
cannot affect another solve. No new per-node telemetry.

Strategist runs independently, observes existing cache counters without mutation,
and publishes words at configurable cadence. Evaluators never await strategist
decisions. STOP after first result/deadline uses the same channel; retirement
tail is included in evaluator cycles. Warmup/startup are outside the search
measurement. Windows QueryThreadCycleTime brackets complete solve calls, not
each node; ingress/frame initialization inside solve remains included and is
reported honestly. No full NEES or assembly-qualified claim.

## Plan

- [x] 1. Tests first: zero settings preserve metrics; fixed and changing settings
  preserve WDL; invalid controls fail cold; STOP works; generator stays exact.
  Implement prepared controls and generated experimental solver. Cost ledger
  covers load, extension path, change detection, bounded decode and assignments.
- [x] 2. Add evaluator/strategist/host with ready barrier, bounded deadlines,
  per-thread cycle records, cleanup, exact-value checks, and raw JSONL evidence.
  Test live updates, slow strategist, exceptions/deadlines, and fresh-trial isolation.
- [x] 3. Screen small fixtures, run interleaved short trials: poll-only, inert
  controls, fixed diversity, periodic diversity, sparse sharing, adaptive sharing,
  and combinations. Compare cadences and observe interaction rather than assuming
  additivity. Bound screening/trials; unresolved roots are not solve wins.
- [x] 4. Review, run full existing suite/checks, persist source identities and raw
  evidence, summarize conclusions/limits, commit and push an experimental PR.

## Review focus

Cancellation must not masquerade as WDL. Changing ordering must only affect new
node ordering, never corrupt a live parent's move list. Sharing-mask changes must
not affect exactness. Losing evaluator cycles must be counted. Delayed strategist
must not prevent deadline cleanup. Startup must not silently dominate search
comparisons. Timing runs do not overlap tests or other campaign runs.

## Execution record

Base 424d5c230f92e3394dc874eec4caa09c685f0bfb; main unchanged at 93aca17.
Isolated existing worktree, separate experiment branch. User's explicit execution
request supplies campaign authorization; no further design approval needed.

Initial pass: 14 fixture screens, 163 comparison solves, all comparison results
agreed with baseline and joined cleanly. 160 tests passed; independent review
found no critical/important issues. Source/reproduction/raw evidence retained.
No production policy selected. Sparse sharing is only a follow-up candidate.

Owner steering: strategy value comes first. Cadence has no independent target;
study delivery only for a strategy whose value depends on timely instructions.
Cancelled the unimplemented atomic-wait follow-up. Existing cadence observations
remain evidence, not a reason to add a timer mechanism. Future strategies should
state the expected avoided search and observation needed before implementation.

## Pass 2: strategy discovery, authorized continuation

Keep evaluator hot code unchanged. Add strategist-only policies and read-only
sampling of committed TT records (sequence bracketing; rank from support).
Hypotheses: asymmetric sharing lets one anchor exchange proofs while helpers
explore mostly privately; harvest enables helper sharing after useful exact
positions appear; seed-and-retire buys an initial proof contribution then avoids
paying for duplicate full searches. Prepared broad tie diversity is a candidate
combination. Compare one-worker baseline, two-worker baseline and inert controls.
No cadence tuning. Preserve actual instruction traces and inactive policies.

- [x] Pure policy/TT-observation tests, then strategist implementation.
- [x] Screen additional independent nontrivial 7x6 roots with short deadlines.
- [x] Interleaved quick comparisons, then confirm promising policies and mixtures.
- [x] Review, complete checks, record results and push the experimental checkpoint.

Pass 2: 96 dispatch batches; 11 screens, 66 comparisons and 42 confirmation
trials. All strategy trials exact with clean shutdown. Integer early return is
the provisional experimental selection; tiny overlapping timing differences do
not establish isolated instruction costs. Seed retirement reduces two-worker
duplication but longer-root medians remain 5.9-11.3% above one worker. No policy
promotion. Independent review caught a misleading retirement trace label; fixed
eligibility versus actual STOP publication without changing worker execution.
163 tests pass. Full source, limits, results and raw evidence are recorded in
evidence/strategist-pass2-20260926/RESULTS.md. Existing host/evaluator, generated
search, src and addons are unchanged. This closes the bounded pass, not the
broader search for strategies that win across hard roots.
