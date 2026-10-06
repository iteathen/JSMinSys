# IsoMax 0.2.0-rc.1

Start here. This folder contains the current promoted solver, its configuration, launchers, dependencies, tests and evidence. No npm install or manual file assembly is needed. Keep this folder together, or extract the matching archive from [dist/](dist/).

## Setup and run

Install Node 26 or later. From this folder:

```sh
node verify.mjs
node run.mjs --help
node run.mjs
```

The last command solves the **empty 7×6 board** with four minimal deep workers. It applies the retained 2400/9600 JIT settings before process initialization. Default TT allocation: **4 GiB shared + 256 MiB per worker**, plus geometry/support plans; observed peak RSS about **6 GiB**. No opening book, solved table, prior-run cache, fixed opening or RLC is used by this default path.

The recorded i5-12600K runs average **56.893 seconds** from all workers ready/empty TT initialized through actual empty-root construction and exact result. Initialization and cleanup are reported separately. The 10-second objective remains unmet. Normal portable execution is unpinned and has no timing qualification.

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
node --test --test-concurrency=1 test/*.test.mjs
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

The optional exported rank-local calculator remains separate; using it changes the execution being measured. Diagnostic counters remain unavailable; no reporting is added to search hot loops.

## Contents

- index.mjs: public API.
- run.mjs / cli.mjs: portable empty-board launcher/result.
- run-i5.ps1 / targets.json: measured Windows affinity.
- profile.json: exact retained settings and timing boundary.
- provenance.json / verify.mjs: SHA-256 identities and closure checks.
- runtime/: immutable dependencies copied from ea4fd8b.
- evidence/: raw retained measurements and qualification summaries.
- dist/: transferable packages; older rc.2/rc.3 archives are historical.

Maintainers can reproduce with node prepare.mjs and check with node prepare.mjs --check in a full Git checkout. Source is AGPL-3.0-only. This is a repository distribution; npm registry publication remains disabled. Older package implementations remain in Git history.
