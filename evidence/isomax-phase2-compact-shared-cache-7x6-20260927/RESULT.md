# IsoMax Phase-2 result — compact exact shared cache

Date: 2026-09-28
Status: qualified whole-solve improvement; selected as new Phase-2 experimental baseline.

## Fixed source arms

A — previous preferred pure coalesced known-hash solver:

`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

B — verified compact shared-cache candidate:

`9594b6b88420d60f113cb5af560de2f128aec0da`

Candidate Verify:
`36405205784` — success.

The candidate changes only the shared exact-cache representation for the
initialization-qualified standard geometry. Private q and private cache semantics
remain unchanged. The already-computed full-q hash remains the direct-map
locator. Shared equality remains exact.

For the selected 7x6 geometry the shared exact identity is losslessly compacted
from 14 uint32 words to 8:
- support columns 0 and 1 remain raw;
- remaining support plus terminal bits are packed;
- rank is omitted because rank=sum(support heights);
- complete coordinate words remain exact;
- the two five-bit coordinate tails are packed together.

All nonmatching initialized geometries retain the original full-key shared path.

## Verification and runtime-geometry gate

Initial fixed-geometry source was rejected by the repository runtime-geometry
audit. That audit was not weakened.

The corrected implementation moved the decision behind the initialized geometry
contract and retained the general fallback. Head `9594b6b...` passed full
Verify, schema and Node compatibility in workflow `36405205784`.

The lossless identity itself had already qualified across 1x1, 3x3, 4x4, 5x4,
6x5, 7x6, 8x7, 4x7, 9x5 and 10x10 geometries.

## Benchmark contract

All qualification processes used:
- Windows GitHub runner;
- Node 26.7.0;
- 4 workers = worker 0 wide/root-frontier + workers 1..3 deep;
- rootFrontier=true;
- shared cache capacity 4,194,304;
- local cache capacity 1,048,576 per worker;
- full sharing / sharedSampleMask=0;
- fixed A source `f549dcf...`;
- fixed B source `9594b6b...`.

Successive benchmark-harness commits launched four independent workflows before
the first outcome was inspected. All four used the same fixed solver source
SHAs and protocol, so all pre-outcome evidence is retained.

Artifacts:

| workflow | artifact | digest |
|---|---:|---|
| 36405382433 | 10962710633 | sha256:5624b28f58b5da2e72fef18605d2b16c004dc1f7605959bcbaab2ff90008cd4e |
| 36405407193 | 10962491961 | sha256:b1d427665837dce8d709601fdf699751d33a9c02296f0168794ec393fb9cd8f4 |
| 36405435792 | 10962611458 | sha256:1a04990e8561841f7e4fdd6c247f113bd2c4fcb009ad5a1cb0e3bd4572afc7cd |
| 36405435878 | 10962651064 | sha256:db32ba714286b42d3bfb26ff7ff9b70a5e6bcf5a24f8020d080d527eca00cb80 |

## Primary exact control — 353335714

Each workflow ran eight balanced AB/BA blocks.

All 64 fresh processes completed exactly with:
- root WDL: -1;
- root move: 4.

Per-workflow paired whole-process-cycle results:

| workflow | delta | 95% interval |
|---|---:|---:|
| 36405382433 | -1.725% | [-2.598%, -0.852%] |
| 36405407193 | -1.997% | [-3.121%, -0.872%] |
| 36405435792 | -1.936% | [-3.005%, -0.867%] |
| 36405435878 | -2.034% | [-3.184%, -0.885%] |

Every independently launched workflow therefore qualifies the candidate by the
Phase-2 primary authority.

Pooled across all 32 paired blocks:

- whole-process cycles: **-1.923%**, 95% **[-2.360%, -1.486%]**;
- CPU: **-1.945%**, [-2.402%, -1.488%];
- wall: **-1.247%**, [-2.251%, -0.243%];
- total nodes: **-0.549%**, [-0.782%, -0.317%];
- cycles/node: **-1.382%**, [-1.740%, -1.023%];
- shared hits: -0.034%, [-0.370%, +0.302%];
- shared stores: +0.019%, [-0.148%, +0.187%];
- shared-store contention: **-8.766%**, [-11.467%, -6.066%];
- shared bytes: **-37.255%** exactly;
- RSS: **-27.373%**, [-27.438%, -27.308%];
- process peak RSS: **-16.279%**, [-16.321%, -16.237%].

Pooled raw means:
- A cycles: 46.741 B;
- B cycles: 45.847 B;
- A nodes: 4.555 M;
- B nodes: 4.530 M;
- A shared bytes: 270,202,405;
- B shared bytes: 169,539,109;
- A RSS: 367.5 MB;
- B RSS: 266.9 MB.

The effect is therefore not merely a memory result. It establishes a completed
exact-tree whole-process-cycle improvement.

## Secondary hard fixture — 35333571

The hard-window evidence is runner-sensitive.

Of four paired workflows:
- three pairs were censored because both arms reached the 120000 ms application
  ceiling;
- one pair completed exactly in both arms, preserving WDL -1 / move 4.

The completed pair favored B by 3.539% whole-process cycles, but one pair does
not supply a confidence interval and the three censored pairs are not converted
to exact solve-speed ratios.

Fixed-window descriptive deltas in the censored runs ranged from +3.315% to
-7.559% cycles. This secondary evidence does not override the completed
32-block exact-control qualification.

## Disposition

Candidate `9594b6b88420d60f113cb5af560de2f128aec0da` replaces
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862` as the preferred Phase-2
experimental baseline for subsequent optimization experiments.

Retain:
- exact compact shared identity;
- full shared density;
- full-q known-hash locator reuse;
- local private LOWER0/UPPER0;
- exact same-q coalescing;
- 4-worker reduced benchmark topology = 1 wide + 3 deep.

Do not infer that the compact path should replace arbitrary-geometry full-key
storage without a separately generated compact layout for that geometry.

PR #110 remains an experimental draft and is not merged by this result.
PR #84 remains draft/open and receives no merge authorization from this result.
