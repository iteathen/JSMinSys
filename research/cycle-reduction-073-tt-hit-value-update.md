# Cycle reduction round-073 — value-only TT hit update

ttHit32 already proves tags[index] equals the requested tag while leaving the caller with the prepared index.

If the caller then updates the entry at that same identity, rewriting the tag is redundant.

Full replacement:

2 * STORE_COST

Proven-hit update:

STORE_COST

ttReplace32 remains authoritative for misses, collisions, or replacements where the tag must change.

The reduction is not a moved check: the tag comparison already exists for hit authorization.
