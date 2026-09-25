# Cycle reduction 116 — direct CPC forced child

**Candidate:** `df33f892ca36f34e53f56e1106fa83622a9b9cc2`
**Baseline:** `c853a4c7fd3436089e45bc259c1461f601d866bb`
**Disposition:** rejected.

The candidate bypassed one-element move-order publication and the generic sibling loop when CPC supplied exactly one forced defense. It preserved cache policy and recursion topology.

Verify `36081545987` passed. Search A/B `36081542191` preserved nodes/cofactors/forced counts but production CPC-only aggregate warm median regressed 10.70% and elapsed regressed 6.61%.

This matches the historical distinction: a one-child control-flow rewrite is not the promoted forced-macro result. The useful experiment must eliminate deterministic intermediate search/cache states, not merely encode the same recursion differently.