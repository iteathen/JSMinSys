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
   Instead compile 2,922 strict shape-containment pairs: 8,348 bytes per worker.
   Test membership in each actual child basis; stale inverse entries are not
   membership certificates. This removes repeated subset tests without caching
   solved information, changing ordering, or introducing a hot plan cache.

3. **Canonical key only: possible, benefit overstated.** Current reflection
   already exits early for preferred support orientation; only about 2.84% of
   worker samples attribute to canonicalization. A physical-state replacement
   must still permute coordinates to choose the TT identity and preserve current
   action ordering/ties, CPC masks and live-state transport. Canonical scratch
   must survive child recursion for parent stores. No demonstrated large saving
   warrants this broader gauge change in this campaign.

4. **Make/unmake: not a free local delta.** Frames are already preallocated and
   coordinates are constructed directly. Principal frame storage over all 43
   depths is about 15,308 bytes. Cofactor merging, removal and upward OR lose
   information: undo needs old coordinate/basis data, not simply an inverse
   move. Live masks are already incremental. A wholesale rewrite would add an
   undo contract and traffic without evidence that copying dominates.

5. **Three-valued kernels: mathematically possible, not yet cheaper.** Reachable
   windows include (-2,2), (-1,1), (-1,0), (0,1). Win/NonLoss recurrences can
   represent them, but a full result can require two traversals. STOP, bound
   publication, full-window root probes and deterministic ties remain essential.
   Control/inlined work is about 5.94% of samples; no measured 50% opportunity.
   A separate future proof may extend exact DRAW publication to original
   (-1,1) windows, but it changes cache contents and needs its own qualification.

6. **Ordering: measured small, previous cheaper attempt lost.** Live/order is
   about 0.96% of samples. Recursive scoring already runs once with insertion
   ordering; repeated argmax is root-only. Historical cycle-reduction-108 reduced
   nodes 2.10% but increased warm time 20.68% and cold time 15.77%. Preserve the
   already-qualified ordering rather than assuming fewer scores wins.

7. **TT hints/CPC memo: advisory move is not a complete CPC result.** Exact TT
   hits return immediately; hints mainly target weak bounds. More fields and
   stores, canonical move transport and validation have costs. CPC reuse must
   preserve interval, forced move and restriction mask, own-singleton priority,
   and minimal-pair guards. Tags 6/7 cannot simply be added: current dispatch
   interprets non-4 weak tags as upper bounds. No measured revisit benefit yet.

8. **Late physical bitboard: requires additional state.** Physical ownership
   cannot be uniquely reconstructed from gray-token q/live/heights. Legal
   histories 3243567476322262135343274516 and 3243657476322262135343274516 have
   equal q/live masks but distinct physical ownership. Carrying a board adds
   updates; changing TT identity would destroy gray merging. A new exact kernel
   is a separate engine qualification, not an evidence-backed small optimization.

9. **Constant specialization: partly done, remaining coordinate experiment.**
   Hash14, live3, compact TT and seven-column argmax are specialized already.
   Standard coordinate constants can still be compiled. Dense remove tables
   are not guaranteed by dimensions: initialization budget may select sparse
   helpers. Preserve that path and general-dimension kernels. Test separately
   after the cofactor experiment rather than bundling explanations.

10. **External profile: acted on first.** Raw Node CPU profiles and offline
    aggregation are retained under evidence/isomax-structural-cost-20261002.
    Approximate shares: cofactor/basis/subset64.27%, privateTT12.03%, sharedTT7.93%,
    control/inlined5.94%, CPC5.85%, canonical2.84%, live/order0.96%. Profiling is
    excluded from scored benchmarks. No per-node reporting has been restored.

Neither a sampled share nor a plausible mechanism predicts a 50% wall reduction.
See the final benchmark report for actual candidate selection and limitations.
