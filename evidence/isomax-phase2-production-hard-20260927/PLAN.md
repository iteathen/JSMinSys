# Phase 2 production-aligned official hard qualification

Date: 2026-09-27

## Why this test exists

The prior seven-worker qualification intentionally wired the Phase-1 local
support-plan arena into every worker so the local denominator could be reproduced.

On official Fhourstones input `35333571`, **both** plan-wired arms timed out at
the unchanged 120-second application ceiling.

That wiring is therefore not a promotion candidate for the selected production
profile.

## Fixed arms

A — Stage-9 denominator, normal selected worker setup:

`10380f79af68dc1f57455d535814ac0a7eacea33`

B — direct-source search-derived zero bounds, normal selected worker setup:

`dbac3d430414a90b8e31da9e0c640a06dfef596d`

Neither arm attaches `profile.cofactorPlanCache` in the Lazy-SMP workers.

## Selected profile

- 7 workers;
- six deep + one root-frontier;
- shared exact capacity 4,194,304;
- local exact capacity 1,048,576/worker;
- full sharing;
- rootFrontier=true;
- 120-second application ceiling;
- no single-worker test.

## Official hard control

Input: `35333571`.

Run two ABBA blocks / eight fresh processes on one Windows GitHub runner.

Record:
- EXACT/TIMEOUT status;
- root W/D/L and move;
- total process cycles;
- wall/CPU;
- all-worker total nodes;
- per-worker nodes;
- winner and winner nodes;
- shared exact hits/stores/contention;
- RSS/peak RSS.

If both arms finish exactly, report paired cycle/wall ratios.

If either arm times out, treat data as censored and do not manufacture an exact
speed ratio.

## Promotion interpretation

This is the production-aligned hard gate for the zero-bound mechanism.

A candidate that solves while the control times out is a strong qualitative
promotion result, but should still preserve the exact root result and all host
correctness invariants.

Keep the application ceiling fixed. Do not extend timeout to create a pass.
