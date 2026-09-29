# C1 adverse short-control screen; deeper qualification pending

## Owner correction after initial disposition

The initial rejection below was too broad. A roughly 3.2-second completed
7x6 control establishes only the measured effect on that workload. It does
not establish economics on larger, branch-heavy searches. The original raw
samples and ratios remain unchanged. Current disposition is
ADVERSE_SHORT_CONTROL_DEEP_QUALIFICATION_PENDING, not a campaign-wide rejection.
Candidate source 37d369c remains preserved. Selected source remains restored
while the candidate is unqualified. Further tests are paused at owner direction.
Before retention or rejection across the intended workload, include deeper
completed 7x6 controls and a bounded branch-heavy workload, with unchanged
selected profile and total-process-cycle accounting. Censored throughput alone
cannot establish whole-solve improvement.

Question: does trusting CPC_EXACT eliminate a repeated interval equality test
profitably? The contract is valid, but the measured candidate is not selected.

Control: 6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e.
Candidate: 37d369c9c73a3302af0c850da63ee1e97f2f72ca.
Launcher/packet checkpoint: 76fc7c9.

Unchanged selected profile: i5-12600K, Windows, pinned Node
v27.0.0-nightly20260928b59840b593, four pinned P-core workers (one wide, three
deep), 10 GiB shared TT, 576 MiB private cache each, full sharing.
Counter: QueryProcessCycleTime, whole host/worker solve including startup and
cleanup. Environment and exact invocation are in each raw manifest.

ABBA, four fresh processes, standard 7x6 maintained exact control `353335714`:

| Metric | A mean | B mean | B/A delta |
|---|---:|---:|---:|
| Process cycles | 47,676,145,572 | 49,470,549,112 | +3.764% |
| Wall ms | 3152.98 | 3279.18 | +4.002% |
| CPU ms | 13024 | 13313 | +2.219% |
| All-worker nodes | 4,640,993 | 4,651,892.5 | +0.235% |
| Cycles/node | 10,272.73 | 10,634.46 | +3.521% |
| Shared hits | 441,450.5 | 443,409 | +0.444% |
| Shared stores | 1,569,687 | 1,572,283.5 | +0.165% |

Adjacent balanced pair cycle ratios: 1.0498165, 1.0256213.
Every sample EXACT, absolute P0 WDL -1, zero-based move 4; all four workers
contributed and exited, cleanup true, no errors. No single-worker timing.

Historical initial disposition was rejection after this screen; the owner
correction above supersedes that decision. This is not an eight-pair population
qualification or a claim that the idea loses on every position. No speedup claim.
The precise JIT/layout mechanism is unmeasured; fewer source operations did not
yield lower observed whole-operation cost. Selected runtime is restored.

Source accounting: -(N-E)*(C(control.test.u32)+C(control.branch)) in each of
the canonical/behavior/frontier CPC-only recursive units; no new recurring
operations. The generator's expected polarity-site count changed 2 to 1;
its cold substitution algorithm did not change. All source seals regenerated.
An invariant being true does not guarantee a profitable compiled-code change.

Correctness: 182 tests passed; seeded CPC exact-kind contract controls passed
on stable and pinned nightly Node. Catalog 298 functions + 170 add-on units,
generated freshness, root-frontier audit, runtime-geometry audit passed.
`verify.log` retains full stable-runtime output. No claim of hosted CI here.

Raw evidence is in ../isomax-memory-affinity-20260928/cpc-kind-screen-*:
raw stdout/stderr JSONL, parsed samples, machine/runtime/affinity manifests,
and per-worker placement records. Packet files here reproduce ordering and SHAs.
SCREEN.json is the arithmetic summary; no data discarded.

The generic four-front path still needs its post-refinement exactness check.
Do not infer that it is redundant from the narrower CPC-only invariant.
