# IsoMax Phase-2 result — compact private exact/bound cache

Date: 2026-09-28
Status: qualified whole-solve improvement; selected as new Phase-2 experimental baseline.

## Fixed source arms

A — selected compact-shared baseline:

`9594b6b88420d60f113cb5af560de2f128aec0da`

B — compact-shared + compact-private candidate:

`81c9475e94607cff9e777776157b82b3466c385b`

Candidate Verify:
`36446198090` — success.

Post-harness Verify:
`36446470562` — success.

Qualification workflow:
`36446470780` — success.

Artifact:
`10980893592`

Digest:
`sha256:a3f725c2a28a25b8a3ba2c53c16c7b6db83a2127501b57f24face5d638957103`

## Structural change

The already-qualified standard-7x6 compact identity is extended from the shared
exact cache into the private exact/LOWER0/UPPER0 cache.

Unchanged:
- full 14-word q search state;
- full-q locator hash and direct-map slot selection;
- compact shared exact cache from `9594b6b...`;
- exact W/D/L values;
- private LOWER0/UPPER0 codes;
- same-q opposite-bound exact-draw coalescing;
- exact rows outrank weak bounds;
- non-7x6 full-key fallback;
- full shared density.

Selected 7x6 private rows store 8 exact uint32 identity words instead of 14.
The first two support heights remain raw discriminators. Compact support/tail
packing is evaluated only after an occupied private slot reaches the compact
comparison path.

At local cache capacity 1,048,576 this removes 24 MiB of private key storage per
worker, or 96 MiB across the required four-worker benchmark topology.

## Correctness / accounting

Verify passed:
- schema;
- Node compatibility;
- generated behavior/root-frontier freshness;
- runtime-geometry audit;
- add-on/NEES source-blob coverage;
- directed standard-7x6 compact hit/collision rejection;
- opposite LOWER0/UPPER0 same-q exact-draw coalescing;
- exact-row precedence over weak bounds;
- nonstandard-geometry full-key fallback.

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
- fixed A source `9594b6b...`;
- fixed B source `81c9475e...`.

## Primary exact control — 353335714

Eight balanced AB/BA blocks, 16 fresh processes.

All samples completed exactly with:
- root WDL: -1;
- root move: 4.

Means:

| metric | A compact-shared | B compact-private |
|---|---:|---:|
| process cycles | 54.638 B | 53.651 B |
| wall ms | 5,842.6 | 5,808.1 |
| CPU ms | 22,336.4 | 21,970.9 |
| total nodes | 4.518 M | 4.484 M |
| cycles/node | 12,092.1 | 11,965.7 |
| shared hits | 519.3 K | 518.7 K |
| shared stores | 1.599 M | 1.594 M |
| shared contention | 43.9 K | 42.4 K |
| RSS | 267.1 MB | 267.2 MB |
| peak RSS | 516.4 MB | 438.4 MB |

Paired B versus A:
- whole-process cycles: **-1.807%**, 95% **[-2.545%, -1.069%]**;
- CPU: **-1.637%**, [-2.418%, -0.856%];
- wall: -0.603%, interval [-2.007%, +0.801%];
- total nodes: **-0.771%**, [-1.080%, -0.462%];
- cycles/node: **-1.045%**, [-1.661%, -0.429%];
- shared hits: -0.129%, interval crosses zero;
- shared stores: **-0.297%**, [-0.438%, -0.156%];
- shared contention: -3.424%, interval crosses zero;
- shared bytes: unchanged, as expected;
- RSS: +0.047%, interval crosses zero;
- peak RSS: **-15.100%**, [-15.226%, -14.974%].

The primary campaign authority is whole-process cycles, so the candidate
qualifies. The node decrease also shows the effect is not merely accounting or
memory footprint noise.

## Secondary hard fixed window — 35333571

One paired block at the unchanged 120000 ms application ceiling.

Both arms timed out. No exact solve-speed ratio is admissible.

Descriptive B versus A:
- cycles +0.155%;
- wall -0.017%;
- CPU +0.108%;
- nodes +2.149%;
- cycles/node -1.953%;
- peak RSS -17.651%.

This censored sample does not override the completed exact qualification.

## Disposition

Candidate `81c9475e94607cff9e777776157b82b3466c385b` replaces
`9594b6b88420d60f113cb5af560de2f128aec0da` as the preferred Phase-2
experimental solver baseline.

Carry forward:
- compact shared exact identity;
- compact private exact/bound identity;
- full-q locator hash;
- full sharing;
- private LOWER0/UPPER0;
- same-q exact-draw coalescing;
- 4-worker reduced topology = 1 wide + 3 deep.

PR #111 remains experimental/draft and is not merged by this result.
PR #84 remains draft/open and receives no merge authorization.
