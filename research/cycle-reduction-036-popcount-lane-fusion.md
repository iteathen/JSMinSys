# Cycle reduction round-036 — two-lane popcount accumulation fusion

## Consumer audit

The pinned proving corpus does not permit deleting exact popcount globally:

- `components/oracle/exact7x6.mjs` at `3c7524321d49c11c3cb6c519425e3bd0ed4bb42b` uses exact popcount as a move-order score;
- `components/isometric/residual-pool.mjs` at `a26ef2254c850243f68505eeff1d849ad0f4f0c0` uses exact counts for diagnostic enumeration sizing;
- BSFP normalization uses exact cardinality for ordering/bucketing.

The IsoMax hot frontier already uses zero/one/multiple classification instead of full cardinality, so that structural substitution is already represented by `cardinalityClass2x32`.

## Fusion

After the third SWAR stage, each 32-bit lane contains four independent byte-local population counts:

```text
byte_i in [0, 8]
```

For two lanes, corresponding byte counts can be added before horizontal accumulation:

```text
byte_i(lo) + byte_i(hi) in [0, 16]
```

Because 16 fits within one byte, this addition cannot carry into an adjacent byte. One shared:

```text
Math.imul(a + b, 0x01010101) >>> 24
```

therefore accumulates all eight byte counts exactly.

## Cycle ledger

`popcount2x32`:

- before: two 14-cycle lane popcounts + final add = 29;
- after: two 10-cycle pre-accumulation stages + add + one 3-cycle IMUL + shift = 25.

`popcount2x32SparseHigh`:

- `hi === 0`: unchanged 16-cycle path;
- `hi !== 0`: 27 cycles instead of 31.

The sparse-high break-even against fixed 25 becomes:

```text
16p + 27(1-p) < 25
p > 2/11 ~= 18.2%
```

where `p = P(hi === 0)`.

These are NEES additive static serial ledgers, not wall-clock latency claims.

## Qualification

Tests include the maximum 64-bit cardinality (both lanes all ones), which also exercises the maximum per-byte fused sum. Existing 42-cell and sparse-high vectors remain.
