# Phase-2 zero-bound coalescing experiment

## Exact rule

For the same q in mover-relative W/D/L {-1,0,+1}:

- existing LOWER0 + new LOWER0 => unchanged LOWER0;
- existing UPPER0 + new UPPER0 => unchanged UPPER0;
- existing LOWER0 + new UPPER0 => exact draw;
- existing UPPER0 + new LOWER0 => exact draw.

The exact promotion follows directly:

    value >= 0 AND value <= 0 => value = 0

A full q-key equality check is mandatory before same-bound suppression or
opposite-bound promotion. Hash equality alone is insufficient.

## Candidates

C — local coalescing:
- avoid full-key republication for repeated same-q/same-bound;
- opposite same-q weak bounds become local exact draw code 2;
- no new shared publication from the coalescing event.

D — local + shared coalescing:
- same local behavior;
- when opposite bounds prove exact draw, publish exact draw to the existing
  shared exact cache using the already-computed q hash/sample policy.

Both retain:
- exact local occupant protection;
- generic geometry/key widths;
- public exact-only filtering;
- shared cache exact-only semantics;
- current worker topology.

## Benchmark

Compare against:
A — current combined LOWER0+UPPER0.
B — verified UPPER0-only hard-case lead.

Use the correctly scaled GitHub topology:
- 4 workers = 1 wide + 3 deep.

Primary exact fixture: 353335714.
Secondary fixed-window hard fixture: 35333571.
