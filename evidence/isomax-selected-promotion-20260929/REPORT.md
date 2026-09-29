# Selected IsoMax promotion to main

This focused promotion integrates the retained qualified runtime into main; it does not merge the accumulated experiment branches wholesale.

## Identity and scope

- Prior main: `93aca1758718bcbf0635c11a957a67ca6387d50c`.
- Selected runtime: `6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e`.
- Source/accounting/profile snapshot: `c55a2ebad560a239cc2572a8214ec8f670410783`.
- All selected `src/`, `addons/`, `tools/`, and `test/` blobs are copied unchanged. The later snapshot corrects cold Number-multiplication accounting and records the selected profile; it does not change those runtime blobs.
- Retained: local zero bounds/coalescing, exact-only shared cache, full-q hash reuse, lossless compact shared/private keys, packed private epoch/value tags, packed move-order rows, native root-frontier worker, large shared-view restoration, startup-only affinity, generated-source seals and K/STOP_TEST accounting separation.
- Excluded: rejected CPC proof mask, unqualified redundant CPC-check removal, support-neutral identity changes, Stage-9 support plans, strategist, solved-position priors, unrelated experiment workflows.

## Existing performance evidence

Evidence remains immutable in the original campaign history. These are scoped comparisons, not additive estimates of one cumulative speedup.

- Packed move rows: [workflow 36459095332](https://github.com/iteathen/JSMinSys/actions/runs/36459095332), artifact 10987375059, SHA-256 `4ede6ad995b75629425b695f82b8c38391ebbe60ce8d801ca2e00890cdb9bf62`. Eight paired comparisons, 16 exact results on 353335714, WDL -1 / zero-based move 4. Process cycles -0.621%, 95% interval [-1.101%, -0.141%]. Runtime source 7b1cbf0ddb77173cf614bde32b6bd2cdb459820e; accounting-corrected continuation be7c2887defcefb37080fa61de7ce1dc38dc2990.
- Earlier separately qualified reductions: compact shared identity -1.923% cycles, compact private identity -1.807%, packed private tag -0.969%. Each comparison used its preceding selected baseline.
- [Local memory/affinity evidence at the frozen snapshot](https://github.com/iteathen/JSMinSys/tree/c55a2ebad560a239cc2572a8214ec8f670410783/evidence/isomax-memory-affinity-20260928) preserves the hardware-specific selection. 576 MiB private was the best observed point in a singleton memory curve (32.407 s on 35333571); 1152 MiB was 33.061 s. This is not a statistically proven global memory optimum.

## Current localhost profile and reproduction

Windows / Intel Core i5-12600K / about 32 GiB RAM / Node v27.0.0-nightly20260928b59840b593 (V8 14.6.202.34). Profile `isomax-four-pcore-10g-576m-i5-12600k-20260928`: worker 0 wide, workers 1..3 deep, full sharing, 268435456 shared entries, 16777216 private entries per worker; total cache payload 13153337356 bytes. Logical processor targets 0, 2, 4, 6 are validated before workers start.

From the repository root, in PowerShell, with the pinned nightly `node` on PATH:

```powershell
$env:JMS_WORKER_AFFINITY_FILE = (Resolve-Path 'evidence/isomax-memory-affinity-20260928/targets.json').Path
$env:JMS_WORKER_AFFINITY_REPORT = Join-Path $env:TEMP ('isomax-affinity-' + [guid]::NewGuid().ToString())
node --experimental-ffi --import ./tools/worker-affinity-preload.mjs evidence/isomax-memory-affinity-20260928/sample.mjs . 35333571 120000 268435456 16777216
```

The report prefix must be fresh because the preload records each target with exclusive creation. This intentionally uses the existing measured launcher; `tools/run-isomax.mjs` retains the older seven-worker comparison profile. Do not run the large profile on unrelated hardware without its resource/affinity checks.

## Review and validation

Independent review of prior main through selected runtime found no critical/important defect in compact identity, epoch tags, bound/coalescing polarity, endpoint exactness, publication, frontier/cancellation, or large-view attachment. 33 focused tests and both generator checks passed. This review is not an exhaustive proof; actual large allocations are additionally checked by the selected-profile confirmation.

Full local validation: 298 catalog functions, 170 sealed add-on units, 30/30 blocks, zero deferred blocks; generated behavior/frontier freshness; frontier and runtime-geometry audits; 180 tests passed. Raw verification and the final selected-profile confirmation will be recorded alongside this report. Protected-main Verify/schema/node-compatibility checks and exact-head review are required before merge.

## Fixed-head localhost confirmation

Clean source `e7ab2138e2bf1fce59687adf4ac6aa5bab49235b`, same runtime blobs as selected 6bbba7c. Fixture `35333571`, unchanged selected four-worker/10 GiB/576 MiB profile, 120000 ms ceiling, fresh pinned-nightly process. **EXACT**, rootWdl -1, zero-based move 4, matching existing qualified evidence.

- Wall 33.324750 s; process CPU 132.751 s.
- Process solve cycles 487526972082; 8222.253 cycles/node.
- Total nodes 59293601; winner nodes 16046309; throughput 1779266 nodes/s.
- Per-worker nodes [11256819,16027014,15963459,16046309]; all four contributed.
- Shared hits 7292424; stores 19707412; store contention 1444797.
- Peak process RSS 12824293376 bytes; four worker exits; cleanup true; errors empty.
- All affinity reports confirm requested P-core target before solver initialization.
- Standard FFI experimental notices are preserved in stderr.

This is an integration confirmation, not a new paired performance comparison. It verifies actual large shared allocation/transfer and selected-profile execution. It does not establish an empty-board solve or a fresh speedup estimate. Full raw result: `hard-confirmation.json`.

Review disposition: no critical/important finding; retained-runtime source unchanged. Local Verify equivalents passed, including 180 tests on Node 26.7 and 180 on the pinned nightly. Merge remains subject to all three required protected checks on the final PR head.
