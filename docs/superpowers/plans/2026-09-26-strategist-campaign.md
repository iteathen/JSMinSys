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
- [ ] 4. Review, run full existing suite/checks, persist source identities and raw
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
