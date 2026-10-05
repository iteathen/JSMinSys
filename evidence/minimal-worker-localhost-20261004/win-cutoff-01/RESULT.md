# Winning-value cutoff: isolated localhost full-solve test

Solver commit: `f41cd2829573e7b89bbc57f2326ae9a8490a97a5`.

Only production change from the two censored baseline runs: stop the move loop when `best===1`, in addition to its existing alpha-beta cutoff. The pending MW-001B cache-sharing experiment was saved outside the checkout and was not applied. A four-worker immediate-win regression failed with a five-second timeout before the fix and passed after it; all 19 search/lifecycle tests and catalog verification passed.

## Configuration

Same launcher and measurement wrapper as baseline-02; invocation.json records the exact command, executable hash, environment, source identity and output paths. Empty standard 7x6 root, no RLC, four minimal/deep workers, no root frontier, sharedSampleMask=0, shared TT 134217728 entries (5 GiB payload), private TT 16777216 entries per worker (528 MiB each). Runtime Node v27.0.0-nightly20260928b59840b593 / V8 14.6.202.34-node.36, i5-12600K. Process affinity 85; all four workers independently verified on logical processors 0,2,4,6 before solver initialization. No memory flags added.

Only run-specific output/temp paths and recorded source commit changed in the invocation. Diagnostic cache sizes from the immediate-win test were not used for this full solve.

## Result

- Internal solver wall: 600077.3766 ms.
- External process wall: 600194.1589 ms.
- Process cycles: 8534934213229.
- Process CPU: 2315468.75 ms.
- Peak RSS: 2858475520 bytes.
- Status: TIMEOUT, internal safety deadline 600000 ms; no root WDL or move returned.
- Shared cache: 10 hits, 46 stores, 0 contention events.
- Clean shutdown: true, four workers exited; post-run process check saved.
- Child exit status 2 denotes unresolved solve. The outer 650000 ms deadline did not fire.

Baseline-01 and baseline-02 also timed out at approximately 600091 ms, with 11/51 and 11/53 shared hits/stores respectively, and 8575445837173 / 8581784607918 process cycles. These are censored runs, not completed solve times. Cycle differences at the safety limit do not demonstrate faster solving or equivalent progress.

The defect correction remains correctness/regression verified, but full-solve performance is UNQUALIFIED. It did not restore the expected solve time. No additional candidate was applied or benchmarked in this test. Raw stdout/stderr, affinity reports and OS measurement are retained alongside this report. The generic wrapper's timing-boundary description mentions RLC; this invocation uses the unchanged minimal-worker launcher and performs no RLC.
