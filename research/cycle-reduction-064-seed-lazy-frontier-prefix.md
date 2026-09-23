# Cycle reduction round-064 — seed the first lazy-frontier entry

All lazy normalization profiles already require:

```text
length > 0
```

and process candidates in cardinality order.

Entry 0 has no earlier retained entry that could reject it, so it is provably retained without loading or testing its mask.

The prefix scan now begins at index 1.

## Ledger

One lane:

```text
before: 3 + N*(L+3) + C*(L+5) + M*(S+1)
after:  3 + (N-1)*(L+3) + C*(L+5) + M*(S+1)
```

Hot-L1 saving: 7 cycles per nonempty call.

Two lanes:

```text
before: 3 + N*(2L+3) + C*(2L+8) + M*(2S+1)
after:  3 + (N-1)*(2L+3) + C*(2L+8) + M*(2S+1)
```

Hot-L1 saving: 11 cycles per nonempty call.

No containment semantics or compaction behavior changes.

Tests include length-1 signed bit-31 vectors for all four lazy profiles.
