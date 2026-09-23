# Cycle reduction round-048 — lazy frontier compaction

## Waste in ordinary in-place normalization

Ordered normalization currently writes every accepted candidate back to:

```text
output[retained]
```

Before the first rejection, `retained === index`, so every such write stores the exact value back to the exact slot it already occupies.

Compaction is only necessary after a candidate is rejected.

## Two-phase structure

Phase 1 scans the accepted prefix without stores.

At the first rejection:

```text
retained = rejectedIndex
```

The rejected entry is skipped and phase 2 performs ordinary compaction for the remainder.

If no rejection occurs, the input is already normalized and the function returns without any stores.

## Conservative ledger

The accounting deliberately leaves candidate and containment terms unchanged and charges one extra transition cycle. Only the store term changes.

One lane:

```text
ordinary: 2 + N*(L+3) + C*(L+5) + R*(S+1)
lazy:     3 + N*(L+3) + C*(L+5) + M*(S+1)
```

Two lanes:

```text
ordinary: 2 + N*(2L+3) + C*(2L+8) + R*(2S+1)
lazy:     3 + N*(2L+3) + C*(2L+8) + M*(2S+1)
```

`M` counts accepted entries that actually move after the first rejection.

For every nonempty call, at least the first accepted entry remains in the untouched prefix, so:

```text
M <= R - 1
```

Even with the conservative +1 transition charge, the one-lane hot ledger improves by at least 0.5 cycles and the two-lane ledger by at least 1 cycle under the current simple-store throughput model. No-rejection calls remove the entire accepted-store term.

## Preconditions

The lazy profile is cost-qualified for `length > 0`. Generic existing normalizers remain available for unrestricted callers.

Cardinality ordering and signed bit-pattern containment semantics are unchanged.

## Qualification

Differential tests compare lazy and ordinary one-/two-lane minimal/maximal normalizers, including a no-rejection input whose storage must remain byte-for-byte unchanged.
