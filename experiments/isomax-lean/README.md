# IsoMax deep worker without reporting in search

Entry point: `host.mjs`, export `runLazySmpConnect4Rba32`.
This branch contains the repaired 32-byte TT candidate with complete
initialization-selected geometry support. See
`../../evidence/isomax-tt-init-confirm-20261002/REPORT.md`: **20% less shared
TT memory**, with matched mean time **37.365 s → 37.211 s**. The nominal 0.41%
difference is within measurement uncertainty; timing is effectively unchanged.
The first implementation's boxed high byte indices were removed using native
halfword fields; no key encoder/decoder was added. The scoped NEES audit and
remaining debt are in `../isomax-tt-layout/NEES_REVALIDATION.md`.
Current qualification: 217 tests, plus 30 focused tests on the benchmark runtime.
This is a correctness-qualified memory-saving option, not a promotion. The locked main
version and all existing `src/` and `addons/` files remain unchanged.

All four requested changes are now enabled in `features.json`:

- `cpc-fused`: one singleton-prefix scan, local flags/index, no duplicate
  preemption reset. Tactical guards and immediate-win priority are unchanged.
- `hash-inline` plus `hash-index32`: the identical fourteen-step recurrence
  directly at the search site, with exact integer addresses in the private
  0..601 frame-index domain. No hash loop or helper call. Hash bits stay identical.
- `live`: fixed three-word live-state update, preserving write order.
- `layout32`: native narrow atomic fields in each 32-byte shared TT record;
  no new encoding/decoding. The preceding `layout` feature uses 40-byte records.

Capacity, exact key comparisons, atomic publication order and search decisions
are preserved. Feature selection happens only during generation; there are no
runtime feature checks in the recursive path.

The CPC/hash revisit found why the first unrolled helper was a poor replacement:
V8 inlined the original loop but refused to inline the larger helper. Direct
emission removes that call boundary; explicit fixed-frame integer addressing
also removes thirteen emitted overflow guards. All **199 tests pass**, plus
17 focused tests on the benchmark runtime.

Earlier CPC/hash eight-run comparison: **37.547 s baseline → 37.370 s candidate mean**,
nominally 0.470% less wall time and 0.479% fewer cycles. The paired intervals
cross zero, so a reliable additional whole-solve speedup remains unestablished.
See `../../evidence/isomax-cpc-hash-index32-confirm-20261002/REPORT.md` for the
complete 32-run revisit, exact revisions, compiler evidence and limitations.

Four-item protocol and benchmark runner: `../isomax-four-items/PLAN.md` and
`../isomax-four-items/measure.mjs`. Screen evidence is in
`../../evidence/isomax-four-items-screen-20261002/`; combined confirmation is
recorded separately. The full-size cache check explicitly verifies attachment
and two-way publication at the last entry of the 5 GiB backing. It runs only
when invoked, not as part of the default small-memory test suite.

Earlier live/layout-only confirmation: **39.676 s baseline → 37.690 s mean** (5.004%
less wall time, 5.046% fewer process cycles), with all 193 tests passing.
See `../../evidence/isomax-four-items-confirm-20261002/REPORT.md` for raw-run
links, exact revisions, unchanged configuration and measurement limits.

The candidate selects a specialization of the **released deep** implementation
at initialization. Standard 7x6 keeps its qualified compact kernel unchanged.
Other dimensions select general key/live storage and direct shared TT accessors;
width-dependent CPC proof availability and move-order packing are also selected
cold, without node-level layout dispatch. Supply a prepared geometry from
`prepareConnect4RbaGeometry({columns, rows})` to the public host's `geometry` option.
See `../isomax-tt-layout/INITIALIZATION_PROTOCOL.md` for qualification and limits.
All workers are deep. `rootFrontier:true` and alternative CPC options are
rejected at initialization. The worker still supports the
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
Tests: `node --test test/*.test.mjs`.
Latest measurement packet: `../isomax-tt-layout/init-confirm.json`.
Runner: `node experiments/isomax-four-items/measure.mjs <packet.json>`.
For replay, copy the packet with a new evidence ID and paths to the exact
checked-out revisions; the runner intentionally refuses to overwrite evidence.

Original cleanup measurement protocol: sequential **A B B A**, where A is
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
