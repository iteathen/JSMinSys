# IsoMax Stage-9 microstructure factorial — 2026-09-27

Status: Stage-9 screen complete; no production promotion.

## Arms

A — Stage-7 active-word winner
`81b698d2465d80aa3e9627ddcc9da61cc58bfa49`

B — four-entry child-basis copy unroll
`870bf442aa3bf92b59bc0823a3ba9e5d01720256`

C — exact 7-column/radix-7 plan-key specialization
`10380f79af68dc1f57455d535814ac0a7eacea33`

D — basis-copy unroll + exact key specialization
`b4440269c1ac982cf84f0cee21ab3f97a5f76fe2`

All candidates were cycle-accounted and verified before timing.

Workflow: `IsoMax Stage9 microstructure factorial`
Run: `36353413496` — success.
Artifact: `10942324449`.
Digest: `sha256:d9de78407b6720e7cdc711f03688e87fad637fecc02c6fae5aa58893e1b3776a`.

## Long equal-work control — 353335714

Eight balanced blocks / 32 fresh Windows processes. Every arm produced identical
WDL, root move, nodes, cofactors, CPC metrics, cache metrics and plan count.

Paired cycle deltas vs A:
- B basis-copy unroll: +0.459%, interval [-0.839%, +1.758%];
- C exact plan key: **-1.690%**, interval **[-2.755%, -0.626%]**;
- D combined: **-1.035%**, interval **[-1.925%, -0.144%]**.

C is the Stage-9 winner. The basis-copy unroll does not qualify and weakens the
combined arm.

C wall delta: -1.800% [-2.939%, -0.660%].
C CPU delta: -2.254% [-3.501%, -1.008%].

The key specialization removes loop control for the exact standard 7x6
mixed-radix support key while preserving the generic runtime-configured fallback.

## Short control — 45461667

No arm establishes a cycle difference. C paired cycle delta is -0.876% with a
wide interval crossing zero.

## Campaign progress

Sequential paired factors:
- Stage 1: 0.9212
- Stage 2: 0.70142
- Stage 3: 0.9473
- Stage 4: 0.984133
- Stage 5: 0.930407
- Stage 6: 0.951434
- Stage 7: 0.960251
- Stage 9 C: 0.9830985

Product: approximately **0.50339** of the original C1 worker cost.

That is approximately **49.66% reduction**. Reaching <=0.50 now requires only
about **0.67% reduction of the current Stage-9 kernel**.

## Disposition

Retain C as the Stage-9 experimental winner. Reject the child-basis unroll for
this campaign. Stage 10 should seek a small, well-isolated final reduction with
enough margin to clear the 50% target outside runner noise.
