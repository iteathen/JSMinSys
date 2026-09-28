# IsoMax Phase-2 shared key-mismatch prefix census result

Date: 2026-09-27
Status: census complete; shared mismatch comparison is already shallow.

## Authority

Fixed preferred solver:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Workflow:
`36399735484` — success.

Artifact:
`10959638969`

Digest:
`sha256:524120fc62f2c4881f87dcfefd85ad2c8c1bea32ae60723178d76444ed179c66`

Verify:
`36399735395` — success.

Topology:
- availableParallelism() = 4;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- no single-worker runs.

Instrumentation changes execution cost/interleaving. Timing, cycles, throughput and
node-rate observations from the census are invalid.

## Exact derived-long — 353335714

Four instrumented runs, all exact with root WDL -1 / move 4.

Shared key width: 14 words.

Aggregated occupied-slot comparison outcomes:
- mismatches: 2,296,294;
- complete 14-word key matches: 2,066,053;
- total atomic key-word loads: 31,786,333.

Mismatch depth:
- word 0: **80.61%**;
- by word 1: **97.04%**;
- by word 3: **99.626%**;
- by word 7: **99.984%**.

Mean key words loaded per mismatching probe:
**1.2462**.

The overall mean across mismatches plus full matches is 7.287 words because a
real full-key match necessarily consumes all 14 key words. That is correctness
work, not collision-rejection waste.

## Official hard fixed window — 35333571

One instrumented 120000 ms window; TIMEOUT.

Occupied-slot comparison outcomes:
- mismatches: 79,830,616;
- complete key matches: 20,330,996;
- total key-word loads: 385,433,531.

Mismatch depth:
- word 0: **80.27%**;
- by word 1: **96.51%**;
- by word 3: **99.597%**;
- by word 7: **99.990%**.

Mean key words loaded per mismatching probe:
**1.2627**.

The hard workload therefore reproduces the exact-control conclusion.

## Structural conclusion

The phrase "full-key mismatch" overstated the work actually paid by the current
probe.

For mismatching direct-map collisions, the existing key order is already an
effective discriminator:
- about four fifths fail after one atomic key load;
- about 97% fail within two;
- almost all fail within four.

This explains why the separate packed-fingerprint experiment did not produce a
whole-solve improvement: the fingerprint added work in front of a rejection path
that is already close to minimum.

Do not add another fingerprint, collision table, or mismatch prefilter from this
evidence.

Full-key matches still require 14-word equality, as correctness requires.

## Next measurement

The remaining large shared-cache operation class is publication.

Before adding store machinery, measure whether an exact shared store is often
republishing a q/value that another worker installed after this worker's earlier
shared miss.

A diagnostic store census should measure:
- shared store attempts;
- current slot empty / busy / occupied;
- on stable occupied slots, same-q same-value republications;
- same-q different-value observations (must remain zero under exact semantics);
- mismatch prefix paid by the diagnostic duplicate check.

If same-q exact republication is substantial, a later clean experiment can test
"do nothing when the identical exact row is already committed." If it is rare,
do not add the check.

PR #84 remains draft/open; no merge authorization follows.
