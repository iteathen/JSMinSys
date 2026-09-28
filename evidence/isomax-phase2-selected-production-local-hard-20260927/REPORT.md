# Local-host official hard result — suspicious; investigation required

**Disposition: CENSORED / SUSPICIOUS. These results warrant investigation. Do not
use them to claim an exact solve-speed improvement or to close PR #84's official
hard promotion gate.** Both arms timed out in all four samples under the unchanged
120000 ms application ceiling. No WDL or root move was produced.

## Sources and execution

- A: `a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a` selected production.
- B: `00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee` selected production + private zero bounds.
- Fixture: official Fhourstones `35333571`, two ABBA blocks, eight fresh processes.
- Windows 11 Pro 10.0.26200; Intel i5-12600K, 10 physical / 16 logical processors;
  34,088,599,552 RAM bytes (about 31.75 GiB); Balanced power plan.
- Node v26.7.0, V8 14.6.202.34-node.28, `--experimental-ffi`.
- Seven workers: six deep and one root-frontier; shared capacity 4194304,
  local capacity 1048576 per worker, sharedSampleMask=0, rootFrontier=true.
- No strategist, single-worker qualification, Stage-9/support-plan wiring,
  altered ordering, altered timeout, or solver edits.
- Both exact worktrees were clean before execution and rechecked afterward.
  Runner blob `500ca533ae0bd70cdf661581bda3ab8058f22c25` and profile blob
  `6f9d309d85b53229bd2465ac42856c58df14b5c7` match between A and B.
- Complete operation measured by each fixed source's own runner and Windows
  QueryProcessCycleTime. No new recursive instrumentation.
- Measured blocks: 2026-09-28 01:14:55–01:31:30 UTC (September 27 local time).

## Fixed-window descriptive results

Arithmetic means of four samples per arm. These are **not costs to solve**.

| Metric | A control | B candidate |
|---|---:|---:|
| Exact completions | 0/4 | 0/4 |
| Clean timeouts | 4/4 | 4/4 |
| Process solve cycles | 1,673,612,816,251 | 1,673,319,097,462 |
| Wall ms | 120,062.052 | 120,058.704 |
| CPU ms | 453,870.750 | 454,074.250 |
| Total all-worker nodes | 243,052,489.50 | 209,909,727.25 |
| Winner nodes | unavailable | unavailable |
| Shared exact hits | 39,817,267.25 | 33,447,152.50 |
| Shared exact stores | 19,899,158.25 | 27,720,864.50 |
| Shared store contention | 62,416.50 | 82,129.75 |
| Cycles/node | 6,885.81 | 7,971.81 |
| Nodes/second | 2,024,390.81 | 1,748,392.23 |
| Process peak RSS bytes | 892,778,496 | 892,275,712 |
| Start skew ms | 5.798 | 5.368 |

Candidate fixed-window descriptive differences: nodes -13.636%, shared hits
-15.998%, shared stores +39.307%, cycles/node +15.772%. Cycles were nearly equal
(-0.01755%) because these are deadline-censored windows. None is a solve-speed
ratio. Paired solve-cost percentage deltas and their 95% interval are **not
reported**, because no exact samples exist. First-search-to-result time and
winner metrics are null. The small wall overrun includes deadline shutdown and
cleanup, not a changed application ceiling.

## Repetition and worker checks

| Block / slot | Arm | Status | Nodes | Process cycles |
|---|---|---|---:|---:|
| 0 / 0 | A | TIMEOUT | 242,455,139 | 1,669,200,969,811 |
| 0 / 1 | B | TIMEOUT | 209,184,812 | 1,669,074,279,302 |
| 0 / 2 | B | TIMEOUT | 210,492,234 | 1,674,855,054,691 |
| 0 / 3 | A | TIMEOUT | 243,111,872 | 1,674,336,694,811 |
| 1 / 0 | A | TIMEOUT | 243,287,832 | 1,675,331,993,003 |
| 1 / 1 | B | TIMEOUT | 211,506,702 | 1,676,521,953,261 |
| 1 / 2 | B | TIMEOUT | 208,455,161 | 1,672,825,102,593 |
| 1 / 3 | A | TIMEOUT | 243,355,115 | 1,675,581,607,380 |

Within-arm repeats match closely. Node-count sample coefficient of variation:
A 0.169%, B 0.647%; cycle CV: A 0.179%, B 0.192%. Consistency does not remove a
systematic environmental or measurement problem.

Mean worker nodes, index 0 through 6:

- A: [13,336,000.25; 38,312,695.25; 37,440,833.50; 38,870,134.75;
  36,784,757.25; 38,602,343.00; 39,705,725.50].
- B: [13,490,930.75; 32,529,014.75; 32,784,560.75; 32,864,956.75;
  32,852,193.00; 32,299,645.50; 33,088,425.75].

Every worker did meaningful work: the smallest individual count was 13,312,286.
All eight samples report workersExited=7, cleanup=true, errors=[], and
errorCode=102 (documented HOST_DEADLINE). No idle-worker regression observed.
completedWorkers are all zero: no evaluator completed an exact proof. Frontier
metric arrays are retained verbatim; their zero timeout rows are not proof of
absent frontier work. No benchmark Node process remained after the final run.

## Why these results are suspicious

The earlier local standard benchmark (evidence/isomax-fhourstones-20260927) solved
the control in 83,132.757 ms, rootWdl=-1, move=4 (zero-based), with 412,368,568 nodes,
579,547 CPU ms and 2,137,317,372,500 cycles. Its source was `b6ce1c541807b0123cf8f5dab759dcccd6a93f3b`.
`git diff b6ce1c5 a3cf7f9 -- addons src profiles tools/run-isomax.mjs tools/process-cycle-counter.mjs`
is empty. Only evidence and a cold verifier changed outside those runtime paths.
The declared CPU, RAM, OS, Node and V8 match that earlier run.

Current A accumulates about 3.780 CPU-seconds/wall-second; the prior exact sample
accumulated about 6.971. Current throughput is about 2.024M nodes/s versus the
earlier 4.960M. Work mix and complete-versus-censored scopes differ, so this is a
diagnostic discrepancy, not a measured code-regression ratio.

Checks made without altering the experiment:

- No wrong revision or dirty solver tree found.
- No orphan benchmark process found. During execution only the active solver
  and its controller used this Node runtime. Earlier sampled PIDs had exited.
- Normal process priority and affinity mask 65535 (all 16 logical processors).
- Cold controller used 0.25 CPU-seconds by late block 0; block 1 snapshot showed
  0.125 controller CPU-seconds versus 291.156 solver CPU-seconds. These snapshots
  do not measure every possible launch/scheduling side effect.
- Both old and current cold controllers launch fresh processes with a 30-second
  heartbeat. No per-node work was inserted by the new controller.

**Cause remains unresolved.** Host scheduling, throttling/QoS, contention,
launch environment and measurement attribution need investigation before a new
promotion-grade interpretation. Neither harness interference nor its complete
absence has been proved. No affinity, power-policy or process-priority changes
were made to obtain favorable samples. No hardware normalization was applied.

## Preserved controller interruption

Before the eight-sample campaign, one control timed out normally, but the cold
controller incorrectly required errorCode=0 instead of documented deadline
code 102. It stopped before B. That complete raw process output is preserved in
interrupted-controller-attempt/. Only controller validation was corrected;
the whole affected ABBA block was restarted. Nine solver processes total were
executed, eight in the complete analysis. No failure or unfavorable result was
silently deleted. Raw checkpoint: `ff85f204b265aedad4554959ffb9b148a18ad87f`.

## Correctness and promotion disposition

29 candidate correctness tests passed, including directed-window independent
oracle/privacy, CPC, root move/reflection, shared-cache, cancellation and 2+
worker composition. Generated mirrors, runtime geometry and hot-call audit
passed. Catalog verifies 298 sealed functions plus 156 add-on units, 30/30
blocks, zero deferred functions. See preflight logs and REVIEW.md.

| Requested promotion gate | Disposition |
|---|---|
| Verify/schema/Node compatibility | Green at evidence checkpoint 2adc347, Verify run 36365782434; fixed candidate locally checked |
| Public/shared exact semantics | Preserved by inspected diff and passing oracle/privacy tests |
| Short selected-production non-regression | Prior separate evidence: cycles -2.641%, retained |
| Derived-long strong improvement | Prior separate evidence: cycles -66.8335%, retained |
| Official hard exact/non-regressive local solve | **NOT MET: both arms censored; suspicious control discrepancy** |
| Seven-worker architecture unchanged | Verified; all seven worked and exited |
| No single-worker qualification | Satisfied |
| No support-plan research wiring | Satisfied by fixed-source diff |
| No solved-game prior in solver | Satisfied; expected result exists only in cold validation |
| Canonical cycle ledger complete | Catalog pass; full-process measured cycles retained |

PR #84 should remain draft/pending promotion review. This run neither establishes
nor refutes an exact official-hard speedup. No merge or promotion performed.
Prior short, derived-long, and hosted-censored evidence remains unchanged.

## Durability and reproduction

All eight raw samples were committed in `a1efbff19c4bc15398f91162423209b6edccbb2e`;
first complete block in `2adc34701fb87fa8415f0685d84633bf8d1dd7cb`;
plan/environment/preflight in `74c1459b921857a562125fd556797135bfe27ea7`.
manifest.json fixes source paths/SHAs/options; environment.json records the host;
each *.process.json records command and UTC timestamps; *.stdout.log and
*.stderr.log preserve full raw output; samples.jsonl retains every runner field.
analysis.json contains means, spread and worker distribution, with paired=null
because the comparison is censored.

On the same configured host, from a fresh evidence directory using the exact
manifest sources, execute run-block.mjs 0 then run-block.mjs 1 using Node 26.7.0.
The controller refuses to overwrite samples. Each process executes:

```text
node --experimental-ffi tools/run-isomax.mjs '{"moves":"35333571","timeoutMs":120000}'
```

Recompute the summary without solver work:
`node evidence/isomax-phase2-selected-production-local-hard-20260927/analyze.mjs`.
Clean fixed worktrees are retained for reproducibility/investigation; no search
or controller process is retained.
