# Local packed move-order qualification

Canonical plan: Connect4 research/semantic-quotient commit 5180d871,
`research/isograph/optimization/2026-09-27-isomax-second-50-percent/PACKED_MOVE_ORDER_PLAN.md`.

Fixed A: f2d56c2788ef3a4c49fc4bef9d447c5be3184059.
Fixed B: c496f57f3d1463805528cf1d904a3ee52a44e57f.
Eight AB/BA pairs; 16 fresh processes; fixture353335714, application90000ms
(inherited primary-exact ceiling). Secondary hard ceiling remains120000ms;
not run as part of this primary screen. Four workers: 0 wide, 1/2/3 deep.
Node26.7.0, mask0, shared4194304/local1048576 each. No strategist or affinity
changes. Local host has16 logical processors, so the cold hosted-only assertion
availableParallelism==4 is changed to >=4; configured worker count stays4.

Primary acceptance: paired whole-process solve-cycle 95% interval wholly below
zero. A failed correctness/cleanup sample halts comparison; preserve its raw
process record. Censored samples cannot establish exact solve-speed benefit.

Preflight:174tests pass, schema/syntax, catalog, both generated-source checks,
geometry and root-frontier audits. Independent source/accounting review clear
after correcting an inherited K parameter alias in generated cycle ledgers.
K=insertion shifts; STOP_TEST=cancellation checks. No runtime instrumentation.
Internal serial traces test correctness only; no single-worker timing campaign.

## Harness cycle boundary

The two cold experiment scripts derive from packed-tag source harness at
49ca575b1e98640cab1ebccf8429eb23f9cd4f0f. No recursive instrumentation.
Controller module-main: 16 synchronous process spawns/waits (unbounded latency,
nonzero CPU), repeated Git SHA/dirty checks (process+IO cost), JSON parse/write
proportional to bytes, array scans/reductions proportional to samples/metrics.
Controller git arrow: subprocess+decode; mean arrow/reducer: linear scalar
loads/adds/conversions; filter/map/find callbacks and ratio/variance reducers:
linear per sample/block. None is zero-cost; controller is outside sampled Node
processes and runs while each child is stopped except blocking spawn/wait.

Sample module-main: imports, geometry, git SHA lookup and FFI setup precede the
counter bracket, matching existing Phase-2 authority. Bracket includes the full
host/worker operation, allocations, worker startup, all search, shared cache,
completion and cleanup. Search/worker/host operations are composed by the sealed
catalog ledger; no nominal-frequency conversion. Counter reads have finite but
unisolated native-call overhead common to both arms. Move conversion and result
reductions/JSON reporting are cold; post-bracket output is excluded equally.
The new parallelism assertion, source labels and correctness assertions execute
outside the measured operation. Local machine differences stay explicit.

Operation-cost expressions are not measured Intel cycle counts. Empirical
whole-process QueryProcessCycleTime remains selection authority. Source ledger
includes every changed packing/selection/decode operation and source blob seal.
