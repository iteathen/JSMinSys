# 32-byte shared TT: saves memory, speed improvement not established

**Superseded implementation:** the subsequent NEES audit found boxed full-size
byte indices that this qualification missed. The repair and new matched results
are in `../isomax-tt-half-confirm-20261002/REPORT.md`. The observations below remain
the historical first-candidate results, not the final TT disposition.

The candidate reduces the standard 7x6 shared TT entry from 40 to 32 bytes with
native narrow atomic fields and **no new key encoding or decoding**. Same entry
capacity, exact key identity, full-width sequence counter, value and publication
order. Shared allocation falls from 5 GiB to 4 GiB. Private TT is unchanged.

Eight scored runs (four per version, ABBA BAAB) measured **38.564 s baseline →
39.051 s candidate mean**, nominally **1.261% slower** with **0.982% more process
cycles**. Paired uncertainty crosses zero. Retain this as a memory-saving
experimental candidate, not a proven speed optimization or main promotion.

The frozen production main remains `e76e9ab3ca0e7a292badf9d9ac38a811d7971c99`.
Baseline runtime: `cbc4ddf995be83334ea26190c749028435e353fa`.
Candidate runtime: `4d1158a60b7ecc00aec5e1e185aa7696a7cb3934`.
Controller: `d38cf6506bca2bee4f1f7c872fcc45aaf20f7fbe`.
Later changes add qualification/evidence only; no measured runtime edits.

## What changed and why

The previous compact key already packed support and the coordinate tails, but
stored two three-bit heights in full words. The new record is:

| Byte range | Field | Access |
| --- | --- | --- |
| 0–3 | Sequence counter | Uint32 atomic |
| 4–7 | Existing packed support | Uint32 atomic |
| 8–23 | Four full coordinate words | Uint32 atomic |
| 24–25 | Existing ten-bit packed tail | Uint16 atomic |
| 26, 27 | First two column heights | Uint8 atomic each |
| 28–31 | Exact value | Uint32 atomic |

These ranges do not overlap. Views share one backing allocation; memory reporting
counts that allocation once. Worker initialization reconstructs views after
structured clone without allocating another backing table. There is no new
compression helper, unpacking, truncated hash, or loss of gray-owner equivalence.
The same number of logical key fields is compared. Narrow-view addressing adds
different address calculations and view accesses; zero encoding does not mean
zero machine-instruction change.

The 32-byte stride allows better cache-line alignment, but JS does not guarantee
the physical backing address is aligned to 64 bytes. This experiment did not
measure that address or claim every record occupies one physical cache line.
A 28-byte design was not added: it would require further packing or changing
the retained full-width fields, contrary to this experiment's constraints.

Initialization derives a layout from prepared dimensions. The 7x6 specialization
uses the above record; other dimensions use direct coordinates/meta and native
8/16/32-bit heights, with a cold accessor selection and a stride rounded to 32
bytes. Generic padding is not asserted to minimize space for every geometry.
The general TT layer is tested across several geometries; **the existing lean
solver remains a 7x6 specialization**. Its wider-board integration is not claimed.
Production's variable-size solver/cache remain unchanged.

## Complete timings

One candidate warm-up (38.271 s) was excluded as declared in
`experiments/isomax-tt-layout/PLAN.md`. No scored samples were discarded.

| Run | Entry | Wall seconds | Process cycles |
| --- | ---: | ---: | ---: |
| 1 | 40 B | 39.425716 | 546247611722 |
| 2 | 32 B | 39.702649 | 549424171000 |
| 3 | 32 B | 39.654855 | 550888089573 |
| 4 | 40 B | 38.808138 | 540405614065 |
| 5 | 32 B | 39.355670 | 547258300471 |
| 6 | 40 B | 38.325840 | 537287442541 |
| 7 | 40 B | 37.698210 | 532991992200 |
| 8 | 32 B | 37.489621 | 530548430195 |

Candidate mean cycles: 544529747809.75; baseline: 539233165132.
Three of four matched pairs favored baseline. Descriptive 95% t intervals on
four pair log ratios span **3.618% slower to 1.070% faster** for wall time and
**2.813% more to 0.830% fewer cycles**. These are small-sample, one-host intervals
with independence/normality assumptions. The downward timing drift is visible;
no frequency/background-load isolation or universal speed claim is made.

Largest scored peak RSS: baseline 7904985088 bytes (about 7.36 GiB), candidate
6832218112 bytes (about 6.36 GiB). The footprint reduction is established;
the latency benefit is not. Do not add these results to earlier speedups or
compare isolated minima across campaigns.

## Runtime and operation

- Intel Core i5-12600K; four deep workers, no wide worker.
- Original Node v27.0.0-nightly20260928b59840b593, V8 14.6.202.34-node.36.
- Original affinity preload/targets; actual P-core logical 0/2/4/6 verified for
  every scored invocation. No intentional runtime or affinity deviation.
- Shared capacity 134217728 entries: 40 B → 32 B, deliberately 5 GiB → 4 GiB.
  This is equal-capacity, **not equal-byte-budget**, comparison.
- Private capacity 16777216, 576 MiB per worker; rootFrontier false;
  sharedSampleMask zero; 300-second per-solve safety timeout.
- All seven structural controls passed; five moves computed without search;
  exactly one search starts at ply 6 from `44444` in every scored run.
- All returned EXACT, root WDL +1, column 4; four workers exited with no errors.
- All eight finished under 60 seconds. This is the established structural-prefix
  plus one-root-solve test, **not complete self-play**. Timing includes structural
  work, host allocation/worker startup, search and cleanup. Lifecycle unchanged.
- Node counts/TT hit counters remain unavailable; no hot-loop reporting added.

## Correctness and compiler checks

202 tests pass on Node 26.7.0, including full logical TT equality after deterministic
solves, all worker orders/reflections, gray-owner reuse, collisions, cancellation,
and concurrent publication. Fifteen focused tests pass on the benchmark runtime.
New tests cover multiple widths/heights, high/low coordinate bits, each height,
nonzero key offsets, rollover and native-height boundaries 255/256/65535/65536.
The two largest boundary cases use exact geometry layout facts to test TT fields;
they do not enumerate enormous shape tables or claim large-board solving.

Full-size qualification on the nightly runtime confirms the 4-GiB backing and
two-way parent/worker publication at its last record. Its cloned Uint32 view
initially has length zero; cold attachment restores length 1073741824 over the
same backing. Qualification logs are in the adjacent
`isomax-tt-layout-qualification-20261002` directory.

Post-timing actual-solver JIT diagnostics show the shared probe and store inline
into their callers for both revisions. This rules out the particular previous
unrolled-helper inlining failure on these diagnostic fixtures. It does not
establish equal instruction counts or identify the cause of nominal slowdown.
Compiler diagnostics use small-cache fixtures and are not scored timing data.

Read-only review at candidate 4d1158a found no blocking correctness issue. Its
height-boundary/test-wording findings were addressed with additional tests.
Generator, catalog, behavior/frontier generation, geometry and transitive
hot-loop checks pass. No production `addons/`, `src/`, CPC or BSFP changes.
No branch CI run was triggered (workflow runs on main/PR); these are local checks.

Raw traces/settings/affinity are preserved in `samples.jsonl`, `raw.jsonl`,
`manifest.json`, and affinity files. `SUMMARY.json` is written only after all
result/source/cleanup/affinity gates pass; `BLOCK_ANALYSIS.json` verifies it.
