# IsoMax support-derived cofactor plan screen — 2026-09-27

Status: Stage-2 screen complete; no production promotion.

## Provenance

Control: verified dense-remove+dense-subset+C1 arm
`390aed4888a0414afaf0d4c09c051d4ef4a5a13f`.

Candidate: support-derived cofactor plan cache
`8d9b3dd2c353a8162addd1a4babbedd84d68f18b` (draft PR #57).

Candidate Verify: run `36344899857` — success.

Screen workflow: `IsoMax cofactor plan screen`
Run: `36344953672` — success.
Artifact: `10939489532`.
Digest:
`sha256:7e34efa30518b139e28c5a23e03eabc0db417a4ed07f3ffd04687ceb3a67b517`.

Windows GitHub-hosted AMD EPYC 7763, Node 26.7.0. Windows
QueryProcessCycleTime. Plan arena allocation is cold and outside the measured
solve-call cycle boundary; resident memory remains reported.

The plan key is exact 7x6 gravity support + legal landing column. Payload is
support/geometry only:
- child basis;
- parent-basis -> child-image/index mapping;
- exact three-word child-basis upward-closure masks;
- landing singleton metadata.

No W/D/L, CPC conclusion, coordinate membership, best move or solved-position
label is stored. Current P0/P1 coordinate membership is applied at runtime and
C1 per-player absorption remains.

## Long control — 353335714

Eight ABBA blocks / 32 fresh processes. Deterministic search work is identical:

- nodes: 11,755,731;
- cofactors: 11,813,310;
- all CPC/cache/cutoff metrics identical;
- WDL/move identical.

| Arm | Mean solve cycles | Cycles/node | Mean wall ms |
|---|---:|---:|---:|
| dense-both+C1 control | 36.887 B | 3137.82 | 14,996.06 |
| support-plan candidate | **25.874 B** | **2200.97** | **10,435.80** |

Paired candidate delta:
- solve cycles: **-29.858%**, 95% descriptive interval **[-30.297%, -29.420%]**;
- cycles/node: **-29.858%**;
- wall: **-30.414%**, interval **[-30.971%, -29.858%]**;
- CPU time: **-30.086%**, interval **[-30.657%, -29.515%]**.

Plan population:
- plans stored: 137,900;
- fixed plan arena bytes: 295,164,676;
- post-solve RSS: about 284 MB candidate vs 117 MB control.

This is a large equal-work kernel improvement. Combined multiplicatively with
the Stage-1 dense-both result, the current measured path is roughly 35% below
the original C1 worker cost on the long control, still short of the >=50% owner
target.

## Short control — 45461667

Four ABBA blocks / 16 fresh processes; exact work remains identical.

Candidate delta:
- solve cycles: **+13.831%**, interval **[+9.362%, +18.301%]**;
- wall: **+9.050%**, interval **[+4.614%, +13.486%]**;
- CPU time: **+22.035%**, interval **[+12.574%, +31.495%]**.

Plans stored: 14,432.

The plan mechanism is therefore workload-dependent. On short work, plan-key,
miss materialization and/or hit-application overhead is not amortized.

## Relation to the reuse census

The diagnostic support-plan census found:
- long repeated plan occurrence fraction: 98.83%;
- short repeated fraction: 76.73%;
- 5,291 long-control keys carry 78.46% of all calls;
- 15,746 keys with >=65 calls carry 89.57% of all calls.

The current candidate eagerly stores on the first miss and allocates capacity
for 262,144 plans. It is intentionally a maximal Stage-2 proof of leverage, not
the final representation.

## Disposition

The support-derived plan hypothesis is strongly validated.

Do not promote the current full arena:
- short-work regression is material;
- 295 MB fixed payload is excessive;
- >=50% total worker-cycle target is not yet reached.

Next actions:
1. profile the plan-enabled long control separately from timing;
2. attribute hit application, miss store and key-construction costs;
3. test delayed/hot-only admission and smaller capacity using the measured reuse
   concentration;
4. test cheaper plan-hit coordinate application if it remains the dominant cost;
5. retain exact equal-work qualification and cycle-ledger accounting.
