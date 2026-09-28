# IsoMax Phase-2 compact shared exact cache — 7x6 guarded candidate

Date: 2026-09-27
Status: implementation experiment after exact-identity qualification.

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

Qualified identity evidence:
- compact identity workflow `36403569298` — success;
- normal Verify `36403569109` — success;
- standard 7x6 exact q identity: 14 words -> 8 words.

## Scope

Do not change private q representation.

Change only the shared exact cache representation.

At creation time, enable the compact path only when the geometry is exactly the
qualified standard layout:
- columns=7;
- rows=6;
- lineCount=69;
- coordWords=3;
- keyWords=14;
- metaOffset=7;
- p0Offset=8;
- p1Offset=11.

All other geometries retain the existing full-key shared-cache path.

## 7x6 compact shared key

Stored words:
0. support height column 0;
1. support height column 1;
2. packed heights columns 2..6 (3 bits each) + terminal bits;
3. P0 coordinate word 0;
4. P0 coordinate word 1;
5. P1 coordinate word 0;
6. P1 coordinate word 1;
7. packed 5-bit P0 coordinate tail + 5-bit P1 coordinate tail.

Rank is omitted because rank=sum(heights).

The existing full-q 32-bit locator hash continues selecting the direct-map slot.
Compact equality is exact, so this does not weaken identity.

## Expected structural change

For 7x6 shared rows:
- key storage: 14 -> 8 uint32 words (-42.86%);
- successful hit full-key atomic comparisons: 14 -> 8 words;
- uncontended shared-store key publication: 14 -> 8 atomic stores.

The first two raw height words are preserved so the measured cheap mismatch
prefix is retained.

## Correctness

Required before timing:
- compatibility path with no geometry remains unchanged;
- 7x6 compact cache exact store/probe;
- forced slot collision rejects a different q;
- arbitrary geometry fallback remains full-key and exact;
- full Verify and Node compatibility;
- cycle ledger updated in the same work.

Benchmark:
4 workers = 1 wide + 3 deep. No single-worker run.
Primary authority: whole-process cycles on completed `353335714`.
Hard `35333571` remains censored when it times out.

PR #84 remains draft/open; no merge authorization follows.
