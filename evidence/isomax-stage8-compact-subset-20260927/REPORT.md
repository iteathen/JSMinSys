# IsoMax Stage-8 compact subset screen — 2026-09-27

Status: negative long-control result; no production promotion.

## Arms

A — Stage-7 winner
`81b698d2465d80aa3e9627ddcc9da61cc58bfa49`

B — plan-store subset relation copied to Uint8 rows
`8c15b62a18fffd1ed5c3c348fcdff1497f905d63` (draft PR #70)

C — plan-store subset relation bit-packed into Uint32 rows
`5b0e1eaeb5cbf153337a2cf061df1935ab5f6f37` (draft PR #71)

D — duplicate Stage-7 A/A control.

Both candidates passed Verify/schema/node-compatibility. Cold subset conversion is
cycle-accounted and occurs outside measured solve cycles.

Workflow: `IsoMax Stage8 compact-subset screen`
Run: `36352683701` — success.
Artifact: `10943146649`.
Digest: `sha256:5fdc98a6bb06ae69328a2bb98d0ac97a85b171d13e15fda16015daa65630fca3`.

## Long equal-work control — 353335714

Eight balanced blocks / 32 fresh Windows processes. Search result and all
production work counters are identical.

Paired cycle deltas vs A:
- B Uint8: **+0.10%**, interval [-2.02%, +2.22%];
- C bitset: **+0.61%**, interval [-2.88%, +4.10%];
- D duplicate A/A: -1.06%, interval [-3.71%, +1.60%].

Neither compact representation qualifies. Improved carrier density does not
repay conversion/addressing effects on the long workload.

## Short control — 45461667

Uint8 cycles: -3.91%, interval [-7.36%, -0.45%].
Bitset cycles: -2.26%, interval crossing zero.

The byte representation appears useful only on the short workload. The campaign
target is the hard recurring worker kernel, so this does not override the long
rejection.

## Disposition

Reject B and C as Stage-8 long-control successors. Preserve the negative result.
Continue from Stage-7 winner `81b698d...`.

Stage-7 campaign factor remains approximately 0.51205 of original C1 cost
(48.80% reduction); another ~2.35% current-kernel reduction is required.
