# IsoMax Phase-2 shared key-mismatch prefix census

Date: 2026-09-27
Status: diagnostic; instrumented timing/cycles are invalid.

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

## Motivation

The hard shared-admission census saw about 70% of all shared probes reject an
occupied direct-map slot because the full q key did not match.

A packed locator fingerprint was then tested and failed to establish a
whole-solve improvement.

The current shared q equality loop already exits at the first mismatching key
word. Therefore the missing measurement is the actual prefix length paid on
collisions.

## Counters

For shared probes that reach full-key comparison:
- first mismatch word index 0..K-1;
- count of complete K-word key matches;
- total shared key-word atomic loads performed by q comparison.

Derived:
- mean key words compared per compared probe;
- mean key words compared per mismatching probe;
- fraction of mismatches rejected at word 0, <=1, <=3, etc.

The diagnostic adds no search/admission behavior and no acceptance shortcut.

## Fixtures

- four exact runs: `353335714`;
- one official-hard 120000 ms fixed window: `35333571`.

Topology remains 4 workers = 1 wide + 3 deep. No single-worker run.

Timing, process cycles, nodes/sec, and interleaving from the instrumented run are
invalid; only exactness and comparison-count distributions are admissible.
