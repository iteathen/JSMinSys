# IsoMax Phase-2 shared publisher-origin census

Date: 2026-09-27
Status: diagnostic; instrumented timing/cycles are invalid.

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

The reader-role census showed worker 0 consumes 15–20% of shared probes but
receives effectively none of the shared hits. A clean write-only experiment did
not produce a statistically qualified whole-solve gain, so shared-read
suppression is not carried forward.

Before testing complete worker-0 shared isolation, measure the other direction:
how useful are rows **published by worker 0** to workers 1..3?

For each publisher worker, record:
- store attempts;
- successful stores;
- contention;
- replacement stores;
- later hits served by its rows;
- cross-worker hits served;
- evictions of its rows.

Also record a 4x4 reader/publisher hit matrix.

The diagnostic source tag already used by the admission census is written under
the same sequence lock and remains invisible to solver logic.

No search/admission behavior changes.
4 workers = 1 wide + 3 deep.
No single-worker run.
Timing/cycles/throughput are invalid under instrumentation.
