# IsoMax Phase-2 selective shared-fallback screen — 4 workers

Date: 2026-09-27
Status: all-noncutoff fallback is a hard-workload lead, not an exact derived-long win.

## Baseline

Current coalesced+shared-draw winner:
`e449df20dc59cc6c1e5b2da78134751a2376f355`

## Candidates

B — shared exact fallback only when the private weak bound is a complete alpha/beta no-op.

C — shared exact fallback after every non-cutoff private weak-bound hit.

Both preserve:
- immediate weak-bound cutoffs without shared lookup;
- 1-wide + 3-deep topology on 4-vCPU GitHub;
- exact shared-cache semantics;
- no new table.

PR #89 and #90 Verify/schema/node-compatibility: green after updating the
root-frontier generator to preserve int32 polarity on the new shared-exact
return path.

Workflow:
`IsoMax Phase2 4-worker shared fallback`

Run:
`36377402344` — success.

Artifact:
`10951536910`

Digest:
`sha256:c041744933f3c09a15fbf629c5efa5fbac9f0bec7ddfb29c5dff88af3aa6537a`.

## Exact derived-long — 353335714

Six balanced blocks / 18 fresh processes. All arms exact with identical root
WDL/move.

### B no-op-only vs A
- cycles: +0.065%, interval [-1.442%, +1.572%]
- wall: -0.120%, interval crosses zero
- nodes: -0.084%, interval crosses zero
- shared hits: +0.964%, interval [ +0.043%, +1.884% ]

No whole-solve improvement.

### C all non-cutoff vs A
- cycles: +0.366%, interval [-1.667%, +2.398%]
- wall: -1.567%, interval crosses zero
- nodes: -0.256%, interval crosses zero
- shared hits: +0.965%, interval crosses zero

No exact derived-long improvement.

## Official hard fixed window — 35333571

One block, 120-second ceiling. All three arms timed out, so no exact solve ratio
is admissible.

Fixed-window observations:

| arm | cycles | nodes | shared hits | shared stores | contention |
|---|---:|---:|---:|---:|---:|
| A coalesced | 1.1244T | 126.601M | 20.029M | 16.143M | 579,960 |
| B no-op | 1.1060T | 123.714M | 19.457M | 15.950M | 520,468 |
| C all non-cutoff | **0.9580T** | **106.395M** | 16.423M | **14.799M** | **399,836** |

Descriptive C vs A:
- process cycles: **-14.80%**
- CPU: **-14.68%**
- nodes: **-15.96%**
- shared stores: **-8.32%**
- shared contention: **-31.06%**

No-op-only B is much weaker.

## Interpretation

Selective shared-exact recovery does not help the completed derived-long tree
enough to pay for its additional probes.

However, on the much harder censored tree, probing shared exact after every
non-cutoff weak-bound hit materially reduces search, store traffic and
contention. This is a strong workload-specific lead.

The remaining overhead is structurally obvious: every fallback shared probe
currently recomputes the full q hash even though `searchCpcOnly` already has
`cacheHash` for the same q.

The same duplicate hash exists on ordinary local-miss shared probes and shared
exact stores: local search already carries the full hash, but the shared-cache
helper hashes the q again.

## Next experiment

Carry the already-computed hash into shared exact probe/store operations.

Test:
1. current all-noncutoff fallback;
2. shared-probe known-hash reuse;
3. shared-probe + shared-store known-hash reuse.

Correctness is unchanged because the shared slot still performs full key
equality/sequence validation. Hash reuse changes only locator recomputation.

Do not claim the hard fixed-window lead as an exact solve-speed result.
