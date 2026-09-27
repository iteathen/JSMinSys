# Integer polarity in the IsoMax worker hot loop

Baseline: `a667bd1bad1c2cc4273a1ddd94f58592f558b18e`.
Candidate source hashes: `tested-source.json`; this commit contains the tested
generator/solver. Windows x64, i5-12600K, Node 26.7.0 / V8 14.6.202.34-node.28.
Six deep workers plus one wide; 4M shared entries and 1M private entries per worker.

## Mechanism and preservation

Normalize sign-times-value returns, negated child results and negated alpha/beta
bounds with `|0`. All operands/results fit int32: WDL is -1/0/+1, window endpoints
are -2..2, cancellation is 3 and unfinished is 4. Negated child sentinels remain
-3/-4 and are handled before value comparison or publication. Negative zero has
no separate semantic meaning in these comparisons or stored WDL values.

This avoids requiring IEEE negative-zero preservation in the recursive numeric
path. It adds no branch, helper call, flag, allocation or per-node diagnostic.
Move order, memory, CPC, TT policy, root frontier algorithm and every-completed-node
atomic behavior reads are unchanged. The build-time generator owns the change;
generated production files are not patched at runtime.

The cost ledger includes a symbolic `runtime.to_int32` term: POLARITY+2*Q+3*R per
recursive invocation and CHILD at the root. JIT may fuse this with arithmetic;
source syntax is not a measured instruction count. Whole-operation cycles remain
the acceptance evidence, not a claimed constant saving per node.

## Qualification

- All 164 repository tests passed, along with both generator checks, catalog,
  hot-closure and configured-geometry audits and existing RBA benchmark controls.
- 40 deterministic comparisons matched the complete result, every metric and
  behavior-read count: 4x4/7x6, mirrors, wide/deep, live release and cancellation.
- 70 seven-worker timing runs returned expected exact WDL and clean seven-worker
  shutdown. Five initial pairs per fixture; ten additional pairs for p16-7 were
  declared after its initial median regressed. No failed timing run was retried.
- Bounded read-only code review found no blocking numeric, sentinel or generator
  issue. This is review evidence, not an independent correctness oracle.

## Whole-operation measurements

Fresh processes, alternating arm order, sequential runs, unchanged 30s timeout.
Cycles use Windows QueryProcessCycleTime over all process threads, including
startup, JIT, redundant worker work and shutdown. Trace runs are excluded.

| Fixture | Pairs | Before median ms | After median ms | Time delta | Operation-cycle delta |
|---|---:|---:|---:|---:|---:|
| Diagnostic A | 5 | 101.71 | 101.13 | -0.6% | -1.6% |
| Diagnostic B | 5 | 86.81 | 83.31 | -4.0% | -5.5% |
| p16-5 | 5 | 349.66 | 333.42 | -4.6% | -4.8% |
| p16-7, all batches | 15 | 302.65 | 299.33 | -1.1% | -1.1% |
| Fhourstones-derived `353335714` | 5 | 5798.40 | 5708.32 | -1.6% | -1.9% |

The longer fixture's median operation cycles fell from 152.746 billion to 149.785
billion. Its median total nodes changed from 29,470,307 to 29,047,452 because
parallel sharing/scheduling changes executed work even when deterministic search
is identical. These are bounded fixture observations, not a Fhourstones score,
empty-board solve or proof of a universal improvement.

Retain the uncertainty: p16-7's original five-pair cycle median regressed 4.2%
while its paired median was nearly flat (+0.15%). The declared ten-pair follow-up
improved cycle medians 1.6% (paired -1.7%); all fifteen pairs improve 1.1%.
Both batches remain intact. The two tiny diagnostic fixtures also have positive
median paired cycle changes despite improved ratios of arm medians. They are
startup/scheduling-sensitive and do not independently establish a speedup.
No claim excludes every >1% regression on untested inputs.

## Runtime evidence

Matched before/after trace runs on `353335714` both solved correctly. Observed
negative-zero deoptimizations fell from 4 to 0; Scavenge-bearing log lines fell
from 380 to 170. Other bailouts and GC remain. Interleaved logs are observations,
not exact allocation counts or proof of zero deoptimization on all workloads.
No exact machine-code cycle price is inferred from these counts.

`samples.jsonl`, `followup-samples.jsonl` and summaries preserve cycles, wall time,
nodes, cycles/node, throughput, memory and lifecycle results. Trace command lines,
outputs, test output, source hashes and deterministic results are retained.
The initial ledger verification caught the outdated extension-count summary and source-blob guard after
adding the cost term; refreshing both metadata fields restored verification. Solver code
did not change after the timing runs.

## Reproduction

Use separate clean baseline/candidate checkouts and the pinned runtime:

```text
node evidence/isomax-int32-polarity-20260927/qualify.mjs BASELINE CANDIDATE NEW_OUTPUT
node evidence/isomax-int32-polarity-20260927/controls.mjs BASELINE CANDIDATE OUTPUT_JSON
```

The cold evidence harness launches the supported runner; it never rewrites solver
source. `followup-manifest.json` specifies the extra p16-7 pairs, using the same
runner/order/timeout. `trace-before.json` and `trace-after.json` record trace flags.
Temporary reference checkout and working scripts are removed after qualification.
NEES Draft 0.5 scoped declarations and JMS-RESTRICTED deviations remain applicable;
this does not claim JMS-SEALED or allocation-free machine execution.
