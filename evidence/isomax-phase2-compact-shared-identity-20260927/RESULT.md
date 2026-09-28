# IsoMax Phase-2 compact exact shared-identity qualification

Date: 2026-09-27
Status: lossless compact identity qualified; hot shared-cache experiment may proceed.

## Authority

Baseline solver:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`

Qualification branch:
`experiment/isomax-phase2-compact-shared-identity-20260927`

Dedicated workflow:
`36403569298` — success.

Normal JSMinSys Verify:
`36403569109` — success.

Checker:
`experiments/isomax-phase2/compact-shared-identity-check.mjs`

## Proven structural invariants

For every legal RBA q:

    rank = sum(column heights)

This follows by induction:
- ingress starts with rank 0 and zero heights;
- each legal cofactor increments exactly one height and rank by one;
- reflection permutes support and leaves rank unchanged.

Therefore the rank field is exactly reconstructible and does not need separate
shared-cache identity storage.

Coordinate words are bitsets over `lineCount` semantic bits. Padding above
`lineCount` in the final coordinate word is zero under legal construction and
is not semantic identity.

## Qualified encoding

The checker uses a geometry-derived, lossless encoding:
- preserve the first one/two support heights as raw uint32 words;
- bit-pack remaining heights plus the two terminal bits;
- omit rank and reconstruct it from the support sum;
- preserve full coordinate words;
- mask coordinate tail padding;
- when both coordinate tails are <=16 bits, pack the two tails into one uint32.

This is not a hash, fingerprint, or probabilistic shortcut.

The checker:
- round-trips compact -> full q exactly;
- asserts rank/support equality;
- asserts coordinate padding;
- maps every observed compact identity back to exactly one full q;
- exercises legal canonical terminal/nonterminal states.

## Geometry coverage

| geometry | full q words | compact words |
|---|---:|---:|
| 1x1 | 2 | 2 |
| 3x3 | 4 | 3 |
| 4x4 | 7 | 4 |
| 5x4 | 8 | 5 |
| 6x5 | 11 | 6 |
| 7x6 | **14** | **8** |
| 8x7 | 17 | 10 |
| 4x7 | 7 | 5 |
| 9x5 | 16 | 8 |
| 10x10 | 27 | 19 |

For standard 7x6, shared exact identity storage falls from 14 to 8 uint32 words,
a **42.86% reduction in shared key words per slot**, while preserving exact
identity.

## Next implementation boundary

Do not change the private q representation.

Implement compact identity only inside the shared exact cache:
- caller keeps the existing full-q locator hash;
- shared cache stores/validates the compact exact identity;
- compact equality remains exact;
- shared sequence-lock semantics stay unchanged;
- public/private exact semantics stay unchanged;
- arbitrary geometry uses its init-derived compact layout;
- retain the first two raw support heights so the existing cheap mismatch-prefix
  behavior is not needlessly destroyed.

Update NEES accounting before timing.

Benchmark against fixed `f549dcf...` on 4 workers = 1 wide + 3 deep.

PR #84 remains draft/open; no merge authorization follows.
