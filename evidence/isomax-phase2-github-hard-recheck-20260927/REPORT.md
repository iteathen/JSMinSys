# IsoMax Phase-2 official hard fresh GitHub-VM recheck — 2026-09-27

Status: independent hosted rerun complete; official hard gate remains censored.

## Purpose

After the local-host official-hard run showed a large unexplained throughput
discrepancy, rerun the exact selected-production A/B on a fresh GitHub-hosted
Windows VM without changing solver sources, worker configuration or timeout.

## Fixed sources

A — selected production:
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`

B — selected production + search-derived local zero bounds:
`00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee`

Fixture:
`35333571`

Execution:
- 7 workers;
- six deep + one root-frontier;
- shared exact 4,194,304;
- local exact 1,048,576/worker;
- full sharing;
- rootFrontier=true;
- 120000 ms application ceiling;
- two ABBA blocks / eight fresh processes;
- no support-plan worker wiring;
- no Stage-9 research stack;
- no single-worker run.

## GitHub runner

Workflow:
`IsoMax Phase2 GitHub hard recheck`

Run:
`36367503033` — success.

Artifact:
`10948376993`

Digest:
`sha256:94da7756c7cf881adfeec19f9e97a1749de8da00b6833cb93006a1af32faf268`

Runner metadata:
- GitHub hosted runner version 2.337.0;
- Azure region westus3;
- Windows Server 2025 Datacenter 10.0.26100;
- image `windows-2025-vs2026` / 20260922.246.2;
- visible memory 16,771,836 KiB;
- Node v26.7.0;
- V8 14.6.202.34-node.28.

The PowerShell processor-table row did not render a usable processor model in
the retained log, so no CPU-model claim is made for this run.

## Result

Every sample in both arms reached the fixed 120-second application timeout.

Exact completions:
- A: 0/4
- B: 0/4

No exact solve-speed ratio is admissible.

### Fixed-window arithmetic means

| Metric | A selected control | B zero bounds |
|---|---:|---:|
| Process cycles | 1.181529505 T | 1.211757691 T |
| Wall ms | 120084.052 | 120073.990 |
| CPU ms | 455382.5 | 466992.25 |
| All-worker nodes | 284.810 M | 256.910 M |
| Shared exact hits | 46.217 M | 39.814 M |
| Shared exact stores | 23.207 M | 33.811 M |
| Shared store contention | 108259 | 210204 |
| Cycles/node | 4148.49 | 4716.66 |
| Nodes/second | 2.372 M | 2.140 M |
| Peak RSS | 889.3 MB | 886.5 MB |

Candidate fixed-window descriptive deltas:

- process cycles: **+2.558%**
- CPU: **+2.549%**
- all-worker nodes: **-9.796%**
- shared exact hits: **-13.856%**
- shared exact stores: **+45.696%**
- shared store contention: **+94.168%**
- cycles/node: **+13.696%**

These are censored fixed-window observations, not solve-speed ratios.

## Cross-environment comparison

This fresh GitHub VM is materially faster in node throughput than both:
- the earlier selected-production hosted hard run; and
- the recent local-host hard run.

Fresh hosted A:
- 284.810M nodes in ~120s, ~2.372M nodes/s.

Recent local A:
- 243.052M nodes in ~120s, ~2.024M nodes/s.

Earlier selected-production hosted A:
- about 158.697M nodes in ~120s.

Yet the historical selected local run completed the same fixture in ~83.133s
with about 412.369M nodes and ~4.960M nodes/s.

Therefore execution-environment variability is now independently reproduced:
the same selected source/configuration can show very different effective search
throughput across hosts/runs.

## Zero-bound interpretation

Across the recent local and fresh hosted hard runs, the candidate consistently:
- visits materially fewer nodes;
- receives fewer shared exact hits;
- performs many more shared stores;
- costs substantially more cycles per node.

On this official-hard workload the tree reduction has not yet translated into
an exact completion inside 120s.

This does not invalidate the large exact wins on `353335714`; it does mean the
official-hard promotion gate remains unmet and the mechanism should not be
promoted solely from the completed derived-long result.

## Disposition

- retain PR #84 as an experimental production candidate;
- official `35333571` gate remains **CENSORED / NOT PASSED**;
- do not claim an official-hard speedup;
- preserve the fresh hosted rerun as independent evidence;
- investigate the hard-workload economics: bound-store pressure, cycles/node,
  and interaction with shared exact reuse;
- preserve the large completed-control improvements as separate evidence.

No solver source changed in this recheck.
