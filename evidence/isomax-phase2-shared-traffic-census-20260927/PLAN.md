# IsoMax Phase-2 shared-traffic census plan

Date: 2026-09-27
Status: diagnostic-only measurement; instrumented timing/cycles are invalid.

## Base

Preferred pure coalesced locator-hash reuse:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

This follows the mandatory-hot-helper falsifier:
the isolated compatibility branch removal did not establish a whole-solve win.

## Question

Which classes of existing exact-only shared traffic are responsible for useful
cross-worker evidence and which classes dominate store/contention pressure?

Do not change admission policy before measuring the current traffic.

## Census dimensions

For every rank 0..42, count:

1. shared probe attempts after a private exact-cache miss;
2. shared probe hits returning LOSS;
3. shared probe hits returning DRAW;
4. shared probe hits returning WIN;
5. ordinary shared exact LOSS store attempts;
6. ordinary shared exact DRAW store attempts;
7. ordinary shared exact WIN store attempts;
8. coalesced LOWER0+UPPER0 => exact DRAW shared store attempts.

Rank is the canonical Connect4 RBA rank:
`words[offset + g.metaOffset] >>> 2`.

The census also records the existing shared-cache aggregate hit/store/contention
metrics for correlation.

## Method

Use a Node module load hook over a frozen worktree. The production source SHA is
unchanged. Instrument only the generated root-frontier worker path used by the
selected 4-worker topology.

The hook widens the cold result metrics buffer and copies diagnostic counters to
the host at worker completion.

Instrumentation changes execution cost and scheduling. Therefore:
- process timing is invalid;
- process cycle counts are invalid;
- node-rate comparisons are invalid;
- only event counts/distributions are admissible.

## Fixtures

- exact derived-long: `353335714`, must finish exact with WDL -1 / move 4;
- official-hard prefix: `35333571`, fixed 60000 ms diagnostic window.

Topology:
- 4 workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- no single-worker run.

## Decision use

Use the rank/source distribution to propose the smallest admission experiment.

Do not add a second table.
Do not infer an admission rule from censored timing.
Do not modify PR #84.
