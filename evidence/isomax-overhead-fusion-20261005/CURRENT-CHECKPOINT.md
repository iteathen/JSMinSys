# Current localhost optimization checkpoint

Branch `work/isomax-overhead-fusion-20261005`, based on live promoted main `c36d9748683ba4a4cfc09ab3456fa655c31914ad`. Main and the frozen `isomax/` package have not been changed. Final retained source at `9e5c2f955734bf183cd6467f2d07c436ef486516`; later documentation/review commits inherit that source unless explicitly recorded.

Exact empty7x6, no RLC/prefix/book/oracle/persisted proofs. Four deep workers, center/live/center/live, CPUs0/2/4/6 and processmask85. Shared134217728native32 entries=4GiB; private8388608native32 entries=256MiB/worker. RootFrontierfalse,sharedSampleMask0,sharedProofBoundstrue. Base geometry budget1GiB and explicit compiled-transition auxiliary budget512MiB. Actual extra transition residency466948881bytes(445.31MiB), total retained plans1323433629bytes, conservative working1389319569bytes. No hot allocation/metric/clock/selector.

Runtime: `C:/r/isomax-nightly-runtime/node-v27.0.0-nightly20260928b59840b593-win-x64/node.exe`, V814.6.202.34-node.36, SHA256`2f2843c1802f6a17ba7fabe5550c90bb055c9bef8738a08338d94f71dbe91f29`. Intel i5-12600K. Retained inlining flags2400/9600, original startup/affinity preloads and targets file. Do not substitute the launcher's600/2400 defaults or an old memory-profile label. The wrapper below passes actual selected settings explicitly and preserves the authoritative launcher.

```powershell
./evidence/isomax-overhead-fusion-20261005/run-retained.ps1 -Name fusion-next-01
```

The launcher verifies runtime/memory/affinity and no overlapping benchmark, uses a fresh process/cold TT/all-ready barrier, writes raw source/invocation/settings/stdout/stderr/timing/cycles/RSS/cleanup evidence, and refuses an existing result name. Safety timeout600s; process exit3 means the exact solve missed the10sgoal, not an incomplete solver. Primary includes actual empty root construction and exact solving after all-ready; initialization/cleanup and whole-operation cycles separately recorded. Counts absent from hot code are unavailable, never reported as zero.

| Realization | Complete primary time | Disposition |
|---|---:|---|
| Incremental canonical support handle alone |56.628s mean; matched parent56.690s|Standalone gain unqualified|
| Eager compact TT field reuse alone |57.207s|Standalone gain unqualified|
| Handle + prepared TT fields |55.869s mean; bracketing parent56.965s|Retained pair, about1.9%|
| Binary slot rank (inverse-free) |73.409s|Rejected; fully inlined but costly|
| Constant-time membership/prefix rank |58.593s|Rejected; extra78.54MiB|
| Rank + larger19200JITbudget |58.863s vs sameflag parent56.420s|Rejected; no recovered benefit|
| Known-mover cache transport |56.051s mean vs fresh parent56.142s|Retained for simpler phase ownership; speed unqualified|
| Native compiled slot + stability planes |**53.828s mean**,53.451/54.206s|Retained; about4.3% below bracketing B3mean56.239s|
| Prebound compiled-kernel factory |54.220s|Unqualified gain; removed for added complexity|

Latest retained complete7x6 results are `fusion-c66-01`(source427f691) and`fusion-c66-02`(source2e64e4b): EXACT player0WIN/c4, all4ready/exited/pinned. Whole-operation cyclesmean763730461553vs bracketing parent790765921739.5, about3.4%lower. Initializationmean3755.3622ms vs parent2018.06095ms; extra geometry costs are secondary, not hidden. PeakRSS6903840768bytes(6.430GiB). **<=10s not achieved.** Do not add percentage improvements from different historical baselines.

Retained mechanisms are support-library-owned. C63 uses the existing recursion scalar and transports reflection once. C34 retains old cache protocol/equality and chooses prepared shared access only for compact32; native private and split shared layouts remain compatible. C65 uses the already-carried mover in absolute zero-bound transport. C66 replaces raw removal+inverse construction with geometry-only native planes, merges dense/sparse hot kernels, tests stability by nonzero(bit31), retains all first-terminal/owner/upset guards, and falls back cold when auxiliary allocation cannot fit. Generic board dimensions retain their semantics. No changes to CPC/NDC/BSFP or value/ordering/TT policies.

Rejected runtime machinery has been removed; all source revisions remain in Git with warrants, red/green/JIT/oracle evidence and raw complete solves. Reviewed retained suite: 423 passes after the supplied-plan reuse correction; generators/source/cycle catalog: 535 units pass. One fresh whole-batch review found one cold preparation/accounting defect, now corrected with failing-then-passing direct and public-session regressions; see [FINAL-REVIEW.md](FINAL-REVIEW.md). Hot runtime sources and measured candidate semantics are unchanged. Physical checks across 100 dimensions do not query sealed 3x6/5x3 WDL. Independent four-worker physical minimax (26 cases / 1,340 oracle nodes) validates after solver returns. No claim of a universal UC4A decoder or intrinsic three-branch/HVD interpretation.

Backlog remains: async publication on an actually verified E-core requires a bounded queue/seqlock/key-lifetime proof and controlled helper topology; physical-recursion/key-only reflection and make/unmake require a new transporter/undo proof; broader UC4A/CPCX action merging requires a proved value-preserving transition congruence. Geometry initialization overlap targets the secondary goal. This batch does not claim these parent ideas are exhausted or falsified by a narrower child experiment.
