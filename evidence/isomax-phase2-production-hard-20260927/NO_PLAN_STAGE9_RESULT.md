# Phase 2 production-aligned Stage-9 official hard gate — censored

Date: 2026-09-27
Status: Stage-9 research line is not a production promotion base on official hard input.

## Arms

A — Stage-9 research denominator with **normal selected worker setup**, no private
support-plan arenas:

`10380f79af68dc1f57455d535814ac0a7eacea33`

B — direct zero-bound candidate with the same normal worker setup:

`dbac3d430414a90b8e31da9e0c640a06dfef596d`

Selected profile:
- 7 workers;
- six deep + one root-frontier;
- 4M shared exact;
- 1M local exact/worker;
- full sharing;
- fixed 120-second application ceiling.

Workflow run:
`36360840925` — success.

Artifact:
`10945927818`

Digest:
`sha256:b69942c941b1c58fbacb1a79b6aa56628a9c75c3adf4728c2fc60e1dd38dc78a`.

## Official hard input — 35333571

Two ABBA blocks / eight fresh Windows processes.

Every sample in both arms reached the fixed **120-second timeout**.

No exact A/B solve-speed ratio is admissible.

Censored means over the fixed time window:

| metric | Stage-9 | zero bounds |
|---|---:|---:|
| process cycles | 1.1687 T | 1.2020 T |
| all-worker nodes | 223.47 M | 205.07 M |
| shared hits | 36.70 M | 32.17 M |
| shared stores | 18.66 M | 27.06 M |
| CPU ms | 450,546.5 | 463,223.0 |

Descriptive candidate deltas:
- all-worker nodes: **-8.23%**;
- process cycles: **+2.85%**;
- CPU: **+2.81%**;
- shared exact hits: **-12.36%**;
- shared stores: **+45.00%**.

These are censored throughput observations, not exact solve ratios.

## Interpretation

The local Phase-2 zero-bound result remains real and the selected derived
seven-worker control `353335714` remains a strong workload-specific win.

However, the Stage-9 research stack itself no longer reproduces the selected
production solver's historical official-hard completion behavior. Therefore
Stage-9 must not be treated as the production promotion baseline merely because
it is the Phase-2 research denominator.

The promotion-oriented next step is to port **only the proven zero-bound
mechanism** onto the actual selected production revision
`a3cf7f9ca5c90e5025542c3b27ab0b735a610e9a`, preserving its selected
six-deep/one-wide search configuration and current production kernel.

Then compare selected production control versus selected+zero-bounds on:
1. `45461667`;
2. derived hard `353335714`;
3. official hard `35333571` under the unchanged 120-second ceiling.

Do not promote the local support-plan campaign or Stage-9 research stack as a
bundle.

## Disposition

- Stage-9 stays the Phase-2 **research denominator** for the second-50% campaign.
- Production promotion must be a separate port onto the selected production
  line.
- Preserve this negative result permanently; it prevents conflating research
  progress with production qualification.
