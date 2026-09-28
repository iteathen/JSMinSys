# IsoMax Phase-2 pure known-hash hot-helper result — 4 workers

Date: 2026-09-27
Status: specialization does not qualify as a completed exact-control improvement.

## Authority

Workflow:
`IsoMax Phase2 4-worker pure hot helper`

Run:
`36383201513` — success.

Artifact:
`10953203421`

Digest:
`sha256:22ec88be617421c074fd00b67ee037b05408b380d044b0c9b5216234229bd0c6`

Harness head:
`a834f59905c1b20d4d93752ed9189b8eb9363a71`

The measured solver revisions were frozen before benchmark-harness commits:

A — preferred pure coalesced known-hash reuse:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

B — mandatory-known-hash hot-helper specialization:
`9da33eb5146ea94dd0928c4632a7f91f0cda4b29`

B passed full Verify before timing:
run `36383046141` — success.

A later harness-only Verify also passed:
run `36383201474` — success.

## Topology

GitHub hosted Windows runner:
- `availableParallelism() = 4`;
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- rootFrontier=true;
- selected-profile shared/local cache settings unchanged;
- Node 26.7.0;
- no single-worker runs.

## Exact derived-long — 353335714

Eight balanced AB/BA blocks / 16 fresh processes.

All samples completed exactly with identical:
- root WDL: -1;
- root move: 4;
- winner worker: 2.

Means:

| metric | A pure hash reuse | B hot helper |
|---|---:|---:|
| process cycles | 55.703 B | 55.494 B |
| wall ms | 6,198.68 | 5,983.93 |
| CPU ms | 22,824.13 | 22,715.13 |
| all-worker nodes | 4.52310 M | 4.52182 M |
| cycles/node | 12,314.98 | 12,272.44 |
| shared hits | 517,127 | 516,954 |
| shared stores | 1,594,677 | 1,594,443 |
| shared store contention | 44,236 | 46,792 |
| RSS bytes | 366,622,720 | 366,979,584 |
| peak RSS bytes | 615,526,912 | 615,876,608 |

Paired B versus A:

- process cycles: **-0.371%**
  - 95% interval: **[-1.096%, +0.355%]**
- wall: -3.238%
  - 95% interval: [-8.055%, +1.580%]
- CPU: -0.470%
  - 95% interval: [-1.437%, +0.497%]
- nodes: -0.028%
  - 95% interval: [-0.684%, +0.629%]
- cycles/node: -0.342%
  - 95% interval: [-0.921%, +0.238%]
- shared hits: -0.035%, interval crosses zero
- shared stores: -0.014%, interval crosses zero
- contention: +6.468%, interval crosses zero
- RSS: +0.097%, interval crosses zero
- peak RSS: +0.057%, interval crosses zero

The primary authority is whole-process cycles. Its interval crosses zero.
Therefore this experiment does **not** establish a completed exact-control
whole-solve improvement.

The hot-helper split is exact and mechanically cheaper in its local helper
ledger, but the expected saving is too small relative to whole-run variance to
justify extra production surface under the minimum-machinery rule.

Disposition:
- retain `f549dcf...` as the preferred current Phase-2 candidate;
- do not promote the helper split from this evidence;
- keep PR #99 as experimental evidence unless later evidence gives it a larger
  structural role.

## Official hard fixed window — 35333571

Both arms timed out under the unchanged 120000 ms application ceiling.
No exact solve-speed ratio is admissible.

Fixed-window observations:

| metric | A pure hash reuse | B hot helper |
|---|---:|---:|
| process cycles | 0.97235 T | 1.12204 T |
| CPU ms | 398,376 | 459,109 |
| nodes | 109.824 M | 129.598 M |
| shared hits | 16.914 M | 20.586 M |
| shared stores | 15.113 M | 16.273 M |
| contention | 391,370 | 533,673 |
| cycles/node | 8,853.69 | 8,657.86 |

Descriptively B:
- processed about 18.0% more nodes;
- used about 2.21% fewer cycles/node;
- produced about 7.67% more shared stores;
- produced about 36.36% more shared-store contention.

Because both runs are censored and Lazy-SMP search paths vary materially across
hard-window samples, these values are workload observations only. They are not
an exact whole-solve ranking.

## Structural conclusion

The useful completed-tree optimization remains the earlier result:
reuse the already-computed q locator hash in existing shared exact operations.

Splitting compatibility and known-hash helper entry points removes a real local
test/branch, but this isolated removal is below the current whole-solve signal
threshold.

The next pass should target an operation class large enough to change whole-solve
economics, with measurement before added machinery. The remaining pressure
visible across hard workloads is shared store/probe traffic and contention, not
the compatibility branch itself.

PR #84 remains draft/open. This result does not authorize a merge.
