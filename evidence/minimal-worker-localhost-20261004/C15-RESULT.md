# E-core asynchronous publication: not retained

The optional-offload idea is sound, but these three implementations do not improve the governing total-machine-cost objective. All eight initial complete empty-board solves returned EXACT +1 / c4, with no error, verified search affinity0/2/4/6, and clean worker exits. Helper controls/variants additionally obtained E-coreCPU12 and five exits. No RLC or supplied opening. Ninth final restored control follows separately to check drift.

| Configuration | Full runs | Mean ready-empty solve ms | Mean entire-operation cycles |
|---|---:|---:|---:|
| No helper, mask85 | 1 | 155753.8021 | 2215612741292 |
| Idle helper, mask4181 | 1 | 155613.9262 | 2213038085536 |
| C15 async publication | 2 | 153872.0439 | 2577904217653 |
| C15b helper full-entry dedup | 2 | 152358.7875 | 2492034932169.5 |
| C15c changed-word atomic stores | 2 | 152277.2990 | 2440736143518.5 |

C15c is about2.23% faster than the initial no-helper control, at10.16% more cycles. Dedup/changed-word variants reduce helper cost but do not eliminate the unfavorable total-cost trade. No <=10s result. Small wall differences are bounded observations, not statistical/universal speed claims.

Configuration stayed134217728 shared entries/5GiB;33554432 private entries/1056MiB per search worker; four center/live/center/live search workers; rootFrontierfalse; sharedSampleMask0; exact pinned Node27 nightly/V8 runtime and inline600/cumulative2400 flags. Helper variants added10,486,276 queue bytes and one initialized E-core worker, no hot reporting. Full effective CLI/environment, source commit, runtime hash, affinity, OS memory and cleanup are in each run directory. Initialization about1.1–1.25s and cleanup about50ms are separate from primary wall; cycle counts include them and all helper CPU. Native node/shared counters remain unavailable rather than adding hot measurement overhead.

Correctness: independent physical-board minimax24 cases per candidate, including compact7x6 and generic7x5; correlated full-key concurrency/invalid-hybrid probes; rollover/full/drop/batch snapshot checks; host readiness/timeout/cleanup and affinity tests; separate code reviews; NEES source/cost inventory and generated-source verification. C15c test-only interception proves unchanged payload words are not written; that interception never enters benchmark runtime.

Preserved source checkpoints: C15 `43447f9`, C15b `031d643`, C15c `0647166`; final C15c source plus all eight runs at `1d36958`. Restore active solver/library/host/affinity/runner/catalog/test paths exactly to retained `a566296`; do not reset history. No production CPC/NDC/BSFP changes. Rejected async modules/tests removed from active execution tree; evidence remains. For reproducing candidates use the frozen commit, not the restored current tree.

The old external-measure wrapper's raw `performance_conclusion_allowed:false` field is inherited suite metadata; this campaign's explicitly authorized localhost protocol and completed exact runs govern these dispositions. Raw records are preserved without rewriting that field. Exit3 means exact solve exceeded10s target, not a timeout or solver failure.

This rejects the measured publication realizations for total-cost retention, not E-core offloading generally. More promising work must remove repeated computation or produce reusable optional data, and retain synchronous fallback when results are unavailable. The separate C16 support-plan/handle draft attacks the larger measured reconstruction surface; it remains unimplemented and unqualified. CUDA-JS remains parked.
