# Cycle reduction round-056 — reuse owned queue next position

## Existing owned-position profile

Round 049 removed shared reservation atomics for a sole/external-serialized producer or consumer.

The boolean profile still requires the caller to perform:

```text
position = (position + 1) | 0
```

after success.

But the queue operation itself already computes `position + 1` for sequence publication/readiness.

## Reuse

The next-position variants return:

- unchanged `position` when unavailable;
- int32-normalized `position + 1` when successful.

That returned value is immediately caller-ready.

## Governing ledger

Producer boolean profile:

```text
function: ATOMIC_LOAD + STORE_COST + ATOMIC_STORE + 5
caller:   ADD + int32-coercion
```

Producer next profile:

```text
ATOMIC_LOAD + STORE_COST + ATOMIC_STORE + 6
```

One governing ALU cycle disappears.

The consumer profile has the same one-cycle governing reduction.

## Wrap correctness

The returned position is normalized with `|0`, so the API preserves the existing Int32 sequence-number semantics across `0x7fffffff -> -2147483648`.

## Qualification

Tests cover success, unavailable/unchanged return, payload transfer, and signed wrap.
