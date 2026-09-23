# Cycle reduction round 005

## Fixed packed reflection

The generic geometry fallback in `reflectPacked3x32` was not required by the current proving workload.

The function now owns the concrete representation invariant:

- 7 packed columns;
- 3 bits per column;
- support bits 0..20;
- rank/metadata at bit 21 and above.

This removes runtime geometry guards and the loop.

Static serial ledger:

- before: 26 cycles on the Connect4 fast path;
- after: 22 cycles.

## Ordered antichain normalization

The source Connect4/BSFP normalization flow orders masks by cardinality before reduction.

That ordering is now an explicit JSMinSys precondition.

For minimal frontiers processed in nondecreasing cardinality, an accepted candidate cannot be a strict subset of any earlier retained entry. For maximal frontiers processed in nonincreasing cardinality, the dual property holds.

Therefore an accepted candidate never needs to delete an earlier retained entry, so the second scan/compaction phase is removed.

New ledger:

```text
2 + N*(2*L+3) + C*(2*L+10) + R*(2*S+1)
```

where:

- N = input entries;
- C = subset comparisons performed;
- R = accepted entries;
- L = load cost;
- S = store cost.

This is a structural reduction, not a locally greedy rewrite: it consumes an invariant already produced by the owning workload.
