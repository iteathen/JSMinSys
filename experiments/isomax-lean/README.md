# IsoMax deep worker without reporting in search

Entry point: `host.mjs`, export `runLazySmpConnect4Rba32`.
This is the separately qualified optimization candidate. The locked main
version and all existing `src/` and `addons/` files remain unchanged.

The candidate specializes the **released deep** implementation for standard
7x6, baseline CPC, compact shared/private TT and shared sample mask zero.
All workers are deep. `rootFrontier:true`, alternative CPC options and other
geometries are rejected at initialization. The worker still supports the
existing STOP behavior flag; this profile does not implement dynamic wide
roles. The existing wide implementation remains separate.

Removed from the candidate's recursive path and callees:

- Shared TT statistics atomics (TT seqlocks and key/value atomics remain).
- Node, cutoff, cache-hit, cofactor and aggregate CPC diagnostic updates.
- Horizon tests, unfinished-frontier propagation and repeated root passes.
- Fixed compact-key, shared-cache sampling, move-packing, live-line word-width
  and CPC-option branches.

The generator derives the candidate from the locked source, specializing the
declared configuration and retaining full-window root probes, root tie-breaking,
forced transit, CPC intervals/masks, key identity and TT publication rules.
Production `addons/cpc-connect4.mjs` is unchanged. CPC diagnostics are removed
only in the generated candidate; semantic counters/masks are retained.

Exact node/hit counts are unavailable (`null`), not zero. Timing and Windows
CPU/cycle/RSS accounting occur outside recursive search. There is no sampling
or hidden reporting callback in the node loop. This does not claim zero total
measurement overhead: the cold operation boundaries still read clocks.

Build/check: `node experiments/isomax-lean/build.mjs [--check]`.
Tests: `node --test test/isomax-lean.test.mjs`.
Measurement: `node experiments/isomax-lean/measure.mjs`.

Measurement protocol frozen before replay: sequential **A B B A**, where A is
the unchanged released four-deep baseline and B is this candidate. Each starts
empty, computes the structural prefix once, and invokes one exact root solve.
Same historical Node nightly, affinity targets 0/2/4/6, 5 GiB shared TT,
576 MiB private TT per worker, 300-second per-solve ceiling. The clock includes
structural work and the complete host invocation, including allocation, worker
creation and cleanup, as in the prior benchmark. This change does not redesign
the host lifecycle into a persistent initialized application pool.

Results go to `evidence/isomax-hot-loop-cleanup-20261002/`. Four samples can
detect a material regression; they do not establish a universal speedup.
