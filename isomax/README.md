# IsoMax 0.2.0-rc.4

Start here. This folder contains the current solver package, its configuration, launchers, dependencies, tests and evidence. No npm install or manual file assembly is needed. Keep this folder together, or extract the matching archive from [dist/](dist/).

## Setup and run

Install Node 26.7 or later. From this folder:

```sh
node verify.mjs
node run.mjs --help
node run.mjs
```

The last command solves the **empty 7×6 board**, discovering physical performance cores and selecting memory during initialization. Hyperthreads are not additional workers. The retained2400/9600 JIT flags are supplied by the launcher. All worker creation, memory discovery, profile selection, table allocation and page initialization precede search. No opening book, solved table, prior-run cache, fixed opening or RLC is used.

## Memory profiles

| Shared TT budget (GiB) | Status |
|---|---|
| 1,2,4,8 | Tested |
| 16,32,64,128 | Experimental |

```sh
node run.mjs --list-memory-profiles
node run.mjs --memory-profile 8
node run.mjs --memory-profile 128
```

Default `--memory-profile auto` selects the **largest fitting profile, including experimental profiles**. Experimental selections are explicitly labeled in stderr and the result's `memoryPlan`. They are usable options, not claims of measured large-memory performance.1/2/4GiB were measured locally with2..6 workers;8GiB with six workers. These measurements are on the Windows i5-12600K standard7×6 workload and do not guarantee another system's optimum.

The memory snapshot uses physical availability and Node's process/resource-limit availability; Windows also limits allocation by available commit. Selection budgets all workers' private tables plus a geometry/worker-dependent support/runtime reserve before choosing shared capacity. Fresh7×6 with six workers reserves2GiB; tiny installation checks need less. The reserve includes admitted support/compiled tables, geometry copies, frames and conservative runtime allowances, rounded upward to a power of two (minimum256MiB). Supplied reusable shared plans are already included in the memory snapshot; any missing compiled tables are still budgeted. Private TT budget is256MiB per worker. Snapshotting is not an OS reservation; competing allocations can still cause preparation to fail cleanly. Worker count is not silently reduced to fit memory. There are no memory-policy checks, resizing or profile branches in the recursive hot loop.

Profile sizes are **shared-TT budgets**, not total RAM. On7×6,32-byte records use exactly the listed shared GiB and256MiB private per worker. Other dimensions select field widths and power-of-two capacities cold; actual bytes may be below the nominal budget. `memoryPlan` reports actual shared/private bytes, entry width, bank count, reserve, required headroom and discovery snapshot. The compiled transition plan retains its512MiB auxiliary budget and is included in support/runtime planning.

Individual banks keep their native index range below2^31; standard7×6 banks hold at most4GiB.8GiB uses two banks,16GiB four,32GiB eight,64GiB sixteen,128GiB thirty-two. The128GiB plan consumes all2^32 unsigned hash slots without signed global-index truncation. Lookup retains the exact field identity and atomic publication protocol; bank selection adds a shift/mask/reference lookup whose large-memory performance remains an experimental concern. Metadata/boundary and small-bank checks do not qualify128GiB allocation or speed. Profiles adapt at initialization to other geometry layouts; their performance is not qualified outside7×6.

Explicit `--shared-entries N --local-entries N` selects a custom capacity configuration. It cannot be combined with a numeric memory-profile selection. These entry counts are not GiB. Embedders may restrict **automatic** experimental selection using `allowExperimentalMemoryProfiles:false`; an explicit numeric profile remains an explicit choice.

Windows x64/ARM64 uses `GetLogicalProcessorInformationEx` and its efficiency classes; a homogeneous CPU uses all physical cores. The portable launcher enables the required experimental Node FFI support on Windows. Linux groups SMT siblings, intersects the process CPU allowance with online CPUs, and uses Intel hybrid PMU or ARM capacity data when available. If Linux does not expose core classes, the output explicitly reports `physical-cores-class-unreported` and `performanceCores: null`; only the physical count is known. macOS uses `hw.perflevel0.physicalcpu` for its highest performance tier and `hw.physicalcpu` on homogeneous machines.

Each result includes `workerPlan`, its discovery source and the actual numeric worker count. Unknown/corrupt topology is an error; it is not guessed from `os.cpus().length`. Use `--workers N` for an explicit experiment with an available count; it cannot exceed the number of discovered physical targets. The current multiworker engine supports 2..64 workers; auto detection outside that range fails before solver allocation. There is one launcher for every supported machine; no i5-specific launcher or fixed worker default.

Windows and Linux bind each worker to a distinct selected physical core and verify the exact thread CPU mask before loading its solver module or allocating its private TT. Windows honors a visible partial process mask; an unrestricted initial processor-group assignment does not hide other active groups. Each binding is the final OS acceptance check. Linux respects process CPU allowance and online CPUs. A rejected or unverified binding fails initialization and closes the workers; search does not start.

**macOS warning:** Apple exposes scheduling hints, not supported hard CPU pinning. Each worker receives user-initiated QoS, verified by the pthread QoS readback, and a distinct Mach affinity tag where supported. Apple Silicon may reject Mach affinity tags; QoS still applies. These hints do **not** guarantee placement on a particular core or even continuous P-core residency. `workerPlan.affinityPolicy` is `macos-hints`, and each `result.workerAffinity` record has `verified: false`, `hintsApplied: true`, and no claimed CPU ID. Windows/Linux records instead show verified CPU IDs. This macOS exception was explicitly requested by the owner.

```sh
node run.mjs --workers 4
```

The recorded **four-worker** i5-12600K candidate trials average **53.828 seconds** from all workers ready/empty TT initialized through actual empty-root construction and exact result. A final source confirmation took **54.156 seconds**, with observed peak RSS **6.44 GiB**. These historical timings do not qualify an automatically selected worker count. Initialization and cleanup are reported separately. The 10-second objective remains unmet. Current six-worker native32 measurements are roughly42s at4GiB;8GiB averaged41.124s over three runs, best39.822s, with10.96GiB peak RSS. That small mean advantage overlaps observed timing variation.16..128GiB full-capacity performance is unqualified.

Historical benchmark invocations retain the exact runtime, four-worker count and affinity used for those records. They are evidence, not startup defaults. The automatic worker count and affinity policy have separate platform correctness checks; timings remain scoped to the exact measured hardware/profile.

## Change board dimensions

Geometry is chosen at initialization; winning length is four. For example:

```sh
node run.mjs --columns 7 --rows 5
```

The engine chooses its key width, TT layout, cofactor and complete-plan/fallback path from that geometry. Full-game timing is qualified only on7×6. Larger boards may require much longer searches. Capacity overrides are explicit entry counts, not bytes; they change the measured configuration.

Fast installation check with small tables:

```sh
node run.mjs --columns 1 --rows 4 --shared-entries 256 --local-entries 256
node --experimental-ffi --test --test-concurrency=1 test/*.test.mjs
```

## Embed

```js
import {prepareConnect4RbaGeometry, prepareLazySmpConnect4Rba32} from './isomax/index.mjs';
const geometry = prepareConnect4RbaGeometry({columns: 7, rows: 5});
const app = await prepareLazySmpConnect4Rba32({geometry});
try {
  const result = await app.solve([]); // zero-based move history
  console.log(result.status, result.rootWdl, result.move);
} finally {
  await app.close();
}
```

Preparation owns all worker creation, table allocation and the all-ready barrier. Search starts only at solve(). The prepared object is one-shot; close idle applications. rootWdl is first-player-relative(-1/0/+1), move is zero-based, and -1 means no move. Check status before consuming an answer. The module's runLazySmpConnect4Rba32 convenience function prepares/solves/closes once. Embedders must supply the documented JIT flags and startup preload at process launch to reproduce the retained compiler configuration.

The optional exported rank-local calculator remains separate; using it changes the execution being measured. Diagnostic counters remain unavailable; no reporting or CPU discovery is added to search hot loops. Embedders must launch Node with `--experimental-ffi` for the cold OS affinity/hint API. `run.mjs` supplies this flag automatically.

## Contents

- index.mjs: public API.
- run.mjs / cli.mjs: portable empty-board launcher/result.
- profile.json: automatic worker/memory settings and historical explicit measurements.
- provenance.json / verify.mjs: SHA-256 identities and closure checks.
- runtime/: frozen producer dependencies, with unchanged worker kernels and cold system discovery.
- evidence/: raw retained measurements and qualification summaries.
- dist/: transferable archives; earlier versions are historical.

Maintainers can reproduce with node prepare.mjs and check with node prepare.mjs --check in a full Git checkout. Source is AGPL-3.0-only. This is a repository distribution; npm registry publication remains disabled. Older package implementations remain in Git history.
