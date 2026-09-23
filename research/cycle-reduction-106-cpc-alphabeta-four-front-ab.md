# CPC-first alpha-beta versus recursive Four-Front A/B

**Date:** 2026-09-23  
**Branch:** `research/isomax-rba-primitives-v1`  
**Qualification run:** GitHub Actions `35903829477`

## Question

When exact CPC/NDC closure does not settle a q, should the production path:

1. continue directly with one-ply RBA negamax/alpha-beta; or
2. first build a bounded recursive Four-Front refinement and then continue with alpha-beta?

The two modes use the same RBA coordinates, cofactors, canonicalization, exact cache policy, CPC closure, initialization-prepared action order, W/D/L domain, and independent oracle controls. The only intended difference is recursive Four-Front refinement in mode 2.

## Result

Both modes matched independent exact value and deterministic witness controls on the tested 4x4 and standard-7x6 positions.

On the genuinely CPC-unresolved standard-7x6 rank-28 control:

```text
moves 4000330062302363634622612564

CPC -> alpha-beta
  value             P0 win
  witness           column 2 (zero-based)
  alpha-beta nodes  54
  cofactors         54
  cutoffs           17
  elapsed           0.271283 ms

CPC -> Four-Front -> alpha-beta
  value             P0 win
  witness           column 2 (zero-based)
  alpha-beta nodes  37
  cofactors         37
  cutoffs           17
  Four-Front calls  35
  Four-Front steps  3,703
  elapsed           6.743408 ms
```

Thus Four-Front reduced explicit alpha-beta nodes by about 31.5% on this control, but measured wall time was about 24.9x higher because of the recursive symbolic work.

Late standard-7x6 controls were even more one-sided: CPC itself settled the value in one or two nodes, while Four-Front still paid hundreds of recursive front steps before returning the same exact result.

The 4x4 controls showed the same general pattern: Four-Front often reduced alpha-beta node count, but usually increased total work and wall time substantially. One tiny 4x4 timing sample favored Four-Front; individual sub-millisecond timings are noisy and are not treated as a performance theorem.

## Architectural consequence

The current production candidate is:

```text
q
-> exact/conservative CPC/NDC closure
-> if exact: publish/return exact W/D/L
-> if bounded: tighten local alpha/beta where sound
-> if unresolved: evaluate/order
-> one-ply RBA cofactor
-> negamax perspective flip
-> recurse through alpha-beta
```

Ordinary temporal precedence is supplied by the traversal itself. An earlier exact opponent CPC conclusion occurs at a shallower descendant and returns through negamax before a later projected conclusion can become authoritative.

Explicit CPC timing metadata remains necessary only for a certificate that intentionally jumps across intervening play.

Recursive Four-Front remains qualified as an experimental/reference mode. It is not deleted: it is useful for differential qualification, symbolic-front research, and future evidence that might justify a narrower nonrecursive/front-reuse form.

## Scratch-state correction

CPC-only alpha-beta does not retain a per-depth action-order row. It iterates the immutable initialization-prepared `actionOrder` and copies only the current exact forced-column restriction before descending.

Per-depth action-bound storage exists only in the Four-Front mode because recursive child construction overwrites the reusable front arena and the parent must retain its already-computed action intervals.

## Exact-cache boundary

Alpha/beta windows are local search-control information, not global q evidence.

Only exact CPC/Four-Front values, or values obtained under a full exact window without a local cutoff, are admitted to the exact direct-mapped cache. Narrow-window fail-high/fail-low returns are not published as exact q truth.

## Non-claim

This A/B establishes a strong directional result on the qualified controls. It does not prove recursive Four-Front is always slower on every geometry/position or that no future front-reuse/nonrecursive formulation can be beneficial.


## Pooled-frontier / synchronized-frontier CPC extension

A later continuation ported the already-qualified pooled-frontier paired-response theorem and its fixed (L=1) synchronized-frontier specialization into CPC as a nonrecursive one-sided no-win certificate.

Qualification head before this note:

`fa9500fb80a1706ff67a0f2dbfd201da72fb5404`

Qualification run:

`35908492584`

Result:

```text
tests 119
pass  119
fail  0

verify              green
node-compatibility  green
schema              green
```

The extension keeps odd-remainder column frontiers as named response resources instead of pretending they are vertical paired responses. An even frontier pool is required. The fixed (L=1) specialization may additionally use a disjoint frontier pair as an exact pair blocker. Above 32 configured columns, that fixed-pair bitmask specialization is skipped; the general pooled theorem remains available.

Independent 4x4 controls include:

```text
positive pooled response:
  moves 0100
  exact oracle draw
  CPC interval [P0 loss, draw]

positive synchronized frontier pair:
  moves 0200
  exact oracle draw
  CPC interval [P0 loss, draw]

negative omitted-frontier control:
  moves 000222
  CPC remains unresolved
```

The production/default CPC path intentionally retains the earlier all-even paired-response theorem. The pooled/synchronized extension is initialization-selected and opt-in while its standard-board value is being qualified.

On the same-run 4x4 benchmark controls, enabling the extension reduced CPC-only alpha-beta nodes/cofactors:

```text
moves    baseline   extension   reduction
0101        1714       1180       31.2%
121203        43         32       25.6%
01132        372        338        9.1%
212031       110         99       10.0%
0313202      237        179       24.5%
```

Warm repeated timings on those controls moved in the same direction in run `35908492584`, but individual sub-millisecond measurements remain noisy and are not treated as a portable speed theorem.

For the current standard-7x6 controls, the extension changed no alpha-beta node count. A direct CPC scan of every rank-16-or-later prefix of the maintained 7x6 benchmark fixtures found zero interval/kind changes from the frontier extension.

Therefore the current decision is:

```text
production/default:
  existing all-even paired response
  + CPC/NDC
  + alpha-beta

qualification/experimental:
  pooled frontier response
  + fixed L=1 synchronized frontier pair blockers
```

This follows the CPC-first performance doctrine: keep a sound theorem available and qualified, but do not charge its scan cost to the standard production path until it demonstrates useful standard-board closure.

## Benchmark methodology correction

The benchmark now records:

- cold first solve;
- warm-up solves;
- repeated warm median/minimum timings;
- a same-binary CPC baseline versus frontier-response extension;
- the existing CPC versus recursive Four-Front A/B;
- a direct standard-prefix scan for frontier-response semantic hits.

The same-binary comparison is preferred over comparing one-shot timings from different CI runs because it reduces runner/JIT confounding.

## Endpoint-preemption convergence boundary

The preserved fork-preemption research also proves that two endpoint-preemption orders can reach the same forced macro-successor under stated playability/first-win guards.

That fact is retained as proof-graph normalization evidence only. It is **not** currently used to skip an entire alpha-beta child: a shared forced descendant does not by itself prove that every non-macro attacker alternative from the two physical child states is value-equivalent. A production branch merge requires that stronger subsumption/equivalence proof first.


## Support-lift terminal-response closure

A later CPC continuation promoted two exact one-ply support consequences without adding recursion, a timeline scheduler, per-depth scratch, or another basis scan.

The player-local singleton scan already records every active singleton target for each player in a compact bitset. CPC now reuses the opponent bitset for two first-win certificates:

```text
forced block:
  exactly one opponent singleton is playable now
  -> mover must occupy its support cell
  -> that placement exposes another opponent singleton one row above
  -> opponent terminalizes next ply
  -> exact mover loss

universal lift:
  no opponent singleton is playable now
  -> every legal mover action raises one column
  -> every such raised frontier exposes an opponent singleton
  -> opponent terminalizes next ply on every continuation
  -> exact mover loss
```

Current-player immediate terminal detection remains earlier in CPC, so a shallower mover win supersedes these obligations exactly as required by first-win semantics.

Independent 4x4 oracle controls include:

```text
forced-block lift:
  moves 001001113
  P1 to move
  exact oracle P0 win
  CPC exact [P0 win, P0 win]

universal lift:
  moves 000011121222
  P0 to move
  exact oracle P1 win
  CPC exact [P1 win, P1 win]
```

Qualification head:

`f0ccab34f0851bb55fa5007986d3119e68a5bfe2`

Qualification run:

`35910168846`

Result:

```text
tests 122
pass  122
fail  0

verify              green
node-compatibility  green
schema              green
```

The closure also reduced deterministic search work on the maintained controls. On the standard 7x6 rank-28 control

```text
4000330062302363634622612564
```

production CPC-first alpha-beta fell from 54 nodes/cofactors to 49, about a 9.3% reduction, while returning the same exact P0 win and column-2 witness.

The maintained 4x4 controls also decreased:

```text
moves       before   after
0101          1714    1648
121203          43      41
01132          372     325
212031         110      98
0313202        237     227
```

The implementation reuses the already-populated opponent singleton bitset. It adds only support-cell bit tests and, for the universal form, a short legal-column scan. No new residual/basis traversal is introduced.

## Synchronized-channel extension update

The frontier-response experiment now preserves the earlier pooled / fixed-`L=1` policy and additionally tries one deterministic maximal synchronized channel over ascending pairs of odd-remainder columns:

```text
L = min(remaining[a], remaining[b])
```

Because both paired remainders are odd, `L` is odd and the longer post-channel tail is even, allowing ordinary vertical pairing afterward. This is one nonrecursive member of the already-qualified synchronized-channel theorem family; CPC does not enumerate channel templates.

The benchmark prefix A/B was corrected so the `on` scratch actually enables `frontierResponse`. After that correction, the maintained rank-16-or-later standard-7x6 prefix scan still reported:

```text
frontierResponseScan: []
```

Therefore the production decision remains unchanged:

```text
production:
  cheap CPC/NDC tactical closure
  + support-lift terminal response
  + all-even paired response
  + exact alpha-beta fallback

experimental / opt-in:
  pooled + synchronized frontier-response closure

reference only:
  recursive Four-Front
```

The synchronized extension remains valuable as qualified research and for smaller-board compression, but it has not demonstrated additional CPC interval/kind closure on the maintained standard-7x6 prefix controls.
