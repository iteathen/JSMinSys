# Cycle reduction round-069 — unsigned seeded lazy frontier profiles

The signed frontier profiles already combine two structural reductions: entry 0 is accepted without inspection, and compaction stores begin only after the first rejection.

Uint32-owned frontiers previously had to use the older unsigned normalizers, which missed both reductions.

The added unsigned profiles preserve bit-31 correctness:

- minimal containment precomputes ~candidate and tests existing & inverse == 0;
- maximal containment tests candidate & ~existing == 0.

One-lane and two-lane variants both require length > 0, begin at index 1, and store only accepted entries that actually move after a rejection.

Signed storage remains cheaper when it is an available representation choice, but unsigned ownership no longer forces dead-lane or prefix-rewrite work.
