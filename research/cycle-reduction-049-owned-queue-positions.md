# Cycle reduction round-049 — caller-owned queue reservation positions

## Structural observation

The generic bounded MPMC try paths must arbitrate reservation positions with:

- an atomic shared counter load;
- CAS reservation;
- possible retry under contention.

That machinery is unnecessary on a side with exactly one owner, or where access to that side is already externally serialized.

Producer ownership and consumer ownership are independent properties:

- MPSC may use the owned-consumer profile;
- SPMC may use the owned-producer profile;
- SPSC may use both.

## Synchronization retained

The per-slot sequence word remains atomic.

Producer:

```text
observe sequence
ordinary payload store
atomic sequence publication
```

Consumer:

```text
observe sequence
ordinary payload load
atomic sequence release
```

Therefore payload publication/acquisition is not weakened merely because the reservation position is caller-local.

## Generic enqueue micro-reduction

The successful generic try-enqueue path used `position + 1` twice. It now computes `ready` once after confirming the slot is available and reuses it for CAS and publication:

```text
local fast-path term: +7 -> +6
```

No extra work is added to full/stale paths.

## Owned producer ledger

```text
function success:
ATOMIC_LOAD + STORE_COST + ATOMIC_STORE + 5

caller success advance:
ADD + int32-coercion
```

The caller-local advance is explicit. It is not silently omitted from governing-unit accounting.

Compared with the generic success path, the structural deletion is one shared counter atomic load plus the locked reservation RMW and all CAS retries.

## Owned consumer ledger

```text
function success:
ATOMIC_LOAD + LOAD + STORE_COST + ATOMIC_STORE + 6

caller success advance:
ADD + int32-coercion
```

Again the shared counter atomic load, CAS, and retry loop disappear.

## Preconditions / falsifiers

Do not select an owned-side profile when multiple unsynchronized agents may reserve positions on that same side.

Do not claim a win by moving the reservation position into another shared atomic word; ownership must actually make the position local or externally serialized.

## Qualification

Tests exercise successful enqueue/dequeue, empty detection, fill-to-capacity, and full detection using caller-maintained int32 positions.
