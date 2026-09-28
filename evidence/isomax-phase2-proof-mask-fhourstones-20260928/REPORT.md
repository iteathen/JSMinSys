# IsoMax proof-mask comparison on standard Fhourstones inputs

2026-09-28 local-host follow-up requested by the owner. Both revisions solved
**1/4 inputs correctly**; the remaining three inputs timed out at the unchanged
120-second application limit. This is an incomplete standard-input benchmark,
not an official Fhourstones implementation score and not a promotion result.

## Fixed solver sources and method

- A selected baseline: be7c2887defcefb37080fa61de7ce1dc38dc2990.
- B proof-mask candidate: 7f74e324457c4237590bc6b0f924852f6d728e4c.
- Four workers: worker0 wide/root-frontier; workers1..3 deep Lazy SMP.
- Shared cache4194304; private1048576 per worker; sharedSampleMask0.
- One AB pair per input, official input order, eight fresh processes total.
- Windows11Pro10.0.26200; Intel i5-12600K,10 physical/16 logical cores;
  RAM34088599552 bytes; Node26.7.0, V8 14.6.202.34-node.28.
- Windows QueryProcessCycleTime across all process threads, existing whole
  operation bracket, including startup/JIT/search/cleanup. No hot instrumentation.
- Both pinned worktrees clean before every sample and after the suite.
- Source correctness previously qualified:180 tests,24757 differential evaluations,
  hosted Verify36464380804. This follow-up changes no solver source.

[Official Fhourstones3.1 source](https://tromp.github.io/c4/fhour.html) specifies
45461667 win,35333571 loss,13333111 draw,empty win. All roots have P0 to move.
These exact inputs were used;353335714 was not substituted. The reference's
node counts and throughput are not directly comparable to aggregate IsoMax
parallel visits, which include repeated work.

## Measured results
| Input | Arm | Status/WDL | Wall s | CPU s | Visits | M visits/s | Cycles/visit | Process cycles (billions) |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 45461667 | A | EXACT / 1 | 0.170 | 0.969 | 121210 | 0.713 | 27742.3 | 3.363 |
| 45461667 | B | EXACT / 1 | 0.169 | 0.938 | 119404 | 0.709 | 28201.3 | 3.367 |
| 35333571 | A | TIMEOUT | 120.029 | 442.203 | 216797914 | 1.806 | 7514.5 | 1629.123 |
| 35333571 | B | TIMEOUT | 120.036 | 445.125 | 218238709 | 1.818 | 7512.5 | 1639.520 |
| 13333111 | A | TIMEOUT | 120.044 | 442.406 | 197370374 | 1.644 | 8268.3 | 1631.909 |
| 13333111 | B | TIMEOUT | 120.056 | 443.765 | 198451015 | 1.653 | 8246.9 | 1636.613 |
| Empty | A | TIMEOUT | 120.026 | 442.468 | 258629043 | 2.155 | 6296.8 | 1628.544 |
| Empty | B | TIMEOUT | 120.044 | 444.015 | 263558413 | 2.196 | 6214.0 | 1637.764 |

Both exact samples returned rootWdl=1 and move=3 (zero-based column index).
All timeout samples returned rootWdl=null, move=-1, HOST_DEADLINE102.
All eight reported cleanup=true, four workers exited, no worker errors, and
positive safe-integer visit counts for every worker. No benchmark processes
remained after completion. No retry or solver/configuration change occurred.

On the only completed pair, candidate process cycles changed +0.140% and wall
changed -0.936%. One observation per arm supplies no confidence interval and
cannot establish a small speed difference. The six censored samples only describe
fixed-window work; they do not support exact solve-speed ratios or proximity to
completion. Do not sum censored cycles into a completed-suite performance score.

This follow-up does not overturn the earlier eight-pair353335714 qualification
rejection. PR118 remains closed without merge; selected baseline remains be7c2887.
No production PR84 promotion and no cumulative50% improvement claim.

## Harness incident and preservation

The original exact-comparison controller stopped after baseline35333571 because
its blanket nonzero-errorCode rejection included the legitimate deadline102.
The actual solver exited normally with cleanup=true and all four workers joined.
That raw result and the controller stderr remain in35333571/processes.jsonl and
35333571.stderr.log. The cold suite driver was corrected to admit only
TIMEOUT/102 or EXACT/0 with lifecycle checks. It reused every completed raw record
and resumed at candidate35333571. No sample was discarded or rerun.

The measured source sample runner, timing bracket, configuration and both source
SHAs were unchanged. Missing per-case old-controller summaries after the incident
are superseded by the full eight-row samples.jsonl and summary.json here.

## Evidence and reproduction

Raw stdout/stderr per process: <input>/processes.jsonl. Full parsed records:
samples.jsonl. Aggregate checks:summary.json. Host:environment.json.
run.mjs preserves raw output before classification and skips recorded samples.
analyze.mjs checks status/oracles/lifecycle and produces the table and hashes.
hashes.json uses LF-normalized UTF-8 bytes, so Git CRLF checkout conversion does
not break verification. No binary artifacts are included.

Use Node26.7.0 on Windows. From the repository root, with the two clean fixed
worktrees named in run.mjs, run the evidence driver and then analyze.mjs.
Use a new evidence directory for a new measurement; existing raw records are
replayed only for validation, never silently overwritten.
