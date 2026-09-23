# Round 103 — cold branch-manager host add-on

Status: implemented on `research/isomax-rba-primitives-v1`.

The worker hot substrate belongs to the sealed numeric catalog. Branch-manager
host lifecycle is different: it owns Node thread creation, Promise/timeout
lifecycle, rich error collection and final cleanup. Forcing those mechanisms
into JMS-RESTRICTED would misclassify cold orchestration as hot computation.

## Add-on surface

`addons/branch-manager-host.mjs` provides:

- `filterFileWorkerExecArgv32`
- `createMetricViews32`
- `createManagedThreadSession32`
- `failManagedThreadSession32`
- `spawnManagedFileWorker32`
- `waitManagedThreadSession32`
- `closeManagedThreadSession32`
- `managedThreadSessionState32`
- `sumMetricViews32`
- `sharedViewBytes32`

The application should only need to initialize its shared/domain root, describe
the manager/evaluator thread roles and payloads, spawn them through the add-on,
wait, close, and interpret its own result fields.

## Ownership boundary

The add-on owns generic host lifecycle and first-error fail-closed signaling.
The application retains:

- semantic root/table initialization;
- domain status/result codes and presentation;
- thread entry modules and workerData contents;
- result witness/value interpretation;
- policy limits such as the maximum allowed solve deadline.

The add-on does not reconstruct application state, inspect domain keys, select
game moves, evaluate nodes, or become a second execution authority.

## Qualification

Behavioral tests cover:

- stdin/eval `--input-type` sanitation for file workers;
- normal DONE completion and full join;
- deadline failure waking a blocked worker;
- AbortSignal cancellation with first-error preservation;
- unexpected worker exit -> fail-closed session; and
- numeric metric aggregation/shared byte accounting.

This module is intentionally excluded from the hot function/cycle catalog.
Its costs belong to cold E3/session lifecycle and governing-unit measurements.
