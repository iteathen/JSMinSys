# Initialization-selected TT and solver: completed qualification

The public host now accepts prepared board dimensions and selects the complete
solver/worker/TT combination before search. This repairs the earlier incomplete
claim in which only the TT factory supported nonstandard dimensions.

The measured 7x6 result is **20% less shared TT memory with essentially unchanged
time**. Eight scored runs passed. A small nominal speed difference is within the
paired uncertainty and is not promoted as an established speedup.

| Measure | A: 40-byte reference | B: initialized 32-byte candidate |
| --- | ---: | ---: |
| Mean complete interval | 37,364.5604 ms | 37,211.10975 ms |
| Mean process cycles | 528,603,752,416.75 | 526,838,805,164.75 |
| Peak RSS, maximum across runs | 7.362873 GiB | 6.362946 GiB |
| Shared TT bytes | 5,368,709,120 | 4,294,967,296 |
| Shared TT entries | 134,217,728 | 134,217,728 |
| Private cache per worker | 576 MiB | 576 MiB |

Mean wall difference: 0.410685% lower; mean cycles: 0.333889% lower. Four paired
log-ratio blocks give a descriptive 95% wall-improvement interval of
[-0.479207%, 1.292224%], and cycles [-0.456785%, 1.118203%]. Both cross zero.
Three pairs favored B, one favored A. One host and four pairs cannot establish
universal performance. The deterministic storage reduction is the solid result.

## Exact versions and environment

- A runtime: cbc4ddf995be83334ea26190c749028435e353fa.
- B runtime: 302ebcd91bca13e76cc8d1b0de25631b5e768af4.
- Controller: 8320e8584994cf5d0a8b3545d0f022eca8950de7.
- Protocol: `../../../experiments/isomax-tt-layout/INITIALIZATION_PROTOCOL.md`.
- Node v27.0.0-nightly20260928b59840b593, V8 14.6.202.34-node.36.
- Intel Core i5-12600K, Windows 10.0.26200, reported RAM 34,088,599,552 bytes.
- Four deep workers; no wide worker; sharedSampleMask=0; 300-second ceiling.
- All 32 worker reports confirm historical affinity targets 0/2/4/6, group 0.
- No observed runtime, hardware or placement deviation. Shared allocation is
  intentionally smaller at identical entry count, not a cache-capacity change.

## Every scored sample

| Index | Arm | Wall ms | Process cycles | Peak RSS bytes |
| --- | --- | ---: | ---: | ---: |
| 0 | A | 37194.7323 | 526324731237 | 7905087488 |
| 1 | B | 37109.2628 | 525838350204 | 6831276032 |
| 2 | B | 37070.0916 | 524260911058 | 6831689728 |
| 3 | A | 37456.2907 | 528946733777 | 7905824768 |
| 4 | B | 37349.2632 | 528693702443 | 6832160768 |
| 5 | A | 37249.9814 | 527507807315 | 7903756288 |
| 6 | A | 37557.2372 | 531635737338 | 7905198080 |
| 7 | B | 37315.8214 | 528562256954 | 6831300608 |

One unscored B warm-up: 37177.578 ms, preserved in
`../isomax-tt-init-warmup-20261002/`; excluded from the table and inference.
No samples were rejected or replaced. Raw, machine-readable records are
`raw.jsonl`, `samples.jsonl`, `manifest.json`, `SUMMARY.json`, and
`BLOCK_ANALYSIS.json`, plus each actual affinity report.

All seven pre-search controls passed in each sample. The first five moves were
computed by the structural calculator with no search. The actual search root
was 44444, first search ply 6, exactly one search, EXACT WDL +1, returned c4.
All eight intervals were under 60 seconds, with clean termination and four worker
exits. This interval includes structural calculation, solver/worker preparation,
one search and cleanup. It is not a self-play game-to-terminal measurement.
Node counts and TT hit statistics remain unavailable: no reporting was restored
to the hot loop. Process cycles/CPU/RSS are collected externally.

## Correctness and hot-path audit

217/217 full tests passed; 30/30 focused tests passed on the measured Node
nightly. Actual public-host worker solves cover twelve configurations, including
12 variable-dimension cases (4x4, 4x5, 5x4, 8x4, 4x8, 8x6, 7x5, 33x1, 1x256,
1x1, 2x3, 3x3), in addition to existing 7x6 coverage.

Independent physical-board minimax, reference move ordering, private keys/tags,
logical shared keys/values/sequence, reflection, CPC guard behavior, cancellation
and cleanup all agree. Sealed formula-holdout boards were excluded.

The standard solver, worker, CPC, TT accessors, coordinates and fixed operations
are byte-identical after newline normalization to the earlier repaired 32-byte
runtime 4e7af0e74b82b6bb70fef94a211196b4235a4039. There is no added dimension
dispatch, codec, callback, statistic or allocation inside that hot path.

Review found and resolved a valid tiny-board initialization failure, unnecessary
wide-board mask work, and a legal-move assertion gap. A final coverage refinement
executes unpacked recursive ordering on both normal and wide boards: 9 observed
prepared rows for 4x4 and 32 for 33x1. Observation uses prefilled test-owned
buffers inspected after solving, not runtime counters. These tests were expanded
after measurement; the measured runtime files did not change. Final outputs:
`../isomax-init-integration-20261002/full-suite-final.txt` and
`../isomax-init-integration-20261002/nightly-tests-final.txt`.

General configurations retain dimension-driven key, hash and live-line loops.
Their correctness is qualified; full-size latency, additional unrolling choices,
and very large generic atomic-index domains are not performance-qualified.
These are explicit optimization limits, not a claim that every remaining loop
is unavoidable. Cold profile selection adds no general per-node layout dispatch.

Production CPC, BSFP, search semantics, ordering and worker topology are unchanged.
Main remains e76e9ab3ca0e7a292badf9d9ac38a811d7971c99; this is committed candidate
evidence on `codex/isomax-init-tt-layout-20261002`, not a promotion.
