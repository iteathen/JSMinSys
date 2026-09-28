# IsoMax Phase-2 coalesced hash isolation result — 4 workers

Date: 2026-09-27
Status: pure coalesced all-hot hash reuse is the current preferred exact-control candidate.

## Authority

Workflow:
`IsoMax Phase2 coalesced hash isolation`

Run:
`36381336035` — success.

Artifact:
`10953330974`

Digest:
`sha256:db55f11805785d66a07bb6cc56a285b76887d7dd47ea8c44509b602a84f99140`.

Runner:
- Windows Server 2025;
- Node 26.7.0;
- `os.availableParallelism() = 4`.

All arms used exactly:
- 4 search workers;
- worker 0 wide/root-frontier;
- workers 1..3 deep;
- rootFrontier=true;
- fixed selected-profile cache configuration.

No single-worker runs.

## Fixed source arms

A — retained coalesced + shared exact-draw winner:
`e449df20dc59cc6c1e5b2da78134751a2376f355`

B — pure coalesced solver with existing shared probe/store calls reusing the
already-computed q hash, no selective fallback:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

C — prior all-hot hash reuse plus all-noncutoff selective shared fallback:
`48c514e747cb2656666b951f97e0928dda501cf7`

B passed full Verify before timing:
run `36381250343`, all verify/schema/node-compatibility jobs green.

The benchmark controller reused the generic shared-hash runner, whose embedded
labels still name the older A/B/C experiment. Source SHAs above are the
authoritative arm identities for this run.

## Completed exact control — 353335714

Six balanced ABC/BCA/CAB blocks, 18 fresh processes.
All samples completed exactly with identical:
- root WDL: -1
- root move: 4.

Means:

| arm | process cycles | wall ms | CPU ms | nodes |
|---|---:|---:|---:|---:|
| A retained coalesced | 54.130 B | 5,731.30 | 22,106.3 | 4.511 M |
| B pure hash reuse | **53.352 B** | 5,761.69 | 21,823.0 | 4.503 M |
| C fallback + hash reuse | 53.390 B | 5,751.14 | 21,851.7 | **4.488 M** |

Paired B versus A:
- process cycles: **-1.432%**
- 95% interval: **[-2.679%, -0.186%]**
- wall: +0.525%, interval crosses zero
- CPU: -1.275%, interval crosses zero narrowly
- nodes: -0.175%, interval crosses zero
- shared hits/stores: statistically neutral.

Paired C versus A:
- process cycles: **-1.366%**
- 95% interval: **[-2.588%, -0.144%]**
- wall: +0.350%, interval crosses zero
- CPU: -1.150%, interval crosses zero
- nodes: -0.518%, interval crosses zero.

Direct paired B versus C:
- process cycles: **-0.055%**
- 95% interval: **[-1.886%, +1.777%]**

Therefore B and C are statistically indistinguishable on the completed exact
control. The selective fallback adds machinery but has not demonstrated an
incremental exact-control benefit beyond hash reuse.

Disposition:
- carry **B** forward as the simpler current candidate;
- do not carry selective all-noncutoff fallback into the preferred path from
  this evidence;
- keep C only as an experimental hard-workload clue.

## Official hard fixed window — 35333571

One ABC block under the unchanged 120000 ms application ceiling.
All three arms timed out, so no exact solve-speed ratio is admissible.

Fixed-window observations:

| arm | cycles | nodes | shared hits | shared stores | contention |
|---|---:|---:|---:|---:|---:|
| A retained coalesced | 1.10055 T | 126.690 M | 20.198 M | 16.344 M | 433,044 |
| B pure hash reuse | 1.13734 T | 133.107 M | 21.011 M | 16.983 M | 469,405 |
| C fallback + hash reuse | 1.12808 T | 131.981 M | 21.023 M | 16.696 M | 471,594 |

This censored block favors A descriptively and again disagrees with other hard
fixed-window samples. It is evidence of substantial Lazy-SMP search-path /
scheduling variance, not an exact ranking. Do not report an exact speed ratio
from this fixture.

## Structural conclusion

The exact gain survives after removing selective shared fallback.

That isolates the useful change:
- reuse the q locator hash already computed for the private direct-map slot;
- keep full shared q-key equality and sequence validation;
- keep shared cache exact-only;
- avoid introducing an extra shared probe after non-cutoff weak-bound hits.

The next cheapest pass is to remove the compatibility-path
`knownHash === undefined` selection from the hot known-hash calls while
retaining the compatibility APIs for callers that need local hash computation.

That specialization should be built from B, not from the fallback-based C arm.

PR #84 remains draft/open and is not authorized for merge by this result.
