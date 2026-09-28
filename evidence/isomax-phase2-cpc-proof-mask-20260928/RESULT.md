# CPC six-state proof mask: local representation rejected

2026-09-28. Disposition: **CPC_PROOF_MASK_REJECTED_LOCAL_WHOLE_SOLVE**.
The six-state algebra remains exact; this realization did not establish a
completed-solve cycle improvement. The interval includes improvement and
regression, so this is not proof that every mask realization is slower.

Selected continuation remains `be7c2887defcefb37080fa61de7ce1dc38dc2990`.
No production or experimental solver promotion is authorized by this result.

## Fixed sources and gates

- A: `be7c2887defcefb37080fa61de7ce1dc38dc2990` (selected packed rows + accounting repair).
- B: `7f74e324457c4237590bc6b0f924852f6d728e4c` (CPC proof mask).
- Preserved RED: `b4b1495f2ff403441e974456062d65ecf22e427e`, Verify36461231312.
- GREEN normal Verify: [36464380804](https://github.com/iteathen/JSMinSys/actions/runs/36464380804), all three jobs passed.
- Local180/180 correctness tests; catalog/source seals, authoritative generators,
  frontier/geometry audits, schema,80-module syntax and both CI smoke scripts passed.
- Independent review found and resolved CPC traffic undercounting before timing.
- Differential24757 evaluations matched the original baseline CPC proof/kind
  and all other scratch state on4x4/7x6/8x5, with both advisory/frontier options.
- Raw16-sample checkpoint: `36022ca`; harness/environment checkpoint: `c6e2fda`.

## Local protocol and environment

Windows11Pro10.0.26200, Intel Core i5-12600K,10 physical cores/16 logical,
34088599552 bytes RAM, Balanced power plan. Node26.7.0,
V8 14.6.202.34-node.28. Exact hardware/runtime record: `environment.json`.
No qualification Node process was running before or after the test.

Eight alternating AB/BA pairs,16 fresh processes on353335714. Four workers:
worker0 wide/root-frontier and workers1..3 deep Lazy SMP. rootFrontier=true;
shared4194304, private1048576 each, sharedSampleMask=0. No strategist, affinity
change, answer prior, cache-size change or hot instrumentation. Both fixed
worktrees were clean and checked before every sample.

Whole-process Windows QueryProcessCycleTime across all host/worker threads is
primary; wall is secondary. The bracket matches the existing Phase-2 source
runner and includes startup/search/completion/cleanup. Local16-logical-processor
measurements are a separate population from the hosted4-logical-processor runs.
No frequency-derived cycle estimate or mixed-denominator comparison is used.

Primary application ceiling90000ms follows the established primary exact runner.
The secondary hard ceiling120000ms was not changed. No hard or independent hosted
performance run was launched after this non-promising local result. Hosted Verify
is correctness evidence, not a hosted performance qualification.

## Results

All16EXACT, rootWdl=-1 and move=4 in runner numbering. All four workers performed
work, exited, reported cleanup=true and no errors. A always selected winner2;
B selected winner1 or2. Parallel node variations reflect schedule/cache
interactions and do not by themselves imply a semantic change.

| Metric | A arithmetic mean | B arithmetic mean | Mean paired delta | Descriptive paired95% interval |
|---|---:|---:|---:|---:|
| Whole-process solve cycles | 38229389027.5 | 38539189725 | +0.832% | [-1.228%, +2.892%] |
| Wall ms | 2470.924 | 2493.592 | +0.943% | [-1.251%, +3.137%] |
| CPU ms | 10347.875 | 10430.125 | +0.823% | [-1.583%, +3.229%] |
| All-worker nodes | 4579350.875 | 4597133.375 | +0.393% | [-0.232%, +1.017%] |
| Winner nodes | 1270081.875 | 1268720.375 | -0.104% | [-1.753%, +1.545%] |
| Shared hits | 521170.5 | 523155.625 | +0.398% | [-1.035%, +1.830%] |
| Shared stores | 1608853.125 | 1605811.75 | -0.187% | [-0.667%, +0.292%] |
| Store contention | 45122.125 | 44297.125 | -1.054% | [-11.537%, +9.428%] |
| Cycles/node | 8349.454 | 8383.560 | +0.445% | [-1.790%, +2.680%] |
| Peak RSS bytes | 436716032 | 436928000 | +0.049% | [-0.029%, +0.126%] |

Intervals use Student t(df7) on eight within-pair B/A ratios; all ratios are in
`local-exact/summary.json`. Mean paired delta is not the ratio of arm means.
Mean per-worker nodes:
A=[756472.625,1260931.5,1270081.875,1291864.875];
B=[777825.125,1268248.5,1260687.25,1290372.5].
Shared footprint169539109 bytes in both arms. Every source SHA, configuration,
worker timing, start skew, frontier metric, node/cache metric, cycle count,
stdout/stderr and cleanup record is preserved in `local-exact/`.

## Interpretation and preserved findings

This replaces CPC's two uint32 endpoints with a local3-bit mask and one published
byte, then decodes a constant nibble at search consumption. It does not change
CPC rules, move ordering, cache codes or weak-bound publication. It adds no
close-only fusion. A smaller proof carrier and fewer stores are not sufficient
to establish a whole-solve benefit. Decode/control/JIT costs are plausible
offsets but were not causally isolated by this run.

Do not tune this result until it becomes favorable, pool it with other
representations, discard unfavorable pairs or infer an empty-board speed ratio.
Close PR118 as an unqualified runtime experiment while preserving branch/evidence.
Retain six-state semantic research and the selected baseline's K/STOP_TEST fix.

The candidate review exposed inherited direct CPC ledger undercounts. Candidate
accounting now has explicit mandatory resets, advisory-reset versus collection
paths, forced-action stores and one proof publication. The corrected mask ledger
cannot be copied wholesale into the selected interval solver: that owner needs
its own interval-specific recount. This is an accounting finding, not a measured
performance improvement. No source ledger is claimed as exact Intel instructions.

## Reproduction and integrity

```text
node experiments/isomax-phase2/cpc-proof-mask-source-ab.mjs <new-output-directory> <clean-A-worktree> <clean-B-worktree> 353335714 8 90000
node evidence/isomax-phase2-cpc-proof-mask-20260928/differential.mjs
```

Use Node26.7.0 on Windows with FFI available; the controller enables
--experimental-ffi in fresh children. `artifact-manifest.json` hashes committed
Git blob bytes to avoid checkout CRLF differences. No cumulative50% completion
claim is made.
