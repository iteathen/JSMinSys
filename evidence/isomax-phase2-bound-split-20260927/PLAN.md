# Phase-2 optimization pass — split zero-bound directions on 4-vCPU GitHub

Date: 2026-09-27

## Purpose

The official hard fixture shows a repeatable pattern for the current combined
LOWER0/UPPER0 implementation:

- fewer nodes;
- fewer shared exact hits;
- many more shared stores/contention;
- higher cycles/node;
- no exact completion under the fixed 120-second ceiling.

Before adding new cache machinery, isolate the two weak-bound directions.

## Worker topology

Standard GitHub Windows runner is treated as a reduced-hardware profile.

Use exactly 4 search workers:
- worker 0: wide / iterative root-frontier;
- workers 1..3: deep Lazy-SMP.

Preserve:
- rootFrontier=true;
- frontier stride 2 / release target 1 semantics;
- shared exact 4,194,304;
- local exact 1,048,576/worker;
- full sharing;
- no single-worker runs.

## Arms

A — selected production `a3cf7f9...`, exact-only local cache.

B — selected-production zero-bound candidate `00ecc7d...`, both LOWER0 and UPPER0 stores.

C — LOWER0-store-only variant.
- retain bound probe semantics;
- retain exact/public/shared filtering;
- publish search-derived LOWER0 only;
- no UPPER0 publication.

D — UPPER0-store-only variant.
- retain bound probe semantics;
- retain exact/public/shared filtering;
- publish search-derived UPPER0 only;
- no LOWER0 publication.

Fresh caches mean an unused bound code cannot appear unless that arm stores it.

## Screen

Primary exact screen:
- fixture `353335714`;
- 4-worker 1-wide/3-deep profile;
- balanced A/B/C/D order;
- process cycles is primary;
- search work may change.

Hard fixed-window screen:
- fixture `35333571`;
- unchanged 120-second application ceiling;
- same four arms/topology;
- if censored, report only fixed-window cycles/nodes/shared traffic.

## Promotion logic

If C or D preserves most of B's exact whole-solve improvement while materially
reducing cycles/node/store pressure, carry only that direction forward.

If both directions are independently valuable, next investigate:
- same-q bound rewrite without republishing the key;
- admission policy based on measured bound-hit source/rank;
- shared-exact precedence only if its added probe cost can be justified.

Do not add a second bound table before this split falsifier is complete.

## Durability

Commit:
1. plan;
2. each source/ledger arm;
3. Verify result;
4. benchmark workflow;
5. accepted/rejected disposition.
