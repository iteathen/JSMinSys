# Ten-claim audit

Scope: current runtime 302ebcd, packaged source fb0f60a, recovered main a9c4ed9.
Performance observations are local to the recorded i5/Node/cache/affinity regime.
External sampled profiles are diagnostic estimates, not measured memory stalls.

1. **32-byte TT: already implemented.** Shared rows retain a full 32-bit
   seqlock, 32-bit support, four 32-bit coordinate lanes, two 16-bit heights,
   16-bit tail and 16-bit value. Private rows remain 36 bytes with a 29-bit epoch
   and three tag bits. The quoted 40-byte starting point is stale. Combining
   17-bit support and 10-bit tail alone gives 30 raw bytes, still 32 when aligned.
   A 28-byte design needs further value packing, adding a codec contrary to the
   owner's constraint. Do not shorten seqlock/epoch lifetimes casually.

2. **Compiled transitions: valid structural opportunity, bounded experiment.**
   Nonterminal basis depends on support heights and geometry, not ownership.
   Terminal children deliberately have no basis and must retain first-win
   priority. A complete 7x6 support graph has 823,543 vectors and 4,941,258 legal
   edges. Just 69 three-word closure masks per edge cost 4,091,361,624 bytes.
   The first realization compiled 2,922 strict shape-containment pairs in an
   8,348-byte list. Its screen was 1.79% slower. The refined realization groups
   those relations into masks and intersects with the exact child-basis bitset,
   eliminating failed membership probes. The selected profile retains no list.
   This removes repeated subset tests without caching
   solved information, changing ordering, or introducing a hot plan cache.

3. **Canonical key only: plausible, still unqualified.** Current reflection
   already exits early for preferred support orientation; only about 2.84% of
   worker samples attribute to canonicalization. A physical-state replacement
   must still permute coordinates to choose the TT identity and preserve current
   action ordering/ties, CPC masks and live-state transport. Canonical scratch
   must survive child recursion for parent stores. The broader gauge change is
   deferred behind the measured cofactor work, not falsified. Its coupled effect
   on transitions cannot be bounded solely by canonicalization's sampled share.

4. **Make/unmake: plausible, needs an optimized undo realization.** Frames are already preallocated and
   coordinates are constructed directly. Principal frame storage over all 43
   depths is about 15,308 bytes. Cofactor merging, removal and upward OR lose
   information: undo needs old coordinate/basis data, not simply an inverse
   move. Live masks are already incremental. A wholesale rewrite would add an
   undo contract and traffic. That is an unresolved tradeoff, not evidence that
   an optimized incremental representation cannot win.

5. **Three-valued kernels: mathematically possible, not yet cheaper.** Reachable
   windows include (-2,2), (-1,1), (-1,0), (0,1). Win/NonLoss recurrences can
   represent them, but a full result can require two threshold queries (which
   may share cached work, not necessarily two complete traversals). STOP, bound
   publication, full-window root probes and deterministic ties remain essential.
   Control/inlined work is about 5.94% of samples. This does not bound a coupled
   transformation's possible gain; no optimized threshold candidate was qualified.
   A separate future proof may extend exact DRAW publication to original
   (-1,1) windows, but it changes cache contents and needs its own qualification.

6. **Ordering: one prior realization lost; the parent remains open.** Live/order is
   about 0.96% of samples. Recursive scoring already runs once with insertion
   ordering; repeated argmax is root-only. Historical cycle-reduction-108 reduced
   nodes 2.10% but increased warm time 20.68% and cold time 15.77%. That falsifies
   that specific realization, not TT-first/staged ordering. Ordering changes work
   throughout the tree, so its sampled share is not an upper bound on gain.
   The present qualified cofactor change preserves ordering to isolate its effect.

7. **TT hints/CPC memo: advisory move is not a complete CPC result.** Exact TT
   hits return immediately; hints mainly target weak bounds. More fields and
   stores, canonical move transport and validation have costs. CPC reuse must
   preserve interval, forced move and restriction mask, own immediate-win priority,
   and minimal-pair guards. Tags 6/7 cannot simply be added: current dispatch
   interprets non-4 weak tags as upper bounds. No measured revisit benefit yet.

8. **Late physical bitboard: requires additional state.** Physical ownership
   cannot be uniquely reconstructed from gray-token q/live/heights. Legal
   histories 3243567476322262135343274516 and 3243657476322262135343274516 have
   equal q/live masks but distinct physical ownership. Carrying a board adds
   updates; replacing q identity with full physical identity would forgo gray
   sharing, though carrying a board need not replace q keys. A new exact kernel
   is a separate engine qualification. The parent remains open; it has not been
   performance-falsified by the current source audit.

9. **Constant specialization: implemented in the prepared closure composite.**
   Hash14, live3, compact TT and seven-column argmax are specialized already.
   Standard coordinate constants are now compiled. Dense remove tables
   are not guaranteed by dimensions: initialization budget may select sparse
   helpers. Cold dispatch retains a sparse standard path and general-dimension
   kernels. Constants alone screened neutral; constants plus hoisting, mask-only
   storage and direct dense removal improved the grouped-mask screen by5.19%.
   This is composite evidence, not a claim that each constituent independently wins.

10. **External profile: acted on first.** Raw Node CPU profiles and offline
    aggregation are retained under evidence/isomax-structural-cost-20261002.
    Approximate shares: cofactor/basis/subset64.27%, privateTT12.03%, sharedTT7.93%,
    control/inlined5.94%, CPC5.85%, canonical2.84%, live/order0.96%. Profiling is
    excluded from scored benchmarks. No per-node reporting has been restored.

Neither a sampled share nor a plausible mechanism predicts a 50% wall reduction.
See the final benchmark report for actual candidate selection and limitations.
Unimplemented parent approaches remain unverified research debt. Their omission
from the current package is prioritization, not a declaration of global optimality.
