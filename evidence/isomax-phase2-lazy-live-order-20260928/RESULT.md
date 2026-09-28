# IsoMax Phase-2 result — exact lazy live-line ordering

Date: 2026-09-28
Status: rejected as a whole-solve optimization; retain `81c9475e...`.

## Fixed source arms

A — selected compact-private baseline:

`81c9475e94607cff9e777776157b82b3466c385b`

B — exact lazy live-line ordering candidate:

`698a1b583d652d88650f0ab85808b52a9ed7236b`

The candidate source differs from verified solver source `dc689c36...` only by
removal of the one-shot generation workflow. Solver/add-on sources and the
resealed ledger are unchanged.

Verify:
`36452405679` — success.

Qualification workflow:
`36452561359` — success.

Artifact:
`10983604904`

Digest:
`sha256:f2f2ad419a5553cc77da078caedb817fcf160d53d2c9bb080cc22e930eb2f725`

## Candidate

The existing eager stable live-line ordering was kept semantically identical but
materialized lazily.

For each prepared cell:

```
maxScore[cell] = popcount(through[cell])
```

is an exact upper bound on dynamic live-line contribution. Candidate B:
- keeps surviving actions in existing prepared tie order;
- caches dynamic scores per recursion depth;
- skips an unevaluated candidate during a selection pass when its static upper
  bound cannot exceed the best exact score already observed;
- uses strict-greater selection, preserving stable equal-score tie order;
- never constructs a child/cofactor transition for ordering;
- never changes cache, zero-bound, sharing or value semantics.

Full Verify passed after authoritative behavior/root-frontier regeneration.

## Primary exact control — 353335714

Eight balanced AB/BA blocks, 16 fresh processes.

All samples completed exactly with:
- root WDL: -1;
- root move: 4.

Means:

| metric | A baseline | B lazy order |
|---|---:|---:|
| process cycles | 53.213 B | 53.569 B |
| wall ms | 5,641.3 | 5,834.0 |
| CPU ms | 21,803.1 | 21,912.6 |
| total nodes | 4.498 M | 4.477 M |
| winner nodes | 1.265 M | 1.262 M |
| cycles/node | 11,830.5 | 11,965.2 |
| shared hits | 522.2 K | 518.7 K |
| shared stores | 1.598 M | 1.595 M |
| contention | 41.6 K | 38.4 K |
| RSS | 266.8 MB | 267.0 MB |
| peak RSS | 438.2 MB | 440.1 MB |

Paired B versus A:
- whole-process cycles: **+0.670%**, 95% **[-0.115%, +1.454%]**;
- wall: +3.428%, interval crosses zero;
- CPU: +0.505%, interval crosses zero;
- total nodes: -0.465%, interval crosses zero;
- winner nodes: -0.286%, interval crosses zero;
- cycles/node: **+1.139%**, 95% **[+0.782%, +1.496%]**;
- shared hits: -0.668%, interval crosses zero;
- shared stores: -0.186%, interval crosses zero;
- shared contention: -7.542%, interval crosses zero;
- shared bytes: unchanged;
- RSS: +0.071%, interval crosses zero;
- peak RSS: **+0.442%**, 95% **[+0.211%, +0.673%]**.

The campaign authority is completed whole-process cycles. The interval crosses
zero and the mean is slower, so no promotion is admissible.

The significant cycles/node regression indicates that repeated selection scans,
upper-bound checks, per-depth score traffic and additional control outweigh the
saved scorer calls on this realization. The small node decrease is insufficient
to offset that cost.

## Secondary hard fixed window — 35333571

One paired block at the unchanged 120000 ms application ceiling.

Both arms timed out. No exact solve-speed ratio is admissible.

Descriptive B versus A:
- cycles +0.149%;
- wall -0.002%;
- CPU +0.330%;
- nodes -0.924%;
- cycles/node +1.083%;
- shared hits -1.790%;
- shared stores -2.465%;
- contention +0.188%;
- peak RSS +0.707%.

This censored sample is consistent with the exact-control cost finding but does
not independently rank solve speed.

## Disposition

Reject exact lazy live-line ordering by repeated upper-bound selection from the
preferred path.

Retain selected solver:

`81c9475e94607cff9e777776157b82b3466c385b`

Do not repeat this candidate without a materially different mechanism that
avoids repeated candidate scans / control overhead.

The original measured fact remains valid: eager ordering computes many scores
that search never consumes. This experiment shows that recovering those scorer
calls through repeated exact selection scans is not economical.

PR #113 should remain unmerged/closed as rejected evidence.
PR #84 remains draft/open and receives no merge authorization.
