# IsoMax — prepared candidate

**Start here. Everything needed to run this candidate is inside this folder.**
Prepared for publication and checked into main; **not published**. Registry
publication is disabled with `private: true`. No release or release tag exists
for this package. Candidate version: `0.1.0-rc.3`.

This packages the qualified solver with prepared closure masks, a 32-byte shared
TT, four deep workers, and initialization-selected board dimensions. Every admitted
board size selects dense or sparse removal before search. Containment masks and
prepared coordinate kernels now belong to the canonical RBA support libraries.
7x5 uses the optimized path too; there is no 7x6-only closure fallback. The runtime
retains its frozen source with explicit cold input/lifecycle corrections recorded
in `cold-corrections.json`; search kernels are unchanged. There are no third-party
runtime dependencies. Keep the whole folder together; worker modules load by URL.

## Files you need

| File | Purpose |
| --- | --- |
| [index.mjs](index.mjs) | The public API; import this one file |
| [profile.json](profile.json) | Measured localhost configuration |
| [example.mjs](example.mjs) | Empty board → computed structural prefix → one exact search |
| [evidence/README.md](evidence/README.md) | Benchmark results and qualification |
| [provenance.json](provenance.json) | Exact upstream revisions and file checksums |
| [dist/](dist/) | Historical rc.3 archives before the cold audit corrections |
| `runtime/` | Private, self-contained dependencies; no manual assembly needed |

## Run

Node 26 or later; no `npm install` is needed. Correctness has been checked on
Node 26.7.0 and the recorded Node 27 nightly. Timing is qualified only on the
historical runtime/hardware in `profile.json`.

From this folder:

```sh
node verify.mjs
node --test test/*.test.mjs
node example.mjs
```

The example uses the historical large-memory profile: **4 GiB shared TT plus
576 MiB per worker**, about 6.36 GiB observed peak process RSS on the measured
Windows host. It computes the opening; it does not store `44444` as a premise.
It awaits initialization of all four workers and empty tables, then times one
structural phase and one search. Initialization and cleanup are recorded
separately; this new timing boundary is not the historical measurement boundary.
Running the example normally does not pin workers or reproduce benchmark timing.

For the measured Windows affinity, use the recorded Node nightly and set these
environment variables before starting Node (PowerShell, from this folder):

```powershell
$env:JMS_WORKER_AFFINITY_FILE = (Resolve-Path ./targets.json).Path
$env:JMS_WORKER_AFFINITY_REPORT = Join-Path $env:TEMP ('isomax-affinity-' + [guid]::NewGuid())
node --experimental-ffi --import ./runtime/tools/worker-affinity-preload.mjs ./example.mjs
Remove-Item Env:JMS_WORKER_AFFINITY_FILE, Env:JMS_WORKER_AFFINITY_REPORT
```

The four reports record actual placement on logical processors 0/2/4/6. Those
targets belong to the measured i5-12600K and are not a portable CPU default.

## Embed / choose board dimensions

```js
import {prepareConnect4RbaGeometry, runLazySmpConnect4Rba32} from './isomax/index.mjs';

const geometry = prepareConnect4RbaGeometry({columns: 4, rows: 4});
const result = await runLazySmpConnect4Rba32([0, 1, 0, 1, 0, 2], {
  geometry,
  workers: 2,
  sharedCacheCapacity: 1024,
  localCacheCapacity: 1024,
  sharedSampleMask: 0,
  timeoutMs: 10000,
});
console.log(result.status, result.rootWdl, result.move);
```

Moves are **zero-based column indices**. `rootWdl` is first-player-relative
(-1/0/+1); inspect `status` before using it. The example's printed sequence uses
human one-based columns. The geometry is immutable during search; winning length
is four. Prepare a new geometry/environment for a different width or height.
Kernel, TT layout, key widths and CPC mask availability are selected before
search. General dimensions are correctness-qualified, not performance-qualified
at every size or memory capacity.

The other public export is `evaluateConnect4RankLocalLanding32(moves,{geometry})`.
Treat its `CERTIFIED`/`UNRESOLVED` result as the existing structural layer's
contract. The five-move standard opening is bounded research evidence, not a
universal Connect Four theorem or permission to unseal formula holdouts.

For application initialization, call `await prepareLazySmpConnect4Rba32({geometry,
...options})`. It returns a one-shot application with `solve(moves)`, `close()` and
`state()`. All workers are ready and empty TT pages are initialized before it
returns. Compute the structural prefix after that boundary, then call `solve`.
Always close a prepared application that is left idle. `solve` closes it after
the single search, including invalid-root, interrupted and failed paths. The
configured abort signal also closes an idle READY application automatically;
its subsequent single `solve` returns an interrupted result. An already aborted
signal rejects preparation before any worker or shared-table allocation.
The solve deadline starts when `solve` is called; initialization has its own
`initializationTimeoutMs` option (default 120000 ms).

All workers are deep. Alternative CPC options and `rootFrontier:true` are
rejected. Node counts and TT statistics are intentionally unavailable; no hot
reporting has been restored. `runLazySmpConnect4Rba32` remains a convenience
wrapper that prepares an application and invokes its single solve. The prepared
application is one-shot; it does not claim a reusable worker pool.

## Preservation and future publication

`provenance.json` retains the exact historical source and measured runtime commits,
locks required public files and records the applied cold correction manifest.
`node prepare.mjs --check` reproduces the frozen source plus those corrections in
the full repository with that Git history available. It is a maintainer tool,
not needed by users of the extracted package.

The historical timing in `profile.json` and the evidence folder belongs to the
frozen measured runtime. The corrected package has correctness qualification;
its performance has not been remeasured. Existing `dist/` archives retain the
historical package and do not contain these corrections.

The archive is made locally with `npm pack`; this does **not** publish it.
Extract it anywhere and run verification/tests from the extracted `package/`
folder. The archive omits itself and the Git-dependent preparation tool.
Changing `private`, publishing to a registry, creating a release/tag, or changing
the measured runtime requires a separate explicit instruction.

License: [GNU AGPL v3](LICENSE). No standard-7x6 universality claim, broad
NEES seal, or performance guarantee is added by packaging.
