# IsoMax Phase-2 packed move-order rows

Date: 2026-09-28
Base solver: `f2d56c2788ef3a4c49fc4bef9d447c5be3184059`
Status: implementation experiment; not selected.

Canonical research authority:
`iteathen/Connect4@5180d871bee3e4f5553e6e53caf56736f27f4a18`

## Hypothesis

The retained one-pass stable live-line insertion order currently shifts two
separate recursive scratch fields for each displaced sibling:

- dynamic live-line score;
- column.

Pack the exact pair into one uint32 recursive move-order entry so each insertion
shift moves one word instead of two.

This does not skip scoring and does not change ordering.

For initialized geometry:

- `b = ceil(log2(columns))`;
- `stride = 2^b`;
- `mask = stride - 1`;
- enable only when `b < 31` and `lineCount <= 0xffffffff >>> b`;
- `entry = ((score << b) | column) >>> 0`.

For stable descending score order, compare each prior packed entry against:

`threshold = (score << b) >>> 0`.

Because low column bits cannot cross a score boundary, prior >= threshold iff
prior.score >= incoming.score. Equal scores therefore preserve the existing
worker-specific prepared action order.

Decode recursive selected column with `entry & mask`.

Outside the guard retain the existing two-field recursive path.

Root rows remain ordinary columns and retain the existing root ordering code.

## Preserved semantics

Unchanged:
- live-line score;
- stable tie order / worker diversity;
- CPC filtering;
- cofactor/canonicalization;
- reflection transport;
- compact shared/private cache identity;
- packed private epoch/value tag;
- full-q locator hash;
- zero-bound semantics;
- full sharing;
- 1-wide + remaining-deep worker topology.

No child transition is created or recomputed for ordering.

## Qualification

Cycle accounting/source seals change with source.
Generated behavior/root-frontier sources come only from repository generators.
Single-worker performance qualification remains forbidden.

Primary A/B:
A = `f2d56c27...`
B = packed recursive move rows.

4 workers = 1 wide + 3 deep.
Fixture `353335714`.
Whole-process cycles are authoritative.
