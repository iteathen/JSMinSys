# IsoMax — prepared candidate

**Start here. Everything needed to run this candidate is inside this folder.**
Prepared for publication and checked into main; **not published**. Registry
publication is disabled with `private: true`. No release or release tag exists
for this package. Candidate version: `0.1.0-rc.1`.

This packages the exact qualified 32-byte shared-TT solver, four deep workers,
and initialization-selected board dimensions. Runtime modules are copied without
rewriting, bundling, minification, or hot-loop changes. There are no third-party
runtime dependencies. Keep the whole folder together; worker modules load by URL.

## Files you need

| File | Purpose |
| --- | --- |
| [index.mjs](index.mjs) | The public API; import this one file |
| [profile.json](profile.json) | Measured localhost configuration |
| [example.mjs](example.mjs) | Empty board → computed structural prefix → one exact search |
| [evidence/README.md](evidence/README.md) | Benchmark results and qualification |
| [provenance.json](provenance.json) | Exact upstream revisions and file checksums |
| [dist/](dist/) | Ready-to-transfer candidate archive and SHA-256 |
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

The example uses the measured large-memory profile: **4 GiB shared TT plus
576 MiB per worker**, about 6.36 GiB observed peak process RSS on the measured
Windows host. It computes the opening; it does not store `44444` as a premise.
There is one structural phase and one search, not a full self-play game.
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

All workers are deep. Alternative CPC options and `rootFrontier:true` are
rejected. Node counts and TT statistics are intentionally unavailable; no hot
reporting has been restored. The host prepares/spawns workers for each invocation
and closes them afterward; this package does not claim a persistent worker pool.

## Preservation and future publication

`provenance.json` binds the runtime to source commit
`fb0f60adcb9341b42af770f05899bbf61fd3c129`; the measured runtime is
`302ebcd91bca13e76cc8d1b0de25631b5e768af4`. Runtime content is identical between
those revisions. `node prepare.mjs --check` reproduces the source comparison in
the full repository with that Git history available. It is a maintainer tool,
not needed by users of the extracted package.

The archive is made locally with `npm pack`; this does **not** publish it.
Extract it anywhere and run verification/tests from the extracted `package/`
folder. The archive omits itself and the Git-dependent preparation tool.
Changing `private`, publishing to a registry, creating a release/tag, or changing
the measured runtime requires a separate explicit instruction.

License: [GNU AGPL v3](LICENSE). No standard-7x6 universality claim, broad
NEES seal, or performance guarantee is added by packaging.
