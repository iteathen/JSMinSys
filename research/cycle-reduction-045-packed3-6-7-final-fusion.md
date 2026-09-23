# Cycle reduction round-045 — fuse 6/7-column reflection alignment

## Existing network

The 6/7-column packed-3 profile pads to an eight-field 24-bit lane, performs:

1. adjacent 3-bit field swaps;
2. 6-bit group swaps;
3. a 12-bit half exchange;
4. a final right alignment for the unused padded fields.

The third stage plus alignment previously cost five ALU operations.

## Algebraic fusion

For the post-stage-2 value `x`:

```text
(((x << 12) | (x >>> 12)) & 0xffffff) >>> r
```

is equivalent, for the configured 6/7-column cases, to:

```text
((x & 0xfff) << leftShift) | (x >>> highShift)
```

where initialization prepares:

- 6 columns: `leftShift=6`, `highShift=18`;
- 7 columns: `leftShift=9`, `highShift=15`.

The final stage therefore costs four operations instead of five.

## Ledger

`reflectPacked3Columns6To7`:

- before: 15 cycles;
- after: 14 cycles.

No memory access or hot geometry dispatch is added.

## Qualification

The identity was checked exhaustively for all 18-bit six-column inputs before implementation, and sampled heavily for seven columns. Repository tests compare both configured forms against `reflectPacked3Direct32`.

This remains runtime-configured geometry: initialization selects the 6- or 7-column prepared constants once.
