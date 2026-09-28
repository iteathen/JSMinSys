# Phase 2 selected-production zero-bound qualification

Date: 2026-09-27

## Sources

A — current selected production head:
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`

B — zero-bound production port:
`00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee`

PR #84 Verify/schema/node-compatibility: green.

The candidate ports only:
- private search-derived LOWER0/UPPER0 reuse;
- exact-only public/shared filtering;
- behavior/root-frontier mirrors;
- canonical cycle accounting;
- endpoint-cache privacy/oracle tests.

It does **not** import:
- Stage-9 coordinate/cofactor research changes;
- support-plan worker wiring;
- CPC-derived bound stores.

## Selected execution profile

Use each source's existing selected profile:
- 7 workers;
- six deep + one root-frontier;
- shared exact capacity 4,194,304;
- local exact capacity 1,048,576 per worker;
- full sharing;
- rootFrontier=true;
- Node 26.7.0;
- Windows QueryProcessCycleTime;
- no single-worker tests.

## Matched controls

### Short
`45461667`
- 4 ABBA blocks;
- 30-second ceiling.

### Derived long
`353335714`
- 8 ABBA blocks;
- 90-second ceiling.

### Official hard
`35333571`
- 2 ABBA blocks;
- **120-second application ceiling unchanged**.

## Correctness / interpretation

Every exact sample must agree in root W/D/L and root move across arms.

For fixtures where every sample in both arms is EXACT:
- report paired process-cycle ratio;
- wall/CPU ratio;
- total all-worker nodes;
- per-worker nodes;
- shared exact hits/stores/contention;
- winner and winner nodes.

If either arm times out:
- mark that fixture censored;
- do not report an exact solve-speed ratio;
- retain fixed-window throughput/node/shared evidence descriptively.

## Promotion gate

The zero-bound mechanism is promotion-ready only if:
1. PR #84 remains green;
2. short control has no material regression;
3. derived long retains the large whole-solve advantage;
4. official hard is at least no worse than the selected production baseline and
   ideally materially faster under the same 120-second ceiling;
5. all seven workers exit cleanly and exact result semantics remain unchanged.

Commit all outcomes before review/merge.
