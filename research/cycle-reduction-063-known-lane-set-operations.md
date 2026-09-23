# Cycle reduction round-063 — reuse caller-known lane ownership

Pinned set iteration and frontier code frequently separates low-word and high-word work before bit indexing.

When the caller already knows the high lane is the relevant nonempty lane, the generic two-lane first-set helper should not retest the low lane.

`firstSetHighBitIndex32` computes:

```text
63 - clz32(hi & -hi)
```

for 4 cycles, versus 6 cycles for `firstSetBitIndex2x32`.

The same ownership principle applies to cardinality classification. `cardinalityClass32` is explicitly valid when a two-lane caller already proved the other lane empty; no representation conversion is required.

The reduced profiles apply only when the lane fact already exists for independent control-flow or representation reasons.
