# Phase 2 multiworker qualification wiring audit

Date: 2026-09-27

## Finding

The selected six-deep/one-wide Lazy-SMP host/worker path does **not** currently
attach the Phase-1 support-derived cofactor plan cache.

The Stage-9 denominator and Phase-2 zero-bound candidate both contain the plan
representation in `rba-connect4-coordinate.mjs`, but the selected workers call:

- `prepareConnect4RbaAlphaBeta(...)` in the six deep workers; and
- `prepareConnect4RbaFrontier(...)` in the one root-frontier worker

without assigning `state.profile.cofactorPlanCache`.

Therefore a direct seven-worker A/B at the current worker modules would not be
against the qualified Phase-1 local denominator.

## Required qualification wiring

For the selected 7x6 profile, attach the same private support-plan configuration
to **all seven workers** in both arms:

- capacity: 262,144 plans;
- geometry-derived plan key/payload only;
- no shared plan table;
- no solved-position information;
- allocation occurs during worker preparation, outside recursive search.

Control:
Stage-9 denominator `10380f79...` + support-plan wiring.

Candidate:
direct zero-bound source `dbac3d430...` + identical support-plan wiring.

No single-worker qualification is permitted.

## Shared exact interaction to record

Private LOWER0/UPPER0 rows may satisfy the private direct-map probe before the
worker reaches the optional shared-exact lookup. Multiworker evidence must
therefore report at minimum:

- total all-worker nodes;
- winner nodes;
- shared exact hits/stores/contention;
- process cycles/wall;
- winner identity;
- exact W/D/L/root move;
- per-worker node counts.

If the bound candidate materially lowers shared-exact hits, judge the net
whole-solve economics rather than assuming that loss is adverse.

A follow-up shared-exact-precedence arm is warranted only if the measured masking
appears economically significant.

## Durability

Do not run the seven-worker comparison until both arms have identical support
plan wiring and that wiring is committed.
