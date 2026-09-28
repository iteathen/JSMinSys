# IsoMax Phase-2 selected-production qualification — 2026-09-27

Status: selected-production local/multiworker qualification strongly positive on completed controls; official hard GitHub gate remains censored.

## Sources

Control:
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`
— current selected six-deep/one-wide production head.

Candidate:
`00ecc7d20ed08ee9585c92aa8441a8ef3969b7ee`
— selected-production port of search-derived local LOWER0/UPPER0 only.

The candidate does **not** import:
- Stage-9 coordinate/cofactor research changes;
- private support-plan worker wiring;
- CPC-derived bound stores.

PR #84 Verify/schema/node compatibility: green.

## Workflow

`IsoMax Phase2 selected-production qualification`

Run: `36362491564` — success.

Artifact: `10946980664`

Digest:
`sha256:4b4a3175d320784c9700bd187aefc904873d70987a3054044c0d316fa3399271`.

Selected profile:
- 7 workers;
- six deep + one root-frontier;
- shared exact 4,194,304;
- local exact 1,048,576/worker;
- full sharing;
- rootFrontier=true;
- Node 26.7.0;
- Windows QueryProcessCycleTime.

## Short control — 45461667

Four ABBA blocks / 16 fresh processes. All samples exact with identical root WDL/move.

Paired candidate deltas:
- solve cycles: **-2.6410%**
- 95% interval: **[-5.1080%, -0.1740%]**
- wall: -1.4995%, interval crosses zero
- CPU: -1.9869%, interval crosses zero
- all-worker nodes: -1.9060%, interval crosses zero

Descriptive means:
- control cycles: 5.651 B
- candidate cycles: 5.501 B
- control nodes: 117,297
- candidate nodes: 114,916

No short-work regression is present; cycle result is mildly favorable.

## Derived long — 353335714

Eight ABBA blocks / 32 fresh processes. All samples exact with identical root WDL/move.

Paired candidate deltas:
- **solve cycles: -66.8335%**
- 95% interval: **[-67.2666%, -66.4004%]**
- **wall: -67.7437%**
- **CPU: -66.8700%**
- **all-worker nodes: -80.9210%**
- shared exact hits: -83.9670%
- shared exact stores: -4.7972%

Descriptive means:

| metric | selected control | zero-bound candidate |
|---|---:|---:|
| cycles | 181.722 B | **60.266 B** |
| wall ms | 21,549.39 | **6,939.80** |
| all-worker nodes | 28.947 M | **5.523 M** |
| winner nodes | 4.509 M | **0.856 M** |
| shared hits | 5.115 M | 0.820 M |
| shared stores | 2.096 M | 1.995 M |

The very large reduction in shared hits is not adverse: the local bound mechanism removes much more search than the lost shared evidence was avoiding.

## Official hard — 35333571

Two ABBA blocks / eight fresh processes, fixed 120-second application ceiling.

Every sample in **both arms timed out**.

No exact solve-speed ratio is admissible.

Censored fixed-window means:

| metric | selected control | zero-bound candidate |
|---|---:|---:|
| wall ms | 120,086.85 | 120,092.09 |
| process cycles | 1.06537 T | 1.06822 T |
| all-worker nodes | 158.697 M | **136.569 M** |
| shared hits | 25.682 M | 20.832 M |
| shared stores | 14.661 M | 22.261 M |

Descriptive candidate deltas over the same 120-second window:
- nodes: **-13.94%**
- process cycles: **+0.27%**
- shared hits: **-18.89%**
- shared stores: **+51.84%**

These are censored throughput observations only.

The candidate explores materially fewer nodes but spends more cycles/node / more local-bound-store work on this hard workload. The GitHub runner cannot establish an exact official-hard solve-speed result at the fixed ceiling.

## Overall disposition

The selected-production zero-bound port is strongly validated on:
- correctness / endpoint-cache privacy;
- short-control non-regression;
- derived-long seven-worker exact performance;
- direct-source and research-lane local controls.

The owner Phase-2 second-50% target is crossed decisively on the completed hard derived control.

However, the official hard production gate remains **censored**, not passed as an exact completion comparison, because both arms time out on the GitHub VM.

Therefore:
- retain PR #84 as the current production candidate;
- do not import support-plan worker wiring;
- do not add shared-exact-precedence machinery merely because shared hits fall;
- do not claim an exact official-hard speedup from this run;
- promotion review must explicitly decide whether the completed-control evidence is sufficient or whether an additional exact hard control / hardware-matched run is required.

This result must remain permanent evidence even if promotion is deferred.
