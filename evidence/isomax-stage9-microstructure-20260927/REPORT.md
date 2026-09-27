# IsoMax Stage-9 microstructure factorial — 2026-09-27

Status: Stage-9 screen complete; plan-key specialization retained as experimental winner.

## Arms

A — Stage-7 winner
`81b698d2465d80aa3e9627ddcc9da61cc58bfa49`

B — four-entry cached child-basis copy unroll
`870bf442aa3bf92b59bc0823a3ba9e5d01720256` (draft PR #72)

C — exact standard 7-column/radix-7 plan-key unroll
`10380f79af68dc1f57455d535814ac0a7eacea33` (draft PR #73)

D — combine B+C
`b4440269c1ac982cf84f0cee21ab3f97a5f76fe2` (draft PR #74)

All candidates passed Verify. Static cycle ledgers conservatively retain the
previous loop envelopes and add specialization selection where applicable.

Workflow: `IsoMax Stage9 microstructure factorial`
Run: `36353413496` — success.
Artifact: `10942324449`.
Digest: `sha256:d9de78407b6720e7cdc711f03688e87fad637fecc02c6fae5aa58893e1b3776a`.

## Long equal-work control — 353335714

Eight balanced blocks / 32 fresh Windows processes. All search/result metrics
are identical.

Paired cycle deltas:
- B basis copy unroll: +0.46%, interval [-0.84%, +1.76%] — reject;
- C plan-key unroll: **-1.690%**, interval **[-2.755%, -0.626%]**;
- D combined: **-1.035%**, interval [-1.925%, -0.144%].

C is the winner. The basis-copy unroll interferes negatively enough that it
should not be carried forward.

C wall delta: -1.800% [-2.939%, -0.660%].
C CPU delta: -2.254% [-3.501%, -1.008%].

## Short control — 45461667

C cycles: -0.88%, interval crosses zero.
No short-control ordering is established.

## Campaign progress

Stage-7 compounded factor: about 0.512047.
Stage-9 C factor: 0.983098.

Product: **0.50339** of original C1 worker cost, or approximately
**49.66% reduction**.

Only about **0.67% reduction of the current Stage-9 kernel** remains to reach
the owner target of <=0.50.

## Disposition

Carry forward only the exact 7x6 plan-key specialization from PR #73. Reject
the basis-copy unroll. The next experiment should be narrow: remove recurring
inner target-word guards from the overwhelmingly common one-word child-basis
plan-hit path rather than redesigning search.
