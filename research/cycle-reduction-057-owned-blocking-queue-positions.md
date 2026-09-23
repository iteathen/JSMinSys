# Cycle reduction round-057 — owned positions for blocking queues

## Structural observation

Blocking queue operations have two independent synchronization responsibilities:

1. reserve a monotonic producer/consumer position;
2. wait for and publish/release a per-slot sequence state.

When one side has exactly one owner, or access to that side is externally serialized, responsibility (1) does not require a shared atomic RMW.

Responsibility (2) still requires `Atomics.wait` / sequence publication and wakeup for blocking progress.

## Owned producer

Generic blocking producer fast path includes:

```text
ATOMIC_RMW(reserve) + slot/sequence/payload/publication work
```

Owned producer removes the reservation RMW and accepts caller-local `position`.

It returns int32-normalized `position + 1`, reusing the publication position as caller state.

## Owned consumer

The same reduction applies independently to a sole/external-serialized consumer.

Caller-provided output storage receives the payload so the function can return the next reservation position without allocating a pair.

## Wait semantics

These profiles remain unbounded in elapsed time:

```text
wait iteration = ATOMIC_WAIT + ATOMIC_LOAD + comparison
```

No wait/notify cost is hidden or removed.

## Falsifier

Do not select an owned-side profile when multiple unsynchronized agents may reserve positions on that side.

Do not move the reservation counter to another shared atomic location and claim ownership.

## Qualification

Tests cover producer/consumer transfer, sequence release, and int32 wrap.
