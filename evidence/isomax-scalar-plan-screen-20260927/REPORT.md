# IsoMax three-word scalar plan application — 2026-09-27

Status: Stage-5 screen complete; no production promotion.

Control: parent-aligned plan
`bc7380837f6ba65d513f31e5de89ac766f09df9f`.

Candidate: standard three-word scalar accumulator
`40a07f57a4d5c608fb2db0d3a046b356736c5d7d` (draft PR #62).

Candidate Verify: run `36348665461` — success.

Screen workflow: `IsoMax scalar plan screen`
Run: `36348168229` — success.
Artifact: `10941611523`.
Digest: `sha256:6a1a045b17ddc2d61c8caed6d2d2ebdade7d94975ca639eb05273d2cc05ff1df`.

The candidate preserves the generic parent-aligned span fallback. For the
prepared W=3 profile it accumulates six output coordinate words in scalar locals
and publishes once, eliminating repeated typed-array target read/write traffic.

## Long equal-work control — 353335714

Eight ABBA blocks / 32 fresh processes. WDL, root move, nodes, cofactors and all
CPC/cache metrics are identical.

Paired candidate deltas:
- solve cycles: **-6.9593%**, 95% interval **[-7.5052%, -6.4134%]**;
- wall: **-7.1898%** [-7.8382%, -6.5415%];
- CPU: **-7.0121%** [-7.6963%, -6.3279%].

Descriptive means:
- parent-aligned control: 25.711 B cycles, 2187.12 cycles/node;
- scalar candidate: 23.922 B cycles, 2034.92 cycles/node.

## Short control — 45461667

Candidate cycles: -2.35% with interval [-4.88%, +0.18%]; no cycle improvement
is established, but unlike the original Stage-2 plan cache there is no measured
short-work regression. Wall improved -2.43% [-4.33%, -0.53%].

## Campaign product

Paired effect factors through Stage 5:

- Stage 1 dense-both+C1: 0.9212
- Stage 2 support plan: 0.70142
- Stage 3 sparse/no-C1 apply: 0.9473
- Stage 4 parent alignment: 0.984133
- Stage 5 scalar W=3 apply: 0.930407

Product: **0.56046** of the original C1 worker cost, or approximately
**43.95% reduction**.

To reach the owner target of <=0.50 requires another **10.79% reduction of the
current Stage-5 kernel**.

## Stage-5 profile

Profile workflow run `36348665500` — success.
Artifact `10940514161`.
Digest: `sha256:be167702d9a3d4682dca470c93bf8910ce6a9077e892acb77c893e60159be1a6`.

Candidate sampled self-time:
- applyConnect4RbaCofactorPlan32: 25.73%
- searchCpcOnly frame: 15.75%
- CPC singleton collection: 10.35%
- exact-cache probe: 8.08%
- ordinary cofactor misses: 6.72%
- plan miss/store: 5.81%
- CPC evaluator: 3.91%
- canonicalization: 3.01%
- key hash: 2.98%
- plan key construction: 1.61%

Within applyConnect4RbaCofactorPlan32 position ticks:
- closure load line: **27.29% of apply samples**;
- cached child-basis copy: **13.35%**;
- sparse-loop/coordinate classification and write decisions make up most of the
  remaining hot body.

This motivates the next factorial: closure SoA addressing and word-level
partitioned mover/opponent coordinate masks.
