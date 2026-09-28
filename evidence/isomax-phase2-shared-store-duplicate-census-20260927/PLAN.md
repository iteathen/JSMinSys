# IsoMax Phase-2 shared exact duplicate-store census

Date: 2026-09-27
Status: diagnostic; instrumented timing/cycles are invalid.

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

## Motivation

The shared mismatch-prefix census showed that collision rejection is already
cheap:
- ~80% of mismatches reject on key word 0;
- ~97% reject by word 1;
- mean mismatching comparison is ~1.25 key words.

Do not add more collision-prefilter machinery.

The remaining large shared-cache transition class is publication.

A worker can miss q in the shared table, compute q independently, and reach exact
publication after another worker has already committed the identical exact row.
The current store then republishes the full shared key/value.

## Diagnostic question

At shared exact store entry, how often is the currently committed slot already:
- empty;
- busy;
- occupied by a different q;
- occupied by the same q and same exact value;
- occupied by the same q but a different exact value.

Same-q/different-exact-value must remain zero under correct exact semantics.

For stable occupied slots also record:
- mismatch prefix index;
- key words loaded by the diagnostic equality check.

The diagnostic does not change whether the real store proceeds.

## Fixtures

- four exact runs: `353335714`;
- one official-hard 120000 ms fixed window: `35333571`.

Topology:
4 workers = 1 wide + 3 deep. No single-worker run.

Timing, cycles, nodes/sec and interleaving from instrumented runs are invalid.

## Decision rule

If identical exact republication is substantial, test a later clean no-op store
guard.

If it is rare, do not add the guard and move to a larger transition class.
