# Cycle reduction round-047 — one-lane frontier normalization

## Representation selection

JSMinSys already selects one-lane state transitions for configured domains that fit 32 bits. Frontier normalization should obey the same principle.

When every mask in the frontier fits one 32-bit lane, a two-lane antichain representation carries no information in `hi` yet pays for:

- one extra candidate load per input entry;
- one extra retained-entry load per containment check;
- one extra store per accepted entry;
- the second-lane containment condition.

## One-lane signed profiles

Signed bit-pattern storage permits direct containment without unsigned normalization:

Minimal:

```text
(existing & candidate) === existing
```

Maximal:

```text
(candidate & existing) === candidate
```

The existing cardinality-order preconditions still prove that only a rejection scan is required.

## Ledger

Two-lane signed profile:

```text
2 + N*(2L+3) + C*(2L+8) + R*(2S+1)
L1: 2 + 11N + 16C + 2R
```

One-lane signed profile:

```text
2 + N*(L+3) + C*(L+5) + R*(S+1)
L1: 2 + 7N + 9C + 1.5R
```

This is a representation reduction, not a special-case fixed board size. Initialization selects the lane count from the configured mask domain.

## Correctness

Tests cover minimal/maximal ordered reduction and bit-31 signed patterns.
