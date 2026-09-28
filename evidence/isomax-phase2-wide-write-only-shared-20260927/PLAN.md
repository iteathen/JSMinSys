# IsoMax Phase-2 wide-worker write-only shared-cache experiment

Date: 2026-09-27

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Authority:
shared-admission census artifact `10954970476`, digest
`sha256:6e50b0be62ec6ace7cd8fc89fc71256e00ccfc2121fddc1ea8bc547b08d3e2b0`.

## Measured premise

Across four exact derived-long census runs:
- worker 0 wide: 19.98% of shared probes, 0.27% of shared hits, 0.184% hit rate;
- deep workers: 15.23–17.83% shared hit rate.

Across two official-hard censored census windows:
- worker 0 wide: 14.83% of shared probes, 0.069% of shared hits, 0.0823% hit rate;
- deep workers: 20.51–20.96% shared hit rate.

## Candidate

Preserve one shared exact table.

Worker 0:
- remains wide/root-frontier;
- continues publishing exact rows to the shared table;
- does not probe shared exact after a local cache miss.

Workers 1..3:
- remain deep;
- retain normal shared exact read/write behavior.

Implementation boundary:
- private cache carries separate shared-write and shared-read pointers;
- default is identical pointers, preserving all non-specialized behavior;
- worker 0 nulls only the shared-read pointer at startup.

No source filtering.
No second table.
No solved-position prior.
No single-worker qualification.

## Qualification

Update canonical source, generated behavior/root-frontier mirrors, and NEES ledger
before timing.

Verify first.

Matched 4-worker A/B:
A = baseline `f549dcf...`
B = verified fixed candidate revision.

Primary exact fixture:
`353335714`.

Secondary:
`35333571`, unchanged 120000 ms ceiling.

Primary acceptance authority:
whole-process cycles on completed exact controls.
