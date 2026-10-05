# Share all search-proven exact results: isolated localhost test

Solver commit: `e3eccf9` (full identity in invocation.json).

Only production change from win-cutoff-01: remove caller-full-window eligibility from the three existing proven-exact publication paths. Interior exact results and domain-extreme proofs now use the existing shared exact store regardless of the original window. Unresolved zero-threshold bounds and opposite-bound locally inferred draws remain local. The prior maximum-win cutoff is retained. No search bounds were added to the shared table. Nineteen search/lifecycle tests and catalog verification passed before measurement.

## Unchanged configuration

Empty standard 7x6, no RLC, four minimal/deep workers, no root frontier, sharedSampleMask=0. Shared TT capacity 134217728 (5 GiB payload); local capacity 16777216 per worker (528 MiB each). Same Node v27.0.0-nightly20260928b59840b593 / V8 14.6.202.34-node.36, i5-12600K, launch flags, clean environment policy and process affinity 85. Workers verified on logical CPUs 0,2,4,6 before solver initialization. Exact invocation and executable hash retained. Only source commit and output/temp paths changed from win-cutoff-01.

## Result and comparison

| Measurement | Win cutoff / restricted sharing | Win cutoff / all proven exact sharing |
|---|---:|---:|
| Internal wall ms | 600077.3766 | 600092.7367 |
| Process cycles | 8534934213229 | 8545180250180 |
| Shared hits | 10 | 328766256 |
| Shared successful stores | 46 | 614568445 |
| Shared store contention events | 0 | 3603253 |
| Peak RSS bytes | 2858475520 | 7697149952 |
| Result | TIMEOUT | TIMEOUT |

External wall 600562.1371 ms; process CPU 2317531.25 ms. No root WDL or move returned. Internal 600000 ms safety deadline fired; outer 650000 ms protection did not. Child exit status 2. Cleanup true, all four workers exited, and post-run process check found no remaining benchmark process.

Status: publication behavior verified; full-solve performance UNQUALIFIED. The restriction demonstrably suppressed shared exact publication and reuse. Restoring publication did not produce a completed solve within ten minutes. These are censored runs, so wall/cycle differences are not a solve-speed comparison. Shared hits and stores are operation counts, not node counts or unique occupied entries; contention counts failed store-lock attempts, not measured waiting time. High activity alone does not establish productive search progress or a speed benefit. No promotion to main and no additional optimization were performed.

Raw stdout/stderr, measurements, source status, affinity and preflight records are retained. The wrapper's generic timing description mentions RLC; this actual launcher performs none.
