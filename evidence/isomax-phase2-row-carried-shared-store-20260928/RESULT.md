# IsoMax Phase-2 result — row-carried shared exact publication

Date: 2026-09-28
Status: rejected as a whole-solve optimization; retain `81c9475e...`.

## Fixed source arms

A — selected compact-private baseline:

`81c9475e94607cff9e777776157b82b3466c385b`

B — row-carried shared-publication candidate:

`34aa03a970ffedda619bd38e5163ec86bd55e18c`

Implementation source:
`da3a78d304eebd312839de115bcc1ead8bcc5c97`.

Candidate Verify:
`36448865089` — success.

Qualification workflow:
`36449060350` — success.

Artifact:
`10982660819`

Digest:
`sha256:cce3baf62e0ac30b0049605ef32486f308280121a3d51bbacea1c849d6ed3cc1`

## Candidate

For an admitted shared exact store, B copies the exact identity row already
materialized in the private cache instead of re-reading q and reconstructing the
same compact standard-7x6 identity.

Unchanged:
- full 14-word q state;
- full-q locator hash and direct-map slot;
- private compact exact/LOWER0/UPPER0 cache;
- compact shared exact identity;
- shared exact-only semantics;
- sequence/CAS publication protocol;
- full sharing;
- same-q opposite-bound exact-draw coalescing;
- arbitrary-geometry full-key fallback.

Preparation rejects mismatched private/shared row layouts before search.
Compatibility q-based shared APIs remain unchanged.

## Correctness and accounting

Final Verify passed:
- 173/173 tests;
- schema;
- Node compatibility;
- behavior generator --check;
- root-frontier generator --check;
- root-frontier audit;
- runtime-geometry audit;
- add-on/NEES catalog coverage with 160 decomposed units.

The first Verify attempt failed only because two test fixtures created standard
shared caches without their initialized geometry contract. The fixture-only
correction then passed the complete rerun.

## Exact derived-long — 353335714

Eight balanced AB/BA blocks, 16 fresh processes.
All samples completed exactly with root WDL -1 / move 4.

Means:

| metric | A baseline | B row-carried |
|---|---:|---:|
| process cycles | 42.598 B | 42.755 B |
| wall ms | 4,894.3 | 4,832.9 |
| CPU ms | 16,359.3 | 16,478.4 |
| total nodes | 4.432 M | 4.450 M |
| winner nodes | 1.242 M | 1.248 M |
| shared hits | 501.1 K | 505.9 K |
| shared stores | 1.574 M | 1.582 M |
| contention | 42.9 K | 43.0 K |
| cycles/node | 9,612.5 | 9,608.9 |
| shared bytes | 169.54 MB | 169.54 MB |
| RSS | 267.0 MB | 266.6 MB |
| peak RSS | 438.1 MB | 438.3 MB |

Paired B versus A:
- whole-process cycles: **+0.385%**, 95% **[-0.537%, +1.307%]**;
- wall: -0.776%, interval crosses zero;
- CPU: +0.760%, interval crosses zero;
- nodes: +0.426%, interval crosses zero;
- winner nodes: +0.523%, interval crosses zero;
- shared hits: +0.976%, interval crosses zero;
- shared stores: +0.478%, interval crosses zero;
- contention: +2.982%, interval crosses zero;
- cycles/node: **-0.033%**, interval **[-0.747%, +0.681%]**;
- shared bytes: unchanged;
- RSS: -0.161%, interval crosses zero;
- peak RSS: +0.048%, interval crosses zero.

The completed exact whole-process-cycle interval crosses zero and the mean is
slower. No promotion is admissible.

The intended primitive saving is therefore too small relative to Lazy-SMP
interleaving/search-path variance to establish a whole-solve benefit. Reusing
the private row also did not measurably improve cycles/node.

## Official hard fixed window — 35333571

One paired block at the unchanged 120000 ms ceiling.

Both arms timed out. No exact solve-speed ratio is admissible.

Descriptive B versus A:
- cycles +2.890%;
- wall +0.004%;
- CPU +3.072%;
- nodes +2.356%;
- shared hits +1.501%;
- shared stores +4.276%;
- contention +24.961%;
- cycles/node +0.522%;
- peak RSS +0.200%.

This censored sample is directionally unfavorable but is not exact ranking
evidence.

## Disposition

Reject row-carried shared publication from the preferred path.

Retain selected solver source:

`81c9475e94607cff9e777776157b82b3466c385b`

Do not alter:
- compact shared identity;
- compact private identity;
- full-q locator hash;
- full sharing;
- private LOWER0/UPPER0;
- same-q exact-draw coalescing.

The experiment remains useful as a falsifier: eliminating the second compact
construction on shared stores does not establish a measurable completed-tree
whole-process-cycle gain.

PR #112 should remain unmerged/closed as rejected evidence.
PR #84 remains draft/open and receives no merge authorization.
