# IsoMax Phase-2 shared hash reuse result — 4 workers

Date: 2026-09-27
Status: all-hot known-hash reuse is the current exact-control optimization winner.

## Topology

GitHub hosted Windows runner reported `availableParallelism() = 4`.

Every arm used:
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- rootFrontier=true;
- shared exact capacity 4,194,304;
- local exact capacity 1,048,576/worker;
- full sharing.

No single-worker runs.

Workflow:
`IsoMax Phase2 4-worker shared hash reuse`

Run:
`36379171950` — success.

Artifact:
`10952570017`

Digest:
`sha256:1569da67427f7a2190bfaa7607b8042b7090a72dbd3199ea92f8c9b4449c25cd`.

## Arms

A — retained same-q coalescing + shared exact-draw publication:
`e449df20dc59cc6c1e5b2da78134751a2376f355`

B — all-noncutoff shared-exact fallback:
`4161b37e949adf05d3e10978547a40adf15a2743`

C — fallback shared-probe known-hash reuse:
`2cf45625023877072a9a4e6f4e2667a7aee7b4c2`

D — all-hot shared probe/store known-hash reuse:
`48c514e747cb2656666b951f97e0928dda501cf7`

C and D passed Verify before timing. Reusing the locator hash does not replace
shared full-q equality or sequence validation.

## Exact derived-long — 353335714

Four balanced blocks / 16 fresh processes.
All samples completed exactly with identical:
- root WDL: -1
- root move: 4.

Mean measurements:

| arm | cycles | wall ms | CPU ms | nodes | cycles/node |
|---|---:|---:|---:|---:|---:|
| A retained | 57.283 B | 5,782.53 | 22,145.0 | 4.526 M | 12,657.3 |
| B fallback | 56.812 B | 6,001.72 | 21,961.0 | 4.474 M | 12,697.1 |
| C fallback KH | 57.234 B | 5,709.88 | 22,094.3 | 4.517 M | 12,671.2 |
| D all-hot KH | **56.086 B** | **5,628.78** | **21,644.5** | 4.504 M | **12,452.7** |

Paired changes versus A:

### B — all-noncutoff fallback
- process cycles: -0.820%
- 95% interval: [-2.469%, +0.830%]
- nodes: -1.128%
- cycles/node: +0.314%

No completed-tree whole-solve win is established.

### C — fallback known-hash only
- process cycles: -0.081%
- 95% interval: [-1.413%, +1.252%]
- nodes: -0.191%
- cycles/node: +0.110%

No completed-tree whole-solve win is established.

### D — all-hot known-hash reuse
- process cycles: **-2.088%**
- 95% interval: **[-2.915%, -1.262%]**
- wall: **-2.649%**
- 95% interval: **[-4.776%, -0.523%]**
- CPU: **-2.260%**
- 95% interval: **[-2.958%, -1.561%]**
- nodes: -0.479%
- 95% interval crosses zero
- cycles/node: **-1.617%**
- 95% interval: **[-2.016%, -1.218%]**

This is a completed exact-control whole-process win. D supersedes A as the
current exact-control optimization candidate.

## Official hard fixed window — 35333571

One balanced A/B/D/C block under the unchanged 120-second application ceiling.

All four arms timed out. Therefore no exact solve-speed ratio is admissible.

Fixed-window observations:

| arm | cycles | nodes | shared hits | shared stores | contention | cycles/node |
|---|---:|---:|---:|---:|---:|---:|
| A retained | 1.0290 T | 117.437 M | 18.130 M | 15.738 M | 403,498 | 8,762 |
| B fallback | 1.1857 T | 137.249 M | 21.727 M | 17.163 M | 589,626 | 8,639 |
| C fallback KH | 1.1954 T | 138.052 M | 22.064 M | 17.309 M | 613,867 | 8,659 |
| D all-hot KH | 1.1879 T | 138.983 M | 22.324 M | 17.307 M | 636,432 | **8,547** |

This single censored block reverses the earlier all-noncutoff hard lead:
A searched much less of the tree during the same wall window while D had the
lowest cycles/node. Lazy-SMP scheduling/search-path variance therefore remains
large on this censored fixture.

Do not use these censored ratios as an exact whole-solve ranking.

## Interpretation

The exact-control win is primarily a cost win:
- D reduced cycles/node by about 1.62%;
- node count was statistically neutral;
- full q equality and shared sequence validation were preserved.

The remaining obvious overhead is the compatibility selection inside each
shared helper:

    knownHash === undefined ? mixSpan32Locator32(...) : knownHash

Hot production callers already have the hash. They still pay one test/branch
per shared probe/store solely to support callers that do not.

## Next experiment

Keep existing public/default shared helpers unchanged for compatibility.

Add internal mandatory-known-hash hot helpers for:
- shared exact probe;
- shared exact store.

The hot helpers:
- accept the already-computed hash unconditionally;
- do not execute the undefined/default-path selection;
- retain full key/sequence validation and all atomic operations.

Update canonical alpha-beta, generated behavior/root-frontier mirrors, and the
NEES cycle ledger in the same work.

Benchmark the specialization directly against D. Whole-process cycles on
completed exact controls remain primary authority.

Do not merge PR #84 from this result alone.
