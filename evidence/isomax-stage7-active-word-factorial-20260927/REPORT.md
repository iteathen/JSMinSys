# IsoMax Stage-7 active-word factorial — 2026-09-27

Status: Stage-7 screen complete; no production promotion.

## Arms

A — Stage-6 partitioned support-plan winner
`c628ffd559c35e08227a300dcdc9acf5df824378`

B — bound source coordinate words by parent basis size `n`
`e3eade0776d32f5a49230f77a467cda5cffc9ea7` (draft PR #67)

C — bound loaded closure/output words by child basis size `cn`
`368032d4a5469ae220c9c54786911325e97acd56` (draft PR #68)

D — combine source-word and closure-word bounds
`81b698d2465d80aa3e9627ddcc9da61cc58bfa49` (draft PR #69)

All candidates passed Verify before timing. Cycle ledgers conservatively retain
the inherited W=3 loop/memory envelope and add all new size/guard control, so
measured process cycles—not static ledger subtraction—are the performance
authority.

Workflow: `IsoMax Stage7 active-word factorial`
Run: `36351765197` — success.
Artifact: `10942248925`.
Digest: `sha256:73ca6eb1207472145e23f3a3d1fe87d70a61dae720fa924e4e3d22cc0916b345`.

## Long equal-work control — 353335714

Eight balanced blocks / 32 fresh Windows processes.

Every arm produced exactly identical:
- WDL/root move;
- 11,755,731 nodes;
- 11,813,310 cofactors;
- all cutoff/cache/CPC metrics;
- plan count 137,900;
- plan bytes 283,368,196.

Descriptive means:

| Arm | Mean cycles | cycles/node | wall ms |
|---|---:|---:|---:|
| A Stage-6 | 23.569 B | 2004.88 | 9472.43 |
| B source-bound | 23.092 B | 1964.32 | 9242.86 |
| C closure-bound | 22.898 B | 1947.85 | 9199.87 |
| D both | **22.625 B** | **1924.61** | **9109.31** |

Paired cycle deltas vs A:
- B: -1.963%, interval [-4.669%, +0.743%] — not established;
- C: **-2.777%**, interval **[-5.446%, -0.109%]**;
- D: **-3.975%**, interval **[-6.102%, -1.847%]**.

D wall delta: **-3.833%** [-6.107%, -1.559%].
D CPU delta: **-4.181%** [-6.193%, -2.168%].

Interpretation:
- the dominant win is avoiding closure-word 1/2 work when the child basis fits
  one word;
- parent source-word bounding composes positively with it, but does not qualify
  by itself on this runner;
- fixed three-word work was still materially present despite the W=3 scalar
  specialization.

## Short control — 45461667

Four blocks / 16 fresh processes.

D cycles: -1.27%, interval [-3.10%, +0.56%].
No short-control cycle improvement or regression is established.

## Campaign progress

Sequential paired factors through Stage 7:
- Stage 1 dense-both+C1: 0.9212
- Stage 2 support plan: 0.70142
- Stage 3 sparse/no-C1 plan apply: 0.9473
- Stage 4 parent alignment: 0.984133
- Stage 5 scalar W=3 apply: 0.930407
- Stage 6 partitioned coordinate masks: 0.951434
- Stage 7 combined active-word bound: 0.960251

Product: **0.51205** of the original C1 worker cost.

That is approximately **48.80% reduction**. Reaching <=0.50 now requires only
about **2.35% reduction of the current Stage-7 kernel**.

## Disposition

D is the Stage-7 winner. Re-profile its exact revision before selecting the
final cut. The Stage-6 profile is now stale enough that its line shares should
not choose the last optimization.
