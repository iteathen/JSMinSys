# IsoMax source audit — 2026-10-05

Audited source: JSMinSys `work/cpc-rebuild-20261004`, commit
`919f887d7214f48eb0926caf611f985db4720025`. Local and fetched remote experimental
heads agreed. Fetched main was `1b843981ba7d68c118656dad1a6c7591453e7686`.
The current minimal worker and frozen `isomax/` rc.3 package are distinct,
intentionally documented implementations. This audit does not replace either.

Solver, support-library, launcher, catalog and production test sources were not
changed. This directory contains audit material only. The pre-existing untracked
`MW-001B-RETEST.md` was preserved and is not part of this commit.

Evidence class: **INTERNAL-QUALIFICATION**. Separate physical-board algorithms
improve implementation independence; these project-directed checks are neither
external validation nor a proof of general solver correctness. No formula holdout
outcomes, opening books or solved caches were used. Oracle checks occur after the
solver returns. No full performance solve was started during this audit.

## Confirmed defects

### A01 — completed session can be overwritten by a deadline

`addons/branch-manager-host.mjs:155–163` schedules a deadline before checking
whether the session is already done; its timer unconditionally calls the failure
path. With DONE already set, `wait({timeoutMs:1,pollMs:100})` reports error 102
three times out of three. The reproduced state has both `done:true` and
`errorCode:102`. This is a lifecycle/result-status defect, not an error in minimax.
The same race can occur when completion becomes visible before the next poll.

Reproducer: `probes/host-repros.mjs`; output: `raw/host-repros.json`.
Priority: P2. A correction belongs in the shared session owner: observe completion
before arming a wait and arbitrate completion versus deadline at the deadline.
Do not add checking or statistics to the recursive worker hot loop.

### A02 — accepted long timeout becomes a one-millisecond timeout

Current host `addons/rba-connect4-lazy-smp-host.mjs:46–47` and packaged host
`isomax/runtime/experiments/isomax-lean/host.mjs:39` accept any finite positive
deadline. Shared session line 159 passes it directly to Node's `setTimeout`.
At `2147483648` ms, Node warns and substitutes 1 ms.

Current four-worker 1×1 control: 10000 ms deadline returns EXACT with four clean
exits; the accepted long deadline returns TIMEOUT/102 with four clean exits.
The package also reproduces the defect. Raw warning/output are retained. This
does not affect the campaign's ordinary 600000 ms safety ceiling.

Reproducers: `probes/current-deadline.mjs`, `probes/package-probe.mjs`.
Priority: P2. Reject unsupported intervals or implement an elapsed-deadline wait
that safely spans timer limits, in the lifecycle owner.

### A03 — TT capacity checks truncate large integers to 32 bits

Current host `:37–42` and shared cache
`addons/rba-connect4-shared-exact-cache.mjs:18–21` use
`capacity & (capacity-1)` without a matching upper/safe-integer limit.
For example, 4294967297 and 4294967298 are not powers of two, yet pass and reach
allocation; 9007199254740992 also passes. A substituted allocation constructor
records the request and throws, so the probe does **not** allocate gigantic TTs.

Reproducer/output: host-repros. Priority: P2, resource/input validation.
The retained localhost capacities are within the intended range; this finding
does not show that those allocations or indexing are wrong. A correction must
validate the representation's supported capacity and byte/index limits before
allocation, not merely use another bitwise test.

### A04 — package verification omits the public entry and configuration

`isomax/verify.mjs:5–19` verifies provenance-listed files and runtime imports.
The public `index.mjs`, exported `profile.json`, example, package exports and
package tests are not covered by that lock. Line 20 checks only `private` in
package metadata. Removing both index and profile from a disposable copy still
exits zero and prints “Verified 365 locked files”.

Reproducer: `probes/package-verification.mjs`; output:
`raw/package-verification.json`. Priority: P2, packaging assurance. Verification
of the runtime subtree is useful but does not verify the usable distributed
entry point or selected public configuration. A correction must cover required
entry/configuration/export identities and existence as well as runtime imports.

### A05 — RLC accepts DataView and reconstructs no supplied moves

`addons/connect4-rank-local-presearch.mjs:11` and its packaged copy accept every
`ArrayBuffer` view. DataView has neither typed-array indexing nor `.length`, so
the reconstruction loop at line 19 does not execute. A DataView input on 7×6
returns CERTIFIED/c4 with undefined rank instead of rejecting invalid input.

Reproducer: package-probe; raw output: `raw/package-results.jsonl`.
Priority: P3. This is an input-contract defect, not evidence of wrong results for
valid move arrays. Exclude non-indexed views and validate history length.

## Lifecycle and research-record gaps

**A06 — normal API invocation does not satisfy the all-ready application model.**
The packaged host `:75–95` spawns workers sequentially; worker `:21–33` allocates
private state and immediately starts solving. Every invocation allocates fresh
TTs/workers and `host:97` closes them. There is no all-ready barrier or persistent
initialized application API. Package README:91–94 explicitly documents this
lifetime; it is a requirement gap, not a hidden per-node allocation.

The current minimal host has an all-ready gate at `:127–139` only when
`preparedEmptyTiming:true`; its default is false (`:29`). The retained localhost
campaign uses that gate. Consequently this gap does **not** establish that the
retained ready-empty measurements include worker initialization or spawn workers
inside recursion. The external no-RLC wrapper's `ready`/`--prepare-only` output
also precedes invoking the allocating host; it is not proof of prepared TTs.

**A07 — old sharing-policy prose is stale, rather than an unexplained code change.**
`docs/minimal-worker-nees-optimization.md:363,369,411` describes narrow exacts
staying private. Current minimal `:116–119,220–228` shares eligible search-proven
extreme exacts, as does generated center `:109–112,212–220`.
Git blame identifies deliberate correction
`e3eccf9b0c35c78bc142e484c0b974ea58a3a3b7`; its authoritative local diagnostic is
`evidence/minimal-worker-localhost-20261004/share-exact-01/RESULT.md`.
The later campaign explicitly inherits this correction. Shared values remain
exact; non-exact zero bounds remain private. Do not revert current behavior on
the strength of obsolete MW-001B prose. Historical censored runs show publication
activity, not a completed-solve speed comparison. Reconcile the old documentation
with current source/evidence selection.

Prepared-empty pre-aborted calls also throw a generic initialization error
instead of returning the normal interrupted-result shape (host:129–130).
This lower-priority interface inconsistency is reproduced in host-repros; it is
not a reproduced worker leak.

**A08 — previously packaged memory-layout optimization is absent from this worker.**
Current `addons/rba-connect4-shared-exact-cache.mjs:27–34` allocates separate
sequence, value and key arrays: 40 bytes per standard compact entry. The frozen
package's `runtime/experiments/isomax-lean/shared-cache.mjs:21–39` selects a
32-byte interleaved standard layout and a geometry-derived general layout at
initialization. Its README describes that packaged optimization accurately.
The current minimal campaign explicitly queues interleaved/32-byte TT testing
in `OPTIMIZATION_CAMPAIGN.md:17`. This is a confirmed implementation difference,
not a demonstrated false key or a measured regression. It disproves treating
the newer worker as automatically containing every optimization in the frozen
package. Retest the layout on the current workload before either disposition.

The current standalone `tools/bench-minimal-i5.mjs:7–8` also defaults to 16777216
private entries, while the latest retained campaign used 33554432. The campaign
launcher supplies the environment override. Running the standalone tool with no
override would therefore measure a different private-memory regime. This audit
does not show that the retained runs omitted that override.

## Repeated work worth measuring, not established correctness defects

- Dense cofactor `addons/rba-connect4-coordinate-dense.mjs:7–14,101–106` clears
  the shape set and emits/reindexes a child support basis even when both active
  ownership coordinate sets vanish. A measured support-transition experiment
  should preserve gray/support identity, dynamic dimensions and sparse fallback.
- Prepared canonicalizer `addons/rba-connect4-coordinate-prepared.mjs:98–117`
  rebuilds/permutates the reflected basis; worker `:198` invokes it and a later
  node scans key words for hashing (`:141`). Reflection must still merge exact
  identities and transport physical moves. Savings are not established here.
- Compact shared exact publication performs 12 atomic operations; a successful
  compact probe performs 11 atomic loads. These are seqlock/key/value protocol
  operations, **not** reporting counters. Removing them indiscriminately breaks
  concurrency safety. Current minimal uses the uncounted cache implementation.
- Live workers advance six live-state words at `:200–201` before recursion can
  discover an exact child TT hit. Avoiding that work is a candidate, but moving
  it must preserve state for unresolved children and physical reflection.
- C10 evaluates upward-closed active coordinates and geometry-width words;
  minimal-generator/current-basis bounds may avoid repeated proof work. No
  workload improvement or universally sufficient replacement is claimed.

Existing early sampled profiling supports the cofactor/basis concern. Self-sample
shares are not whole-solve speedups. None of these observations proves that a
90% reduction or a ten-second solve is available.

## Checked semantic boundaries

No wrong value, illegal optimal witness, missed-win stop condition, false shared
exact, or gray hash defect was reproduced in the current minimal scope.
Absolute/mover-relative polarity, original-window bound classification, local
opposite-zero-bound draw inference, key identity, cancellation propagation,
reflection transport and complete/unchanged seqlock reads were examined.
Nonwinning-cofactor admission follows root immediate-win checking, forced-block
restriction and opponent exposure filtering. C10/C12 remain sufficient positive
certificates with controller/parity guards; they are not complete evaluators.

A reachable standard-7×6 gray position has canonical words
`[5,6,6,6,5,6,6,160,0,0,0,0,0,0]`, basis size 2. The identity retains support
heights but not ownership that has vanished from active residual channels.
Four-worker result and legal optimal move were checked after return against
physical minimax. This rejects the specific assertion that the audited key
necessarily keeps dead physical token identities; it is not exhaustive gray
quotient qualification.

RLC's CERTIFIED label establishes its Pareto/headroom structural predicate. The
package explicitly limits the opening evidence. An exact outcome at the advanced
search root is not itself an exact empty-root outcome proof. Runtime-computed
advancement remains permitted by the runtime-input-only benchmark standard.

## Coverage, commands and limits

Line-by-line coverage includes both current minimal workers; counted/uncounted
shared cache; host/session/worker/affinity plumbing; word/basis/hash primitives;
geometry, ingress, generic/prepared/dense coordinates, execution profile;
live-line ordering/evaluation; C10 and general/dense C12; associated generators.
Package coverage includes public entry/metadata/profile/verify/prepare/example,
host, worker variants, profiles, shared cache, packaged recurrence variants and
CPC implementations. Generated variants were inspected through full differing
regions plus common source. Older unrelated engine paths and all historical
research files were not exhaustively reviewed. This is not an audit of every
file in the repository or all 365 locked package files.

Fresh retained raw checks: **42 current-runtime tests**, **19 package tests**;
**26 four-worker post-return physical minimax comparisons** (1,340 oracle memo
nodes); **4,356 transition states**, **21,022 child checks**, **8,508 physical
position-code checks**, **18 positive late CPC certificates**. Geometry coverage
includes 7×5, sparse/dense and wide position representations, and no-winning-line
boards. Tiny fixtures are correctness checks, not full-board performance claims.
Four generated-source checks and the catalog passed (298 sealed functions,
213 cycle-ledgered add-on units). Machine identities are in `manifest.json`.

Additionally, **12 packaged six-cell-remaining comparisons** passed exact value,
optimal legal move, cleanup and CPC interval containment after return: standard
7×6, general 4×4 and wide 33×1, original/reflected histories, sparse/dense
preparation. All ten packaged recurrences and three CPC variants were inspected;
unpacked variants were checked statically rather than by allocating their large
production geometries. Reproducer: `probes/package-kernels.mjs`; raw:
`raw/package-kernels.jsonl`.

Run each `probes/*.mjs` with the pinned Node executable from any working directory.
Host/worker probes write into `raw/`; transition/package probes emit JSON.
Raw original outputs are kept separately under `raw/`. Package-verification
mutates and removes only a checked, disposable OS-temporary copy.
Exact test and generator commands are in the manifest. Tests use small caches
without benchmark affinity; their elapsed values are not performance authority.

No claim that the present findings explain the approximately 155.8-second retained
empty-root solve, or that historical prefix-root solves are equivalent to it.
No fixes, benchmark promotion, main merge or publication are part of this audit.
