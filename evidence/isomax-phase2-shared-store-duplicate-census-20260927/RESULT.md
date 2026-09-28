# IsoMax Phase-2 shared exact duplicate-store census result

Date: 2026-09-27
Status: census complete; do not add a duplicate-store precheck.

## Authority

Fixed preferred solver:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Workflow:
`36400491542` — success.

Artifact:
`10960360823`

Digest:
`sha256:4784f3915bbae3ba73f699484ccdb6b0712dbeb77c21df45cd23c932e32c917e`

Verify:
`36400491561` — success.

Topology:
- availableParallelism() = 4;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- no single-worker runs.

Instrumentation changes execution cost/interleaving. Timing, cycles, throughput and
node-rate observations are invalid.

## Exact derived-long — 353335714

Four instrumented exact solves, all root WDL -1 / move 4.

Aggregated shared store observations:
- attempts: 6,468,581;
- initially empty: 5,071,064;
- busy: 85,833;
- unstable during diagnostic observation: 5,720;
- stable occupied: 1,305,964;
- different q: 1,073,906;
- same q / same exact value: **232,058**;
- same q / different exact value: **0**.

Identical exact republication:
- **3.587% of all shared store attempts**;
- 17.77% of stable occupied observations.

A stable occupied diagnostic check loaded 3.57 key words on average because
same-q rows require full 14-word verification. Different-q observations still
mismatched after only 1.277 words on average.

## Official hard fixed window — 35333571

One instrumented 120000 ms window; TIMEOUT.

Observed:
- attempts: 16,944,881;
- initially empty: 4,055,815;
- busy: 174,076;
- unstable: 109,152;
- stable occupied: 12,605,838;
- different q: 11,970,966;
- same q / same exact value: **634,872**;
- same q / different exact value: **0**.

Identical exact republication:
- **3.747% of all store attempts**;
- 5.04% of stable occupied observations.

The hard table is occupied far more often (~76% including busy/unstable stable
observations), so a duplicate precheck would inspect a large population of
different q rows to eliminate fewer than 4% of store calls.

## Correctness observation

Across every census sample:
same-q / different exact value = **0**.

This is consistent with the exact-only shared-table invariant.

## Disposition

Do not add a duplicate-store equality guard.

The potential saving is too sparse relative to the mandatory equality work a
correct guard would add to occupied stores.

This is another case where the minimum-machinery result is to retain the existing
path.

## Next experiment — use the existing sharing-density control

The solver already supports deterministic hash sampling through
`sharedSampleMask`.

No new mechanism is required.

Run a fixed-source 4-worker sweep on `f549dcf...`:
- mask 0: full sharing;
- mask 1: approximately 1/2 admitted;
- mask 3: approximately 1/4 admitted;
- mask 7: approximately 1/8 admitted.

The same predicate controls optional shared reads/publications while private exact
search remains complete.

Measure whole-process cycles on exact controls first, then the official hard
fixed window. This directly trades shared reuse against probe/store/contention
cost using machinery that already exists and is already cycle-accounted.

PR #84 remains draft/open; no merge authorization follows.
