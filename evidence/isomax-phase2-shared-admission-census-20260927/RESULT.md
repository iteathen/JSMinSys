# IsoMax Phase-2 shared admission/source census result

Date: 2026-09-27
Status: census complete; wide-worker shared-read suppression is the next clean A/B hypothesis.

## Authority

Preferred solver measured:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Workflow:
`36385737656` — success.

Artifact:
`10954970476`

Digest:
`sha256:6e50b0be62ec6ace7cd8fc89fc71256e00ccfc2121fddc1ea8bc547b08d3e2b0`

Verify:
`36385737580` — success.

Topology:
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- availableParallelism() = 4;
- no single-worker runs.

Instrumentation changes execution cost/interleaving. Timing, process cycles,
throughput, and node-rate measurements from this census are invalid and are not
used below.

## Exact derived-long — 353335714

Four instrumented solves, all exact with root WDL -1 / move 4.

Aggregated shared probes:
- total: 15,137,065
- hits: 2,047,334
- empty: 10,699,551
- key mismatch: 2,349,285
- busy/unstable: 40,895

### Reader-role asymmetry

Wide worker 0:
- probes: 3,025,008 = **19.98%** of all shared probes;
- hits: 5,579 = **0.27%** of all shared hits;
- hit rate: **0.184%**.

Deep workers:
- worker 1 hit rate: 17.50%;
- worker 2 hit rate: 15.23%;
- worker 3 hit rate: 17.83%.

Thus the wide worker pays roughly one fifth of exact-control shared-probe traffic
while receiving almost none of the shared-cache benefit.

### Publication-source economics

Aggregated successful stores / later hits:

| source | attempts | successes | hits | hits/success |
|---|---:|---:|---:|---:|
| CPC exact | 2,635,450 | 2,565,035 | 462,360 | 0.180 |
| directed fail-high +1 | 2,708,849 | 2,633,928 | 1,084,779 | 0.412 |
| completed exact branch | 1,150,813 | 1,116,735 | 393,404 | 0.352 |
| coalesced exact draw | 55,181 | 54,945 | 106,790 | **1.944** |

Semantic-collapse and forced-terminal-full-window publication classes recorded
zero attempts on these fixtures. Unclassified stores were also zero, confirming
the instrumented source set covered all observed shared stores.

Coalesced exact draws are especially dense evidence: under 1% of store attempts
but more than 5% of observed shared hits. Do not suppress this source.

## Official hard fixed window — 35333571

Two 120-second instrumented windows; both timed out. Only provenance ratios are
used.

Aggregated shared probes:
- total: 214,027,951
- hits: 37,772,021
- key mismatch: 150,837,234.

Wide worker 0:
- probes: 31,731,165 = **14.83%** of all shared probes;
- hits: 26,101 = **0.069%** of all shared hits;
- hit rate: **0.0823%**.

Deep workers:
- hit rates: 20.96%, 20.51%, 20.65%.

Publication-source reuse:
- CPC exact: 2.067 hits/success;
- directed fail-high +1: 0.806;
- completed exact branch: 0.423;
- coalesced exact draw: **53.30**.

Again, coalesced exact draws are extremely high-value shared evidence.

## Structural conclusion

The strongest measured waste is not a publication class. It is a **reader role**.

Worker 0 intentionally searches wide/root-frontier territory. Its overlap with
the deep Lazy-SMP workers is low enough that shared exact probing is almost
always a miss:
- exact fixture: ~20% of probes for ~0.27% of hits;
- hard fixture: ~15% of probes for ~0.07% of hits.

Deep workers, in contrast, obtain substantial shared-hit rates and should retain
normal shared reads.

## Next clean A/B

Keep worker 0 shared publication enabled so its exact discoveries remain
available to deep workers, but disable shared exact **reads** for worker 0.

Topology remains:
- worker 0: wide + shared-write-only;
- workers 1..3: deep + normal shared read/write.

No source filtering, second table, solved-position prior, or single-worker
qualification.

Acceptance remains whole-process cycles on completed exact controls. The hard
fixture remains fixed-window/censored evidence when it does not complete.
