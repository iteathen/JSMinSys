# Four remaining hot-path costs

Baseline: `ec1648fc93a6c8c4c4e282c1a7e09448c4d8363c`, measured 39.624 s mean.
Production addons, BSFP, frozen main and the baseline snapshot stay unchanged.

Test four compile-time changes separately: C = remove duplicate CPC clears and
reuse the singleton scan boundary; H = identical hash recurrence unrolled to
14 words; L = identical three-word live-state update without loop control;
T = interleave shared TT sequence/value/key in 40-byte entries without changing
capacity, hash, identity comparison, atomics or publication order.

Freeze each variant in a commit and detached worktree after correctness checks.
Screen order: **A C H L T T L H C A**, two samples per variant and two baseline
samples. All use four deep workers, pinned P-cores 0/2/4/6, 5 GiB shared TT,
576 MiB private TT each, the recorded Node nightly, one computed structural
prefix from empty followed by one exact root solve, and a 300 s safety ceiling.
No counters or measurements enter the production recursive path.

Screening rule: prefer variants improving both mean wall time and mean process
cycles by more than 1% versus these baseline samples. Borderline results do not
establish a speedup. Combine qualifying variants and compare **A B B A** again;
keep only a correctness-passing combination with lower wall time and cycles.
Retain unsuccessful variants and measurements in Git history/evidence.

Correctness gates: exact hash-bit equivalence; live update equivalence for
in-place/disjoint storage; CPC decision/interval/mask equivalence, including
poisoned reused scratch; root WDL/move and logical private/shared TT contents;
gray-owner-equivalent TT hits; cancellation/timeout; concurrent collision stress;
and full existing tests. No change to runtime search premises or move ordering.
