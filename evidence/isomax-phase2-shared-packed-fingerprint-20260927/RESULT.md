# IsoMax Phase-2 packed shared-hash fingerprint result

Date: 2026-09-27
Status: exact but not a qualified whole-solve improvement.

## Authority

A — preferred pure coalesced known-hash reuse:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

B — packed shared fingerprint:
`5ed5a7e3c1b53e9558e223efe881f4f554ed9b2f`

B Verify:
`36391619969` — success.

Benchmark workflow:
`36391870306` — success.

Artifact:
`10956544344`

Digest:
`sha256:188b116441b73c24da47527a06f35761b7d264e9db202e8cfe4955ae104e6bef`

Topology:
- availableParallelism() = 4;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- no single-worker runs.

## Exact derived-long — 353335714

Eight balanced AB/BA blocks / 16 fresh processes.
All samples exact with root WDL -1 / move 4 and winner worker 2.

Means:

| metric | A baseline | B fingerprint |
|---|---:|---:|
| process cycles | 54.107 B | 54.030 B |
| wall ms | 5,910.65 | 6,125.53 |
| CPU ms | 22,109.3 | 22,095.9 |
| nodes | 4.49499 M | 4.47965 M |
| cycles/node | 12,037.14 | 12,061.91 |
| shared hits | 518,284 | 515,729 |
| shared stores | 1,593,136 | 1,590,722 |
| contention | 40,800 | 40,212 |

Paired B versus A:
- process cycles: **-0.136%**
  - 95% interval: **[-1.575%, +1.303%]**;
- nodes: -0.341%, interval crosses zero;
- cycles/node: +0.208%, interval crosses zero;
- shared hits/stores/contention: intervals cross zero.

Whole-process cycles remain primary authority. The interval crosses zero, so the
packed fingerprint does not establish a completed exact-control improvement.

## Official hard fixed window — 35333571

Both arms timed out at 120000 ms. No exact solve-speed ratio is admissible.

A:
- 1.13473 T cycles;
- 132.188 M nodes;
- 21.056 M shared hits;
- 16.700 M stores;
- 492,549 contention;
- 8,584.20 cycles/node.

B:
- 1.13688 T cycles;
- 132.690 M nodes;
- 21.054 M shared hits;
- 16.776 M stores;
- 527,375 contention;
- 8,567.94 cycles/node.

Descriptive only:
- cycles +0.190%;
- nodes +0.380%;
- cycles/node -0.189%;
- contention +7.07%.

## Structural interpretation

The admission census showed that occupied-slot full-key mismatch is common, but
this experiment shows that a separate fingerprint check is not a measurable
whole-solve win.

The missing variable is comparison depth. The current full-q check exits on the
first mismatching key word. If most collisions reject on word 0 or 1, the
existing mismatch path is already much cheaper than the phrase "full-key
mismatch" suggests, and adding a fingerprint load/XOR/shift/test merely moves
cost forward.

## Disposition

Retain `f549dcf...` as the preferred Phase-2 candidate.
Do not carry the packed fingerprint into the preferred path.

Next measure the shared-cache mismatch-prefix distribution:
- mismatch word index;
- number of key words loaded per occupied-slot rejection;
- full-key matches;
- exact and hard fixtures.

Do not add more collision machinery until this measurement establishes that key
comparison itself is materially expensive.

PR #84 remains draft/open; this result gives no merge authorization.
