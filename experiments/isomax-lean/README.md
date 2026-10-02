# IsoMax deep worker without reporting in search

Entry point: `host.mjs`, export `runLazySmpConnect4Rba32`.
This is the separately qualified optimization candidate. The locked main
version and all existing `src/` and `addons/` files remain unchanged.

The subsequent four-item screen selected `live` and `layout` in `features.json`:
the fixed three-word live-state update and a shared TT containing 40-byte
sequence/value/exact-key records. Capacity, hash bits, exact key comparisons,
atomic publication order and search decisions are preserved. CPC scan reuse
showed no gain; hash unrolling missed the declared cycle threshold. Both stay
disabled. `optimize.mjs` applies feature selection only when generating files;
there are no runtime feature checks in the recursive path.

Four-item protocol and benchmark runner: `../isomax-four-items/PLAN.md` and
`../isomax-four-items/measure.mjs`. Screen evidence is in
`../../evidence/isomax-four-items-screen-20261002/`; combined confirmation is
recorded separately. The full-size cache check explicitly verifies attachment
and two-way publication at the last entry of the 5 GiB backing. It runs only
when invoked, not as part of the default small-memory test suite.

Combined confirmation: **39.676 s baseline → 37.690 s selected mean** (5.004%
less wall time, 5.046% fewer process cycles), with all 193 tests passing.
See `../../evidence/isomax-four-items-confirm-20261002/REPORT.md` for raw-run
links, exact revisions, unchanged configuration and measurement limits.

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
  and CPC-option branches, plus optional-scratch checks in coordinate helpers.

The generator derives the candidate from the locked source, specializing the
declared configuration and retaining full-window root probes, root tie-breaking,
forced transit, CPC intervals/masks, key identity and TT publication rules.
Production `addons/cpc-connect4.mjs` is unchanged. CPC diagnostics are removed
only in the generated candidate; semantic preemption counts/masks are retained.
The precursor diagnostic count is removed as well as its aggregate. Coordinate
helpers are private to this prepared profile, not general optional-buffer APIs.

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

Final results go to `evidence/isomax-hot-loop-cleanup-final-20261002/`;
the initial counter-removal measurements are retained separately in
`evidence/isomax-hot-loop-cleanup-20261002/`. Four samples can
detect a material regression; they do not establish a universal speedup.
