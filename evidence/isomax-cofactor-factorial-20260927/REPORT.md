# IsoMax dense cofactor + C1 factorial — 2026-09-27

Status: Stage-1 performance screen complete; no production promotion.

## Question

How much of the current cofactor cost can be removed by directly consuming the
already-prepared dense remove/subset tables while preserving the current C1
completed-upset absorption guard?

This is explicitly **not** the older pre-C1 PR33 body.

## Arms

A. current selected C1 baseline at
   `a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`

B. dense removal + C1 at
   `629b0e1430bfebdbb18a51927d8f66b91e863ee2`

C. dense subset + C1 at
   `f997fc3af9eaaf5ef0005821f8ead5f48d5a7d3e`

D. dense removal + dense subset + C1 at
   `390aed4888a0414afaf0d4c09c051d4ef4a5a13f`

Each candidate has matching cycle-ledger accounting in the same branch.
All three candidates pass JSMinSys Verify, schema and node-compatibility.

The dense-subset test initially failed because the C1 regression counted calls
to the old prepared-profile callback. Independent physical residual differential
tests were already green. The test was corrected to observe the direct dense
path; on the principal-upset fixture C1 absorbs before any subset-table probe.

## Measurement

Workflow: `IsoMax cofactor factorial`
Run: `36343722434` — success
Artifact: `10939584304`
Digest:
`sha256:cbe86b55b944d7cd27e46046710f65ee0112204cf6b7f8446360ed107fa94c3d`

Windows GitHub-hosted VM, Node 26.7.0. Four clean source worktrees were
materialized on the same VM. Windows QueryProcessCycleTime supplied actual
process cycles.

Long local control:
- fixture `353335714`;
- one evaluator;
- 1M private exact entries;
- no shared exact cache;
- eight Williams-balanced four-arm blocks;
- 32 fresh processes.

Every arm produced the exact same deterministic search signature:

- value = 1;
- relative = +1;
- move = 4;
- nodes = **11,755,731**;
- cofactors = **11,813,310**;
- cache/CPC/cutoff metrics all identical.

Thus cycle changes below are implementation-cost changes rather than changed
search work.

## Long-control results

| Arm | Mean solve cycles | Mean cycles/node | Mean wall ms | Paired solve-cycle delta vs A |
|---|---:|---:|---:|---:|
| A — C1 baseline | 25.961 B | 2208.36 | 9897.38 | reference |
| B — dense remove + C1 | 24.209 B | 2059.30 | 9235.95 | **-6.70%** |
| C — dense subset + C1 | 25.448 B | 2164.72 | 9702.77 | -1.88% |
| D — dense both + C1 | **23.894 B** | **2032.54** | **9103.30** | **-7.88%** |

Paired descriptive 95% intervals:

- B cycles: **[-9.28%, -4.13%]**
- C cycles: **[-5.43%, +1.67%]**
- D cycles: **[-10.38%, -5.38%]**

D wall-time paired delta: **-7.94%**, interval **[-10.46%, -5.42%]**.
D CPU-time paired delta: **-8.07%**, interval **[-10.45%, -5.69%]**.

Dense removal explains most of the gain. Dense subset alone is not established
on this workload, but its composition with dense removal gives the lowest
observed cost.

## Short-control screen

Fixture `45461667`, four blocks / 16 fresh processes.

All arms again have identical work:
- 62,031 nodes;
- 62,065 cofactors.

Mean cycles:
- A 607.244 M
- B 599.346 M
- C 606.409 M
- D 587.768 M

The short paired intervals cross zero because startup/JIT/runner noise dominates
this small solve. No contrary performance claim is made from that fixture.

## Disposition

D is the strongest Stage-1 recomputation candidate and the correct baseline for
the structural Stage-2 experiment.

The ~7.9% reduction is useful but is far below the owner's >=50% worker-hot-loop
target. Do not spend the campaign polishing this into a final answer. Preserve
it as the direct-recompute improvement and attack the much larger repeated
support-derived geometry work next.

No production/default change is made by this report.
