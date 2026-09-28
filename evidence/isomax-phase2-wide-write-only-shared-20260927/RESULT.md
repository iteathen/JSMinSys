# IsoMax Phase-2 wide-worker shared-write-only result

Date: 2026-09-27
Status: exact but not a qualified whole-solve improvement.

## Authority

A — preferred pure coalesced known-hash reuse:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

B — wide worker shared-write-only:
`0b533c151faf8e6208ff80ff30168d40066cd6e7`

B Verify:
`36389690107` — success.

Workflow:
`36389803032` — success.

Artifact:
`10956575348`

Digest:
`sha256:325191d0075ac8630daf82abd7e63ed4c42828a339ea9b599c295cd94841d825`

Topology:
- availableParallelism() = 4;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- no single-worker runs.

## Exact derived-long — 353335714

Eight balanced AB/BA blocks / 16 fresh processes.
All exact with root WDL -1 / move 4 and winner worker 2.

Means:

| metric | A baseline | B wide write-only |
|---|---:|---:|
| process cycles | 47.051 B | 46.941 B |
| wall ms | 5,360.90 | 5,372.03 |
| CPU ms | 20,521.9 | 20,412.5 |
| nodes | 4.53444 M | 4.53586 M |
| cycles/node | 10,376.39 | 10,348.96 |
| shared hits | 520,669 | 518,277 |
| shared stores | 1,596,199 | 1,594,680 |
| contention | 45,025 | 45,103 |

Paired B versus A:
- process cycles: **-0.230%**
  - 95% interval **[-0.982%, +0.522%]**;
- CPU: -0.523%, interval crosses zero;
- nodes: +0.032%, interval crosses zero;
- cycles/node: -0.262%, interval crosses zero;
- shared hits/stores/contention: intervals cross zero.

Whole-process cycles are primary authority. The interval crosses zero, so
wide-worker shared-read suppression does not establish an exact-control
whole-solve improvement.

Under minimum-machinery discipline, do not carry the extra sharedRead role split
into the preferred path from this evidence.

## Official hard fixed window — 35333571

Both arms timed out at 120000 ms. No exact solve-speed ratio is admissible.

A:
- 1.07107 T cycles;
- 151.585 M nodes;
- 23.988 M shared hits;
- 17.779 M stores;
- 569,564 contention;
- 7,065.78 cycles/node.

B:
- 1.07305 T cycles;
- 154.008 M nodes;
- 24.520 M shared hits;
- 17.920 M stores;
- 557,126 contention;
- 6,967.47 cycles/node.

Descriptively B used 1.39% fewer cycles/node and 2.18% less contention, but
searched 1.60% more nodes. Both samples are censored; this is not an exact
whole-solve ranking.

## Disposition

Retain `f549dcf...` as preferred.

The reader-role census proved worker 0 rarely benefits from shared reads, but
removing those reads alone is below whole-solve signal.

Before suppressing worker-0 shared publication as well, measure publisher
origin: how many shared rows worker 0 successfully publishes and how many later
deep-worker hits those rows serve. This avoids discarding potentially valuable
wide-to-deep evidence based only on reader statistics.

PR #84 remains draft/open; this result gives no merge authorization.
