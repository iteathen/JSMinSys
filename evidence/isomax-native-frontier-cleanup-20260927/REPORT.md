# Native six-deep / one-wide cleanup qualification

Before: `8af605338cd7b10ad06c53f7d7a5ad90e91ac447` (selected experimental loader).
Tested native code: `42109d5055f3af8c16f245768474672199394e6e`.
Subsequent changes affect ledger accuracy, structural checks and documentation,
not measured solver/host/worker code. Node 26.7.0, V8 14.6.202.34-node.28,
Windows x64, i5-12600K; seven workers, 4M shared entries, 1M private per worker.

## Result

Cleanup retains the selected algorithm, removes runtime source rewriting and
unused campaign actions, and supplies direct native integration. The complete
repository suite passed **164/164** tests. Catalog coverage is 298 core functions
plus 153 add-on execution units; the selected structural audit traverses 49 hot
functions and has negative controls. Both code generators, configured-geometry
audit and existing RBA benchmark controls passed. Twenty deterministic old/new
comparisons matched WDL, chosen column and every retained search metric across
4x4/7x6, reflection and released/bounded modes.

All **42** matched seven-worker timing trials solved with expected WDL and
complete seven-worker cleanup. Timings include startup, JIT, solving and join.
The two arms alternate order in fresh processes. These are fixture tests, not a
standard Fhourstones score or a completed empty-board solve.

| Fixture | Pairs | Before median ms | Native median ms | Wall delta | Operation-cycle median delta |
|---|---:|---:|---:|---:|---:|
| Diagnostic A | 3 | 115.55 | 98.71 | -14.6% | -10.5% |
| Diagnostic B | 9 | 83.24 | 82.93 | -0.4% | +1.7% |
| p16-5 | 3 | 344.47 | 337.09 | -2.1% | -1.9% |
| p16-7 | 3 | 305.54 | 302.88 | -0.9% | -0.4% |
| Fhourstones-derived `353335714` | 3 | 5909.14 | 5721.36 | -3.2% | -3.0% |

The last fixture's raw harness identifier is `begin-hard-derived`; that name is
misleading. Its actual input is a nine-ply continuation of Fhourstones `35333571`,
not Pascal Pons' Begin-Hard/Test_L1_R3 dataset. Preserve the raw identifier as
captured; do not interpret it as standard benchmark coverage.

Diagnostic B's first three pairs had an uncertain >1% cycle regression, so six
additional pairs were declared in `followup.json`. With nine pairs the ratio of
cycle medians remains +1.7%, while the median paired ratio is -4.6%. This is
substantial scheduling/work variance, not grounds to assert a reliable gain or
exclude a small regression. Before wall range: 77.20..126.08 ms; after:
74.81..95.39 ms. The minority regression is visible, not discarded because other
cases improve. The cleanup is retained for direct supported execution and the
overall measured behavior; no universal <1% nonregression claim is made.

`samples.jsonl` retains total nodes, nodes/sec, cycles/node, full process and
operation cycles, memory and cleanup. `processes.jsonl` retains every subprocess
outcome. `summary.json` contains medians/ranges/paired cycle ratios. No timing
run failed, timed out or was retried. The separate bounded timeout lifecycle test
returns no WDL and is not a timing score.

## Runtime and NEES qualification

Authority is NEES Draft 0.5 at
`7650bef0aecc0d2b226ecf253a1f8937ccf89d69`; see the full
[scope, rule dispositions, deviations and cost inventory](../../docs/isomax-root-frontier-nees.md).
This is scoped NEES-EXTREME implementation conformance with declared JSMinSys
deviations/debt, **not JMS-SEALED** or proof of optimal machine code.

A separate trace run solved the longer fixture with correct WDL and cleanup.
It was excluded from timing medians. `runtime.log` includes seven emitted
TurboFan reader-code sections and observed optimization of the recursive and
completion functions. The inspected common reader path has shape/call-target
guards, a Wasm call, primary-word tests and return. It is not just a single load,
and no five-cycle total is asserted.

The interleaved worker trace contains 288 bailout-bearing lines and 383 Scavenge
lines. These are log observations, not precise per-function event counts. Reasons
include feedback, overflow and minus-zero. The trace demonstrates that source
allocation checks do **not** establish heap-allocation-free execution. Boxing,
GC, deoptimization and startup remain explicit optimization debt. No unsupported
claim that all such costs were introduced or removed by this cleanup is made.

Whole operation/process cycles use Windows QueryProcessCycleTime, summed over
all threads. The historical Zen3 constants are not Intel timings: the selected
cost-profile override preserves unresolved operation costs symbolically. Exact
instruction, cache/TLB, branch-miss or per-core retirement counts are unavailable.

## Cleanup and review

Retired campaign source lives at the before revision in Git; raw historical
research/evidence stays in the repository. Active `experiments/` machinery is
removed. The Windows cycle reader is retained as a cold reporting tool; the
selected resource profile has moved to `profiles/`. Correctness, lifecycle,
negative controls and required accounting are not treated as disposable tests.

The prepared-state last-flag reset is a cold reuse repair. No new per-node policy
was introduced. Narrow decoding retains STOP/frontier stride/release/target;
ordering/sharing/CPC/recurring experimental actions and their prepared tables
are absent. A bounded separate code review found no blocking issue in the
solver, generator, lifecycle or scoped conformance claims. It is review evidence,
not an independent solver oracle.

## Reproduce

On the specified Windows runtime, current native invocation:

```text
node --experimental-ffi tools/run-isomax.mjs '{"moves":"353335714","timeoutMs":30000}'
node tools/verify-catalog.mjs
node tools/build-behavior-search.mjs --check
node tools/build-root-frontier.mjs --check
node tools/audit-runtime-geometry.mjs
node tools/audit-root-frontier.mjs
node --test test/*.test.mjs
```

For the historical arm, check out the exact before revision in a separate clean
directory, then use `node experiments/worker-scaling/run-selected.mjs` with the
same JSON. `manifest.json` has all five move strings and expected WDL. Alternate
before/after order for each pair, start a fresh process for each, keep the memory
settings unchanged, and stop on an unexpected result. `runtime-command.json`
records the separate trace flags; never mix that run into performance medians.
