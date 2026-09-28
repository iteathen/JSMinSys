# IsoMax Phase-2 result — packed private cache epoch/value tag

Date: 2026-09-28
Status: qualified whole-solve improvement; selected as new Phase-2 experimental baseline.

## Fixed source arms

A — selected compact-private baseline:

`81c9475e94607cff9e777776157b82b3466c385b`

B — packed private epoch/value tag candidate:

`f2d56c2788ef3a4c49fc4bef9d447c5be3184059`

The current experiment branch contains later benchmark-only commits; the fixed
candidate solver source is the verified SHA above.

Candidate Verify:
`36454483003` — success.

Clean post-generator Verify:
`36454494761` — success.

Post-harness Verify:
`36454641770` — success.

Qualification workflow:
`36454641968` — success.

Artifact:
`10985192878`

Digest:
`sha256:9bc48f6d091fa03355b731bf5db097d6fba2af5f3692c66762d5139eeb1fd012`

## Structural change

The private cache previously stored:
- `stamp: Uint32Array`;
- `value: Uint8Array`;
- exact identity words.

Candidate B replaces stamp+value with one uint32 tag:

```
tag = (epoch << 3) | value
```

where:
- low 3 bits carry exact W/D/L or private LOWER0/UPPER0 code 0..5;
- high 29 bits carry the per-solve epoch.

Unchanged:
- compact private key identity;
- compact shared exact identity;
- full-q locator hash;
- direct-map slot choice;
- private LOWER0/UPPER0 semantics;
- same-q opposite-bound exact draw;
- exact-row precedence;
- shared cache behavior and full sharing;
- arbitrary-geometry full-key fallback;
- search/order/CPC/cofactor logic.

Epoch wrap clears the tag array and restarts at 1.

## Correctness / accounting

Full Verify passed after authoritative behavior/root-frontier regeneration and
source resealing.

Directed tests cover:
- exact tag round-trip;
- public exact filtering of private bound codes through existing tests;
- same-q LOWER0/UPPER0 draw coalescing;
- exact-row precedence;
- stale-epoch invalidation;
- forced 29-bit epoch wrap and tag clear;
- compact and nonstandard full-key paths.

No single-worker qualification was used.

## Benchmark contract

All samples used:
- Windows GitHub runner;
- Node 26.7.0;
- 4 workers = worker 0 wide/root-frontier + workers 1..3 deep;
- rootFrontier=true;
- shared cache capacity 4,194,304;
- local cache capacity 1,048,576 per worker;
- sharedSampleMask=0;
- fixed A source `81c9475e...`;
- fixed B source `f2d56c27...`.

## Primary exact control — 353335714

Eight balanced AB/BA blocks, 16 fresh processes.

All samples completed exactly with:
- root WDL: -1;
- root move: 4.

Means:

| metric | A compact-private | B packed-tag |
|---|---:|---:|
| process cycles | 53.356 B | 52.839 B |
| wall ms | 5,662.3 | 5,763.1 |
| CPU ms | 21,814.5 | 21,574.4 |
| total nodes | 4.500 M | 4.471 M |
| winner nodes | 1.266 M | 1.258 M |
| cycles/node | 11,856.4 | 11,818.6 |
| shared hits | 518.9 K | 515.6 K |
| shared stores | 1.600 M | 1.595 M |
| contention | 43.6 K | 39.5 K |
| shared bytes | 169.54 MB | 169.54 MB |
| RSS | 266.7 MB | 266.9 MB |
| peak RSS | 438.1 MB | 434.1 MB |

Paired B versus A:
- whole-process cycles: **-0.969%**, 95% **[-1.835%, -0.102%]**;
- CPU: **-1.098%**, 95% **[-1.918%, -0.279%]**;
- wall: +1.792%, interval crosses zero;
- total nodes: **-0.655%**, 95% **[-1.089%, -0.220%]**;
- winner nodes: -0.683%, interval crosses zero;
- cycles/node: -0.318%, interval crosses zero;
- shared hits: -0.629%, interval crosses zero;
- shared stores: -0.282%, interval crosses zero;
- contention: -9.029%, interval crosses zero;
- shared bytes: unchanged;
- RSS: +0.076%, interval crosses zero;
- peak RSS: **-0.907%**, 95% **[-1.077%, -0.737%]**.

The campaign authority is completed exact whole-process cycles. The entire 95%
interval is below zero, so candidate B qualifies.

The node reduction indicates the observed whole-process effect is not merely a
metadata-accounting artifact; Lazy-SMP interleaving changed slightly in the
candidate's favor while the packed metadata also removes a separate value array
and one publication store.

## Secondary hard fixed window — 35333571

One paired block at the unchanged 120000 ms application ceiling.

Both arms timed out. No exact solve-speed ratio is admissible.

Descriptive B versus A:
- cycles +1.357%;
- wall +0.015%;
- CPU +1.310%;
- nodes +3.034%;
- shared hits +2.311%;
- shared stores +2.462%;
- contention -3.548%;
- cycles/node -1.627%;
- RSS -0.775%;
- peak RSS -1.571%.

This censored sample does not override the completed exact-control qualification.

## Disposition

Candidate

`f2d56c2788ef3a4c49fc4bef9d447c5be3184059`

replaces

`81c9475e94607cff9e777776157b82b3466c385b`

as the preferred Phase-2 experimental solver baseline.

Carry forward:
- compact shared exact identity;
- compact private exact/bound identity;
- packed private epoch/value tag;
- full-q locator hash;
- full sharing;
- private LOWER0/UPPER0;
- same-q exact-draw coalescing;
- 4-worker reduced topology = 1 wide + 3 deep.

PR #114 remains experimental/draft and is not merged by this result.
PR #84 remains draft/open and receives no merge authorization.
