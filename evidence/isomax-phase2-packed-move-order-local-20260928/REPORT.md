# Packed recursive move rows: rejected local qualification

Date: 2026-09-28. This is local-host evidence, not a hosted qualification.
Selected experimental baseline remains `f2d56c2788ef3a4c49fc4bef9d447c5be3184059`.
The candidate did not establish a whole-process cycle improvement. Do not promote
its runtime changes. This does not establish a general performance regression.

## Fixed comparison

- A: `f2d56c2788ef3a4c49fc4bef9d447c5be3184059`.
- B: `c496f57f3d1463805528cf1d904a3ee52a44e57f`.
- Raw evidence checkpoint: `51dc209` on
  `experiment/isomax-phase2-packed-order-20260928`.
- Primary fixture: `353335714`; eight alternating AB/BA pairs, 16 fresh processes.
- Four workers: worker 0 wide/root-frontier, workers 1/2/3 deep Lazy SMP.
- Shared capacity 4194304, private capacity 1048576 each, shared sample mask 0.
- No strategist, affinity change, solved prior, recursive instrumentation, or
  single-worker performance qualification.
- Both source worktrees were clean and checked against their fixed SHAs.
- Primary ceiling 90000 ms, inherited from the primary exact harness. Secondary
  hard ceiling remains 120000 ms; the hard fixture was not run after rejection.

Windows 11 Pro 10.0.26200; Intel Core i5-12600K, 10 physical cores/16 logical
processors; 34088599552 bytes RAM; Balanced power plan. Node 26.7.0,
V8 14.6.202.34-node.28. Process cycles use Windows QueryProcessCycleTime across
all process threads. No nominal-clock conversion. The cold controller runs
outside the measured child operation. The child bracket includes host/worker
startup, search, completion and cleanup, following the existing Phase-2 harness.
The host had 32 pre-existing Node service processes, but no qualification
process; these were preserved. This is a desktop measurement, not an isolated
machine claim. Both arms use the same environment and balanced pairing.

## Exactness and results

All 16 samples completed EXACT, rootWdl=-1, root move=4 (runner numbering).
All four workers performed meaningful work and exited; cleanup=true and no
errors in every sample. Winner was worker 2 in every sample.

| Metric | A arithmetic mean | B arithmetic mean | Mean paired B/A delta | Descriptive paired 95% interval |
|---|---:|---:|---:|---:|
| Process solve cycles | 37720338286.75 | 37832861565.625 | +0.302% | [-0.660%, +1.264%] |
| Wall ms | 2434.279 | 2442.881 | +0.358% | [-0.613%, +1.329%] |
| CPU ms | 10238.625 | 10244.125 | +0.063% | [-1.203%, +1.330%] |
| All-worker nodes | 4588417.5 | 4594076.5 | +0.125% | [-0.364%, +0.614%] |
| Winner nodes | 1275956.25 | 1270389.25 | -0.434% | [-1.798%, +0.930%] |
| Shared hits | 522803.75 | 524279.375 | +0.293% | [-0.902%, +1.488%] |
| Shared stores | 1604245 | 1607610.625 | +0.212% | [-0.271%, +0.694%] |
| Shared store contention | 46733.375 | 44324.875 | -4.990% | [-8.932%, -1.049%] |
| Cycles/node | 8220.847 | 8235.335 | +0.180% | [-0.928%, +1.289%] |
| Peak RSS bytes | 436766720 | 436972544 | +0.047% | [-0.138%, +0.232%] |

The intervals use eight within-pair ratios and Student t with seven degrees of
freedom. Exact ratios and every raw sample are in `exact/summary.json` and
`exact/samples.jsonl`; do not substitute ratios of arithmetic means for paired
means. These short solves provide a local completed-exact comparison, not a
claim about an empty-board solve or a cumulative 50% improvement.

Mean per-worker nodes A: [764952.125,1256971.25,1275956.25,1290537.875].
B: [770333.75,1262643.125,1270389.25,1290710.375]. Shared bytes identical:
169539109. Full worker timing, start skew, first-search-to-result, frontier,
completion and cache metrics remain in the raw samples.

## Mechanism and qualification

The hypothesis replaced separate score/column insertion traffic with one
uint32 recursive row entry. It retains eager live-line scoring, stable existing
tie order, CPC, cofactor and cache semantics. It does not repeat the rejected
lazy-selection scans. Packing is guarded by the initialized geometry and score
range; unsupported geometry retains the original representation. Root rows stay
unpacked. Actual source-based tests cover unsigned boundaries, equal scores,
real recursive trace equivalence, reflection and multiple prepared orders.

174/174 correctness tests passed. Catalog verification covered 298 sealed
functions and 159 addon functions; generator freshness checks, the 52-function
frontier audit, geometry audit, schema and 78-module syntax checks passed.
Generated behavior/frontier variants came from authoritative build tools.
Independent review findings were repaired before the fixed-source test.

The ledger review found an inherited parameter collision: generated search
ledgers used K for both insertion shifts and cancellation checks. K now denotes
insertion shifts; STOP_TEST denotes cancellation checks. This accounting repair
is useful independently of the rejected packed-row implementation. It changes
no runtime behavior and must not be used to promote the performance candidate.

Reduced shift traffic did not establish lower total solve cost. Packing,
decoding, control and JIT effects could offset the saving, but this run did not
isolate those causal costs. Lower contention alone is not an acceptance metric.
Retain the original runtime ordering; do not tune this realization from a
favorable subset of samples.

## Live-state reconciliation

PR 114 and PR 84 were both still open/draft when checked after the run. Neither
was merged or modified by this experiment. A concurrent branch,
`experiment/isomax-phase2-packed-move-rows-20260928`, reached `dbcfcf7` with a
plan and tests for the same packing hypothesis. This completed result should
inform that work; its separate implementation must not be called tested by this
report. Its branch has not been overwritten or deleted.

The original packed-tag baseline qualification remains distinct from its newer
hosted repeat (run 36455549930): the repeat's cycles -0.761% interval
[-1.647%, +0.125%] does not independently establish a gain. Full repeat artifact
identity is recorded in the canonical plan; no history has been rescored.

## Reproduction and integrity

Use Node 26.7.0 and the two clean source worktrees:

```text
node experiments/isomax-phase2/packed-move-order-source-ab.mjs <output-dir> <A-worktree> <B-worktree> 353335714 8 90000
```

`PLAN.md` describes the measurement/accounting boundary. `environment.json`
records hardware and runtime; `verification-tests.txt` preserves correctness
output; `exact/processes.jsonl` preserves child stdout/stderr. The artifact
manifest hashes committed Git blob bytes, avoiding checkout CRLF ambiguity.
