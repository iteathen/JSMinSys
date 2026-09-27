# Phase 2 selected seven-worker qualification plan

Date: 2026-09-27

## Fixed source arms

Control:
`fb81d1502f3921894ae70916f31f93956555bfe9`

- Stage-9 Phase-2 denominator;
- qualification-only private support-plan wiring in all selected workers;
- canonical worker module ledgers updated;
- Verify/schema/node-compatibility green.

Candidate:
`ad871518f320d9fdb6c0da8352a9704614bdf261`

- direct-source search-derived LOWER0/UPPER0 implementation;
- behavior/root-frontier mirrors synchronized;
- identical support-plan worker wiring;
- canonical worker module ledgers updated;
- Verify/schema/node-compatibility green.

The worker source used solely for support-plan wiring is byte-identical between
the two arms.

## Selected execution profile

Use the repository-selected six-deep/one-wide profile:

- workers: 7;
- worker 0: iterative root-frontier;
- workers 1..6: deep Lazy-SMP;
- shared exact capacity: 4,194,304;
- local exact capacity: 1,048,576 per worker;
- full shared sampling (mask 0);
- rootFrontier=true;
- no single-worker test.

Each of the seven workers owns one 262,144-entry support-derived cofactor plan
arena.

## Measurement

Windows GitHub runner, Node 26.7.0, QueryProcessCycleTime through
`tools/run-isomax.mjs`.

Run A/B/B/A blocks in fresh processes on one runner.

Primary long qualification:
`353335714`, 8 ABBA blocks unless resource pressure requires a recorded
reduction before any result is interpreted.

Short control:
`45461667`, 4 ABBA blocks.

If the candidate wins materially and remains exact, run an additional hard
official Fhourstones control `35333571` with an appropriate timeout and
balanced matched source order.

## Correctness gate

Every sample must:
- finish EXACT for controls expected to solve inside the qualification ceiling;
- agree in root W/D/L and root move across arms;
- use exactly seven workers;
- report clean worker exit/no host error.

## Metrics

For every sample record:
- process solve cycles;
- wall and CPU time;
- all-worker total nodes;
- per-worker node counts;
- winner and winner nodes;
- cofactors/winner metrics;
- shared exact hits/stores/contention;
- start skew;
- RSS / peak RSS.

Search-work identity is **not** required; the bound mechanism intentionally
changes the tree.

## Shared-exact masking question

A private LOWER0/UPPER0 row can stop the local probe from falling through to
the optional shared-exact probe.

Therefore explicitly report:
- candidate/control shared-hit ratio;
- candidate/control shared-store ratio;
- total node/cycle effect.

Do not reject a candidate merely because shared hits fall if total exact solve
cost improves.

Only test a shared-exact-precedence variant if measured masking appears large
enough to be economically relevant.

## Promotion boundary

Passing this workflow qualifies multiworker economics for the selected profile.
It does not itself merge PR #79 or rewrite the production selected profile.
Promotion remains a separate review/merge step.
