# IsoMax 0.2.0-rc.3

Start here. This folder contains the current promoted solver, its configuration, launchers, dependencies, tests and evidence. No npm install or manual file assembly is needed. Keep this folder together, or extract the matching archive from [dist/](dist/).

## Setup and run

Install Node 26 or later. From this folder:

```sh
node verify.mjs
node run.mjs --help
node run.mjs
```

The last command solves the **empty 7×6 board**, discovering the worker count during initialization. It selects one minimal deep worker per physical performance core where the OS reports core classes. Hyperthreads are not additional workers. It applies the retained 2400/9600 JIT settings before process initialization. Default TT allocation remains **4 GiB shared + 256 MiB per worker**, plus geometry/support plans. This is not automatic memory sizing: more workers allocate more private TT memory. Compiled transitions add **445 MiB** when admitted within their 512 MiB auxiliary budget. No opening book, solved table, prior-run cache, fixed opening or RLC is used by this default path.

Windows x64/ARM64 uses `GetLogicalProcessorInformationEx` and its efficiency classes; a homogeneous CPU uses all physical cores. The portable launcher enables the required experimental Node FFI support on Windows. Linux groups SMT siblings, intersects the process CPU allowance with online CPUs, and uses Intel hybrid PMU or ARM capacity data when available. If Linux does not expose core classes, the output explicitly reports `physical-cores-class-unreported` and `performanceCores: null`; only the physical count is known. macOS uses `hw.perflevel0.physicalcpu` for its highest performance tier and `hw.physicalcpu` on homogeneous machines.

Each result includes `workerPlan`, its discovery source and the actual numeric worker count. Unknown/corrupt topology is an error; it is not guessed from `os.cpus().length`. Use `--workers N` to select an explicit count, including on unsupported platforms. The current multiworker engine supports 2..64 workers; auto detection outside that range fails before solver allocation. Discovery does not pin threads: the portable path uses OS scheduling. The measured Windows launcher retains its explicit four-worker pinning.

```sh
node run.mjs --workers 4
```

The recorded **four-worker** i5-12600K candidate trials average **53.828 seconds** from all workers ready/empty TT initialized through actual empty-root construction and exact result. A final source confirmation took **54.156 seconds**, with observed peak RSS **6.44 GiB**. These historical timings do not qualify an automatically selected worker count. Initialization and cleanup are reported separately. The 10-second objective remains unmet. Normal portable execution is unpinned and has no timing qualification.

For the exact measured Windows machine and runtime, use PowerShell 7:

```powershell
./run-i5.ps1 -NodePath 'C:/path/to/recorded-node27/node.exe'
```

This requires v27.0.0-nightly20260928b59840b593 and the i5-12600K. It sets process affinity85 and binds all four workers to verified processors0/2/4/6 before solver initialization. Actual affinity reports, result.json and stderr.txt are retained under the printed output directory. Different hardware/runtime uses the portable launcher; do not interpret its timing as equivalent.

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

The optional exported rank-local calculator remains separate; using it changes the execution being measured. Diagnostic counters remain unavailable; no reporting or CPU discovery is added to search hot loops. Windows embedders invoking the automatic API directly must launch Node with `--experimental-ffi`; explicit worker overrides do not require discovery.

## Contents

- index.mjs: public API.
- run.mjs / cli.mjs: portable empty-board launcher/result.
- run-i5.ps1 / targets.json: measured Windows affinity.
- profile.json: automatic startup default and separate explicit four-worker measurement profile.
- provenance.json / verify.mjs: SHA-256 identities and closure checks.
- runtime/: frozen producer dependencies, with unchanged worker kernels and cold system discovery.
- evidence/: raw retained measurements and qualification summaries.
- dist/: transferable archives; earlier versions are historical.

Maintainers can reproduce with node prepare.mjs and check with node prepare.mjs --check in a full Git checkout. Source is AGPL-3.0-only. This is a repository distribution; npm registry publication remains disabled. Older package implementations remain in Git history.
