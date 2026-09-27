# PFIF worker actions: first bounded screen

**Subsequent implementation audit:** these fixed-pass policies omitted the
narrowing stop condition. Their failures do not reject PFIF. See the
[audit and corrected causal comparison](../strategist-frontier-audit-20260926/RESULTS.md).
The historical measurements below remain unchanged.

Tested JSMinSys `e10bb58c7ec32578798d438ea4944b658a7fcaec` on Windows,
Intel i5-12600K, Node 26.7.0 with experimental FFI. This supplies actual worker
actions for bounded native RBA frontier passes, stride changes, release into
full continuation, and STOP. It does not promote a production strategy.

42 trials: seven configurations, two independent 7x6 roots, three rotated
repetitions. One evaluator per timing trial; the asynchronous strategist only
writes its behavior flags. Private cache 4,096 / shared cache 16,384 entries,
20 4x4 warmup solves, requested strategist interval 5 ms, unchanged 750 ms limit.
The first 7x6 specialization remains inside measurement. This is a small screen,
not a standard Fhourstones score or a completed multiworker PFIF campaign.

## Whole-operation results

Roots are zero-based column sequences. A = `2053635233350500`;
B = `1320461024522311`. Cycles below are medians in millions. All solved results
matched baseline WDL and deterministic root move. Both roots are absolute P1 wins.

| Configuration | A cycles M | A solve ms | B cycles M | B solve ms | Solved |
|---|---:|---:|---:|---:|---:|
| Ordinary behavior worker, baseline | 500.392 | 137.70 | 880.695 | 245.98 | 6/6 |
| Action worker, zero flags | 508.668 | 140.10 | 878.215 | 244.01 | 6/6 |
| PFIF worker, full continuation from start | 505.194 | 140.52 | 914.282 | 251.97 | 6/6 |
| Advance 2 plies repeatedly | 2,792.775 | timeout | 2,792.377 | timeout | 0/6 |
| Advance 4 plies repeatedly | 2,794.844 | timeout | 2,740.985 | timeout | 0/6 |
| Advance 8 plies repeatedly | 2,801.058 | timeout | 2,823.822 | timeout | 0/6 |
| Advance 4; release after 32 ms | 586.569 | 161.94 | 251.173 | 69.24 | 6/6 |

Timeout cycles are spent work, not cycles to solve. All 42 trials cleaned up;
24 solved, 18 timed out, zero worker failures or forced terminations.

The full-continuation control explored exactly the baseline node counts:
99,114 (A), 238,251 (B). Its median cost was +0.96% / +3.81%. Even without
deepening the candidate path has a measurable cost on B; it must earn that
back in total solve cycles. Three repetitions do not establish a universal
instruction-level overhead.

The release policy:

| Root | Median nodes | Median cycles/node | Cycle change vs baseline | Cycle range M |
|---|---:|---:|---:|---:|
| A | 118,214 | 4,961.93 | +17.22% | 526.585–721.273 |
| B | 48,333 | 5,196.72 | -71.48% | 222.471–430.557 |

B reduced work enough to overcome worse cycles/node: baseline 3,696.50 versus
5,196.72. A did not. This is exactly why whole-operation cycles decide, not a
lower local cost or a lower node count considered alone.

Release publication occurred at 32.69–38.66 ms (A) and 32.31–48.42 ms (B), rather
than exactly 32 ms. The underlying work reached when a time-based command lands
therefore varies; the raw node/cycle ranges are material. These three B wins
are a candidate signal, not a general win or proof that a TT-derived strategist
can reliably select the favorable moment.

## Interpretation and limits

Fixed shallow passes are rejected for these fixtures. At timeout the 2/4/8-ply
policies were in pass 5/3/2 respectively, with hundreds of thousands of horizon
stops. They expand and revisit incomplete prefixes while retaining only exact
TT facts and solved root actions. They do not retain full partial intervals or
an explicit frontier. This is evidence against this implementation of fixed
passes, not evidence against every performance-first frontier strategy.

The 32 ms release is an actual flag-controlled worker action, not a replacement
solver. Native RBA state, cache epoch and root live-state initialization are
retained across passes; the release extends the current horizon without resetting
the active frame. The strategist never mutates the TT. Full-window root probes
are a conservative first candidate and lose some baseline root pruning in the
general case; here the full-continuation controls establish identical node counts.

No policy is promoted. The first actionable follow-up is to explain and confirm
B's partial-exploration reuse, while preserving A as a negative control. Do not
infer a root selector from two fixtures, hide the 18 timeouts, or add a new TT
format/queue/scheduler in this flag-only campaign. Branch partitioning among
workers and the original stop-at-worker-count frontier policy remain unimplemented.

## Accounting and qualification

Windows QueryThreadCycleTime brackets the entire evaluator solve, including
in-call root setup, all passes, and cancellation tails. It excludes cold setup,
warmup, other V8 threads and the separately measured strategist. Median strategist
cycles for release were 4.527M (A) / 2.982M (B); raw and summary files retain all
strategist and evaluator measurements. No claim of five cycles per flag read or
sealed NEES promotion follows from this experiment.

173 tests pass, including six frontier tests: horizon continuation, cache
retention, deterministic witnesses, mirrors/terminal ingress, live stride/release,
STOP, actual two-worker timeout cleanup, and 32 seeded late 4x4 positions checked
against independent physical minimax with a 16-entry collision-prone cache.
Catalog, runtime geometry, ordinary/behavior/frontier generator checks and patch
hygiene pass. Review covered sentinel sign handling through forced chains,
unknown sibling/cutoff rules, exact-cache publication, root tie obligations, and
initial-command ordering after warmup. No independent external review is claimed.

Final review added a missing root-completion STOP poll, demonstrated first by a
failing immediate-win test and then repaired. The 42-trial screen above predates
that one-per-solve control check; preserve its exact source SHA rather than
claiming it measured the final repair. It does not change recursive node work.

Reproduce:

```powershell
node experiments/strategist/build.mjs --check
node experiments/strategist/build-frontier.mjs --check
node --test test/*.test.mjs experiments/strategist/*.test.mjs
node --experimental-ffi experiments/strategist/frontier-campaign.mjs NEW-SCREEN.jsonl
node experiments/strategist/analyze-frontier.mjs evidence/strategist-frontier-20260926
```

The campaign requires a fresh output path. Analyzer regenerates `summary.json`
from the archived `screen.jsonl`; it never rewrites trials. See
`experiments/strategist/FRONTIER_CAMPAIGN.md` for action and execution contracts.
