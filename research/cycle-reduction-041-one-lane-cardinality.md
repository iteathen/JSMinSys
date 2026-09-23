# Cycle reduction round-041 — one-lane cardinality class

## Observation

`cardinalityClass2x32` answers only:

- empty;
- singleton;
- multiple.

For a configured representation known to fit one 32-bit lane, a second-lane emptiness test cannot affect the answer.

Runtime geometry is already selected at initialization, so the hot path should not rediscover lane count.

## Profile

```js
if (word === 0) return 0;
return (word & (word - 1)) === 0 ? 1 : 2;
```

Ledger:

- zero path: 2 cycles;
- nonzero singleton/multiple path: up to 6 cycles.

The corresponding generic two-lane profile is 4-8 cycles.

## Governing-unit rule

Use this profile when the relevant set representation itself is one-lane. Do not truncate or ignore a possibly-live high lane merely to obtain the cheaper cost.

This is the same initialization-selected lane-profile principle already used by state transitions.

## Qualification

Tests cover zero, low singleton, bit-31 singleton, multiple bits, and all-bits-set values.
