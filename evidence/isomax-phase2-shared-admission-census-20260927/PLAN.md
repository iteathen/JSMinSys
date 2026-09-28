# IsoMax Phase-2 shared admission/source census

Date: 2026-09-27
Status: diagnostic plan; timing/cycles from instrumented runs are invalid.

## Authority

Preferred solver baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

IsoGraph disposition:
`60253ed2b55c19fd526584cc8ac1a024af984f6d`

The isolated mandatory-known-hash helper split was exact but below the
whole-solve signal threshold. The next pass measures a larger transition class:
shared exact publication/probe economics.

## Question

Which exact-evidence sources create shared-cache rows that are later useful, and
which mainly create replacement traffic or contention?

No admission policy will be changed in this census.

## Store provenance classes

1. CPC exact closure.
2. CPC semantic interval collapse.
3. Forced-terminal full-window exact publication.
4. Directed fail-high +1 exact publication.
5. Completed exact branch publication (full-window completion / exact -1).
6. Same-q LOWER0+UPPER0 exact-draw coalescing.

## Diagnostic counters

For each source:
- shared store attempts;
- successful stores;
- contention drops;
- replacement stores into occupied slots;
- later shared exact hits served by rows from that source;
- cross-worker hits.

Also collect:
- store-success and hit counts by search depth;
- shared probe outcome counts;
- reader-worker probe/hit counts.

A diagnostic source tag is stored under the same shared-cache sequence lock and
is never consulted by solver logic.

## Validity

Instrumentation changes memory traffic, atomic traffic, timing, and Lazy-SMP
interleaving. Therefore:
- do not use wall, CPU, cycles, nodes/sec, or censored throughput as performance
  evidence;
- use only exactness and provenance ratios/counts;
- preserve 4 workers = 1 wide + 3 deep;
- no single-worker run;
- shared cache remains exact-only;
- no solved-game prior information.

Fixtures:
- exact derived-long `353335714`;
- official-hard `35333571` under the unchanged 120000 ms ceiling.

The goal is to identify a measured admission/source hypothesis for a later clean
A/B experiment, not to optimize inside the census.
