# Cycle reduction round-060 — initialization-prepared cross-word shift distances

Board-direction and other fixed-width shift distances are configuration invariants.

The existing branch-free range profiles still recompute either:

```text
32 - count
```

or:

```text
count - 32
```

on every call.

Prepared-distance variants move that one subtraction to initialization.

## Ledger

Low-count left/right:

- before: 7 cycles;
- after: 6 cycles.

High-count left/right:

- before: 4 cycles;
- after: 3 cycles.

Setup is one SUB per configured shift distance and remains explicit.

The generic and range-only functions remain available when counts are not initialization-stable.
