# IsoMax Stage-6 plan-layout factorial — 2026-09-27

Status: Stage-6 screen complete; no production promotion.

## Arms

A — Stage-5 scalar parent-aligned plan
`40a07f57a4d5c608fb2db0d3a046b356736c5d7d`

B — word-level partitioned mover/opponent coordinate masks, AoS closures
`c628ffd559c35e08227a300dcdc9acf5df824378` (draft PR #64)

C — three closure word planes, Stage-5 union iteration
`e2a04b21da2fff588f5b9a8312376b2d9e723f32` (draft PR #65)

D — planar closures + partitioned coordinate masks
`7ce1c8b5577d2288a48ad0b0a0eeb5b8ec9a6380` (draft PR #66)

All candidates passed Verify/schema/node-compatibility before timing and include
matching cycle-ledger updates.

Workflow: `IsoMax Stage6 plan-layout factorial`
Run: `36350436155` — success.
Artifact: `10942730137`.
Digest: `sha256:2eecbd22cc5aadb8bea298c703580f211ecba443301a597a0b5fa6eb26f216bd`.

## Long equal-work control — 353335714

Eight balanced blocks / 32 fresh Windows processes. Every arm produced identical:
- WDL and root move;
- 11,755,731 nodes;
- 11,813,310 cofactors;
- all CPC/cache/cutoff metrics;
- plan count 137,900.

Paired cycle deltas vs A:
- **B partitioned AoS: -4.8566%**,
  interval **[-5.7566%, -3.9566%]**;
- C planar union: **+1.8954%**,
  interval **[+1.2738%, +2.5171%]**;
- D planar+partitioned: **-1.9368%**,
  interval **[-3.3122%, -0.5614%]**.

B wall delta: **-5.0921%** [-5.9762%, -4.2080%].
B CPU delta: **-5.0116%** [-6.1187%, -3.9045%].

The three-plane representation falsifies the hypothesis that removing the
per-live i*3 AoS address is beneficial. Extra plane/property traffic costs more
than the saved address arithmetic. Do not carry it forward.

The partitioned AoS arm is the Stage-6 winner. It preclassifies, once per
32-bit coordinate word:
- mover-relevant bits;
- opponent-relevant unchanged bits;
- intersection;
- mover-only;
- opponent-only.

Each relevant parent closure is still loaded at most once, while per-residual
P0/P1 membership reloads and write-decision branches disappear.

## Short control — 45461667

Four blocks / 16 fresh processes.

B cycle delta: -0.41%, interval [-2.40%, +1.59%].
No short-cycle improvement or regression is established.

## Campaign progress

Sequential paired factors through Stage 6:
- Stage 1: 0.9212
- Stage 2: 0.70142
- Stage 3: 0.9473
- Stage 4: 0.984133
- Stage 5: 0.930407
- Stage 6 B: 0.951434

Product: **0.53324** of original C1 worker cost.

That is approximately **46.68% reduction**. Reaching <=0.50 now requires about
**6.23% reduction of the current Stage-6 kernel**.

## Disposition

Retain B as the current experimental winner. Reject planar closure storage for
this campaign. Re-profile the exact B revision before selecting the final
cycle-reduction target; Stage-5 hotspot shares are no longer authoritative.
