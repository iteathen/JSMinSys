# IsoMax worker hot-loop GitHub-VM baseline — 2026-09-27

Status: measurement baseline, no solver change.

## Provenance

Selected solver base: `a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`.

Measurement head: `992f00dbb67c8167673b1abe9c47e696e6695e2f`.
The base-to-head compare changes only the baseline workflow/harness files; no
`addons/**`, `src/**`, solver, CPC, cofactor, cache or live-line source changed.

GitHub Actions:
- workflow: IsoMax hot-loop baseline;
- run: `36340251823`;
- conclusion: success;
- runner: AMD EPYC 7763, Windows 10.0.26100;
- Node: 26.7.0;
- V8: 14.6.202.34-node.28;
- artifact: `10938632871`;
- artifact digest:
  `sha256:7d4c412f62ade12251bc46bb4a80310fd51c74a5c3a3d2c99b5dbbf7684dbeb8`.

The companion JSMinSys Verify run for the measurement head passed all three
jobs: verify, schema and node-compatibility.

Every sample used Windows QueryProcessCycleTime. No nominal-GHz conversion was
used. Each sample was a fresh process. Timing begins immediately before
`solveConnect4RbaAlphaBeta`; geometry, root construction and cache allocation
are excluded. The first solve is measured, so cold JIT behavior remains charged.

Solver-source SHA-256 values captured by every sample:

- `addons/rba-connect4-alphabeta.mjs`:
  `01d17eef2083c5ca589d2e3ab52aef15f21d6773e023505b26fe2675ead47966`
- `addons/rba-connect4-coordinate.mjs`:
  `217b4fd98e38a6b29fae32b6ee2bd0534b57a06217146f040a64f8f2d4b7858e`
- `addons/cpc-connect4.mjs`:
  `49c651223d1f6aa242f30955c00d63e16cb61b9c96503e921e4334dc92af4d05`
- `addons/connect4-live-line-evaluator.mjs`:
  `b949d659afa1e986e124cfa4930da972850dba060eec218e33f27be46863a495`
- `addons/rba-connect4-shared-exact-cache.mjs`:
  `e538f90a5a451288ae52b63f8e2bcf64f059003efdf3b9a9a7da09eda5a5b53f`

## Baseline design

Two single-evaluator paths were measured.

**local**
- 1,048,576 private exact entries;
- no shared exact cache;
- isolates the deep CPC/RBA/cofactor/live-line/search kernel.

**shared**
- same private cache;
- 4,194,304 shared exact entries;
- full sharing;
- one evaluator only, so shared probe/publication cost is retained without
  Lazy-SMP peer scheduling.

Fixtures:
- `45461667`: official Fhourstones completed control;
- `353335714`: longer derived losing child of official `35333571`.

A and B were the exact same source revision. These are A/A noise calibrations,
not speed comparisons.

## A/A noise calibration

### Short local — 6 ABBA blocks / 24 fresh processes

Deterministic work in every sample:
- 62,031 nodes;
- 62,065 cofactors;
- exact value +1 mover-relative / P0 win;
- zero-based root move 3.

Mean solve cycles: **0.890 B**.
Median solve cycles: **0.882 B**.
Mean cycles/node: **14,343**.

Paired A/A solve-cycle delta:
**+0.78%**, descriptive 95% interval **[-1.63%, +3.19%]**.

The short fixture is deliberately JIT/startup-sensitive and is not the primary
cycles/node baseline.

### Short shared — 6 ABBA blocks / 24 fresh processes

Deterministic work:
- 62,003 nodes;
- 62,037 cofactors;
- 29 shared hits;
- 42,699 shared stores;
- zero shared-store contention.

Mean solve cycles: **1.191 B**.
Median solve cycles: **1.139 B**.
Mean cycles/node: **19,209**.

Paired A/A solve-cycle delta:
**-1.49%**, descriptive 95% interval **[-4.32%, +1.34%]**.

### Long local — 2 ABBA blocks / 8 fresh processes

Deterministic work:
- 11,755,731 nodes;
- 11,813,310 cofactors;
- 3,298,018 exact-cache hits;
- 562,135 CPC exact conclusions;
- 2,427,250 CPC bounds;
- 2,179,175 CPC restrictions;
- 3,250,200 CPC forced events.

Mean solve cycles: **39.584 B**.
Median solve cycles: **39.421 B**.
Mean wall: **16.104 s**.
Mean cycles/node: **3,367.2**.
Median cycles/node: **3,353.4**.

The two-block A/A interval is intentionally wide and is not enough for a
small-effect candidate decision. Future candidate screens should use more
balanced blocks. The absolute long-local value is the governing hot-kernel
reference for the 50% campaign.

### Long shared — 2 ABBA blocks / 8 fresh processes

Deterministic work:
- 11,057,264 nodes;
- 11,112,978 cofactors;
- 724,588 shared hits;
- 1,192,134 shared stores;
- zero shared-store contention.

Mean solve cycles: **41.572 B**.
Mean wall: **16.913 s**.
Mean cycles/node: **3,759.7**.

Relative to long-local descriptive means, self-sharing:
- reduces visited nodes by about **5.94%**;
- increases solve cycles by about **5.02%**;
- increases cycles/node by about **11.66%**.

This is not a claim about multiworker cooperation. It establishes that shared
exact traffic is not free and should not be allowed to obscure local-kernel
economics.

## Separate CPU profile

The CPU profile was collected only after all timing completed and is excluded
from timing statistics. Long/local fixture; 10,871 sampled self-time events.

Top self-time attribution:

| Function/family site | Share |
|---|---:|
| `connect4RbaCofactorKnownHeight` | 44.76% |
| `searchCpcOnly` frame | 10.08% |
| `connect4RbaCofactorBasis` | 7.45% |
| `emitSortedSetBits32` | 7.30% |
| `collectSingletonProfiles` | 6.27% |
| exact-cache probe | 5.47% |
| `removeDensePrepared` | 3.00% |
| CPC nonterminal evaluator | 2.57% |
| key hash mix | 1.96% |
| canonicalization | 1.83% |
| fork preemption | 1.41% |
| live-line advance | 1.37% |
| `subsetDensePrepared` | 1.29% |
| live-line 3-word score | 0.43% |
| shared/local exact store | 0.23% |
| GC | 0.16% |

Grouping the directly cofactor-owned/cofactor-adjacent sites:

```text
connect4RbaCofactorKnownHeight
+ connect4RbaCofactorBasis
+ emitSortedSetBits32
+ removeDensePrepared
+ subsetDensePrepared
= 63.80% sampled self time
```

This closely reproduces the historical cofactor census (~64.93% inclusive
cofactor family) despite the newer endpoint-sharing and six-deep/one-wide
solver composition.

Grouped CPC sites account for about **10.62%** sampled self time; local
cache/hash sites about **7.66%**; live-line advance/scoring about **1.80%**;
canonicalization about **1.83%**. Sampling is directional attribution, not
retired-instruction accounting.

## Implication for the 50% campaign

With cofactor at approximately 63.8% of sampled self time, changing only the
cofactor family would have to leave at most about 21.6% of its current cost to
halve the whole loop:

```text
0.362 + 0.638*r <= 0.500
r <= 0.216
```

So the cofactor family would need roughly **78% reduction** if everything else
were unchanged.

The earlier dense-indexed cofactor result (~8.7% whole-process cycle reduction)
therefore remains useful but cannot by itself meet the owner target. It is a
first-stage mechanism to compose with current C1 absorption, followed by a
structural reuse census.

Next experiment plan:
`experiments/isomax-hotloop-baseline/NEXT_EXPERIMENT.md`.
