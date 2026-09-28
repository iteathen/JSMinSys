# IsoMax Phase-2 compact exact shared-identity investigation

Date: 2026-09-27
Status: exact-identity qualification before implementation.

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

## Motivation

Uniformly reducing sharing was rejected because lost exact evidence expands the
tree faster than shared-cache cost falls.

The next target is therefore to preserve every admitted exact shared row while
reducing its representation and validation cost.

For standard 7x6 the canonical RBA q key is 14 uint32 words:
- 7 support heights;
- 1 meta word;
- 3 P0 coordinate words;
- 3 P1 coordinate words.

## Exact invariant 1 — rank/support

For every legal RBA q:

    rank = sum(column heights)

Base:
- ingress starts rank 0 with all heights 0.

Transition:
- connect4RbaCofactorKnownHeight increments exactly one height by 1;
- it increments rank by 1.

Reflection:
- only permutes height columns;
- rank is unchanged.

Therefore rank is exactly derivable from support for arbitrary configured
geometry.

## Exact invariant 2 — coordinate padding

Each player coordinate has `coordWords = ceil(lineCount / 32)`.
Bits above `lineCount` in the final coordinate word are never semantic and are
zero under legal construction.

If the tail width is <=16 bits, the P0 and P1 tail fields can be packed into one
uint32 without loss.

## Proposed compact identity

Preserve the first two support heights as raw words because the measured shared
mismatch distribution rejects about 97% of mismatching occupied slots by word 1.

Then encode:
1. raw support height 0;
2. raw support height 1 (when present);
3. bit-packed remaining support heights plus the two terminal bits;
4. full P0/P1 coordinate words except their tails;
5. when both coordinate tails fit, pack both tails into one uint32.

Rank bits are not stored; reconstruction uses the support sum.

This is an exact encoding, not a hash/fingerprint.

For 7x6:
- original: 14 words;
- proposed: 8 words.

Other examples:
- 4x4: 7 -> 4 words;
- 10x10: 27 -> 19 words.

The representation remains geometry-derived and generic.

## Correctness qualification

Before modifying the shared cache:
- implement a cold experiment-only pack/unpack oracle;
- assert full round-trip equality for legal q states;
- assert rank=sum(heights);
- assert compact identity collisions never map different full q values;
- exercise multiple geometries including no-line/small boards, 4x4, 7x6,
  10x10, and asymmetric sizes;
- include terminal and nonterminal legal states.

No timing claim follows from the checker.

Only after exact identity qualification may a hot shared-cache candidate be
designed.

PR #84 remains draft/open; no merge authorization follows.
