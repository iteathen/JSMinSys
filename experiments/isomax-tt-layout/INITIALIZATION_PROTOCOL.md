# Full initialization qualification

Frozen before timing, 2026-10-02. This completes the earlier TT-only geometry
fallback by connecting the public host to dimension-appropriate search workers.
No promotion to main is authorized by this measurement request.

## Implementation and cost boundary

`prepareConnect4RbaGeometry({columns, rows})` supplies the geometry to
`experiments/isomax-lean/host.mjs`. Before spawning, `execution-profile.mjs`
selects the existing standard worker or a generated general worker. TT layout,
height width, key width, per-depth storage, CPC mask availability, and move-order
packing are established during preparation. Four general source variants cover
packed/unpacked move order and widths at/beyond the 32-column CPC mask boundary.
Selection is absent from recursive traversal. No runtime code generation.

The standard solver, worker, CPC, shared cache, coordinate functions and fixed
operations are source-identical to repaired 32-byte runtime
4e7af0e74b82b6bb70fef94a211196b4235a4039 (LF-normalized SHA256 assertions).
The changed host does cold selection and adds cold result metadata only.
There is no new standard-node callback, codec, counter, allocation or check.
Host allocation/worker startup/cleanup remain included in timing, exactly as in
the previous comparison; this work does not introduce a reusable worker pool.

General workers directly import the general TT probe/store, use full private
keys and dimension-driven hash/live/key loops, and preserve exact identity,
gray-token quotient, weak-bound priorities, seqlock protocol, ordering and STOP
semantics. Widths above 32 retain the original omission of the 32-bit fork proof;
its call and provably vacuous action-mask checks are erased at build time.
The cold zero-line adapter admits valid tiny boards without changing hot live
operations or production add-ons. BSFP and production CPC are untouched.

NEES Draft 0.5 authority remains 7650bef0aecc0d2b226ecf253a1f8937ccf89d69.
Affected-scope accounting: selection and allocation are COLD; hash/private key
comparison/live updates/general shared key loops are E0/E1. General loop work
scales with keyWords, line-word count, column count and coordinate-word count.
No frequency is hidden as setup. No added dynamic layout branch or reporting
atomic is present in traversal. Symbolic general successful shared probe cost:
columns + 2*coordWords + 4 atomic loads; successful store: one sequence load,
one CAS, columns + 2*coordWords + 3 stores. Existing TT coherence, address
arithmetic, guards and builtin costs remain real, not assumed one cycle each.

Limits/debt: the general fallback is correctness-qualified, not claimed globally
cycle-optimal. Variable-length loops are not a proof that unrolling other sizes
is impossible; general 7/14-word private keys and three-word live fields may
benefit from additional cold specializations. Generic large-capacity narrow-view
indices still require separate V8 boxing/latency qualification. The standard
2^27-slot halfword profile retains its prior full-domain qualification. No broad
NEES seal or performance extrapolation to arbitrary board sizes is claimed.

## Correctness gates

- Public host, actual workers: 4x4, 4x5, 5x4, 8x4, 4x8, 8x6, 7x5, 33x1,
  1x256; also zero-winning-line 1x1, 2x3, 3x3.
- Independent physical-board minimax for late legal fixtures; legal selected
  move membership is checked for nonterminal RBA roots, including drawn states.
- Single-worker deterministic comparison with released deep reference, multiple
  worker orders and both reflections: exact results/moves, private keys/tags,
  reconstructed logical shared keys/sequence/value. No mismatch allowed.
- General CPC compared with production on legal prefixes, including 32/33-column
  boundary. STOP/reuse and existing host timeout/cleanup controls retained.
- Unpacked algorithms executed against reference on affordable real fixtures
  using test-only prepared unpacked storage; cold overflow selection and wrong
  profile rejection separately checked. No claim to have allocated impractically
  large overflow boards.
- All existing tests and focused tests on the historical Node nightly must pass.
- Formula holdouts 3x6-k4 and 5x3-k4 remain excluded and sealed.

## Governing benchmark

One unscored candidate warm-up, retained separately. Eight scored samples in
ABBA BAAB order; no adaptive stopping or sample selection.

A: original optimized 40-byte runtime cbc4ddf995be83334ea26190c749028435e353fa.
B: newly integrated 32-byte runtime, committed before packet creation.

Same entry counts: shared 134217728, private 16777216 per worker. Shared footprint
therefore 5 GiB versus 4 GiB; private remains 576 MiB/worker. Four deep workers,
no wide worker, sharedSampleMask 0, pinned P-core logical CPUs 0/2/4/6. Historical
Node v27.0.0-nightly20260928b59840b593 / V8 14.6.202.34-node.36 on i5-12600K.
Affinity must be verified for every worker and every sample.

Existing sample harness computes the empty-board structural prefix, applies
five certified moves, and makes one exact root search from actual 44444. Primary
wall time includes prefix, host preparation, search and cleanup. No full-game
self-play claim. All seven controls, EXACT WDL +1, returned c4, one search,
cleanup and four exits are required. Safety timeout remains 300 seconds.

Retain raw output, source SHA, Node/V8/CPU, capacities, trace, elapsed wall,
external process cycles/CPU and peak RSS. No node/hit counters are enabled.
Report all samples, means and descriptive paired uncertainty; never infer a
speed improvement merely from fewer bytes or one fastest sample.
