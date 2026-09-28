# Phase 2 official hard seven-worker control — censored result

Date: 2026-09-27
Status: negative/inconclusive promotion gate; both support-plan-wired arms time out.

## Sources / selected profile

Control:
`fb81d1502f3921894ae70916f31f93956555bfe9`
— Stage-9 + private 262144-plan arena in all seven workers.

Candidate:
`ad871518f320d9fdb6c0da8352a9704614bdf261`
— zero bounds + identical private plan wiring.

Selected execution:
- 7 workers;
- six deep + one root-frontier;
- 4M shared exact;
- 1M local exact/worker;
- full shared sampling;
- fixed 120-second application ceiling.

Workflow run:
`36359599712` — success.

Artifact:
`10945003857`

Digest:
`sha256:a741472e4514a3e731590a3dd0a74ade1081d2a86c9d0b4992de74b9dcbac8fb`.

## Official hard input — 35333571

Two ABBA blocks / eight fresh processes.

Every sample in both arms reached the **120-second timeout**.

Therefore no exact A/B performance ratio is admissible.

Descriptive censored means:

| metric | control | zero-bound candidate |
|---|---:|---:|
| wall ms | 120131.851 | 120101.746 |
| process cycles | 1.0763 T | 1.1234 T |
| all-worker nodes | 264.51 M | 250.93 M |
| shared exact hits | 40.13 M | 36.30 M |
| shared exact stores | 20.26 M | 31.59 M |

Descriptive candidate deltas over the fixed 120-second window:
- all-worker nodes: about **-5.14%**;
- process cycles: about **+4.38%**;
- shared exact hits: about **-9.54%**;
- shared exact stores: about **+55.91%**.

These are censored throughput observations, not exact solve-speed ratios.

## Interpretation

The seven-worker win on the derived long control `353335714` remains valid for
that workload, but support-plan wiring does **not** pass the official hard
promotion gate under the selected 120-second ceiling.

The selected production profile historically does not attach the private
support-plan arena to its workers. Therefore the next promotion-oriented test
must remove that qualification-only wiring and compare:

A. Stage-9 denominator `10380f79...` with normal selected worker setup;
B. direct zero-bound candidate `dbac3d430...` with the same normal setup.

This isolates the actual production-relevant zero-bound effect and avoids
promoting a local-only support-plan representation that harms the hard
multiworker lane.

Do not extend the timeout to manufacture a pass. Preserve the selected
120-second application ceiling.

## Disposition

- preserve the support-plan-wired seven-worker result as workload-specific;
- do not promote support-plan wiring from this campaign;
- run production-aligned no-plan seven-worker A/B next;
- promotion review remains blocked pending that result.
