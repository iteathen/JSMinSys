# Cycle reduction round-051 — store-only atomic release

## Requirement challenge

`atomicRelease32` performs an atomic store followed by `Atomics.notify`.

The notify is only load-bearing when another agent is blocked in `Atomics.wait` on that location.

Polling consumers, nonblocking algorithms, or systems with an independently owned wakeup channel do not require it.

## Profile

`atomicReleaseNoNotify32` retains the sequentially consistent atomic store and removes only the wake operation.

```text
before: ATOMIC_STORE + ATOMIC_NOTIFY
after:  ATOMIC_STORE
```

NEES keeps notify cost symbolic/scheduler-dependent, so the reduction is recorded structurally rather than assigned a false scalar.

## Preconditions

Do not select this profile if progress depends on waking `Atomics.wait` sleepers on this word.

Publication semantics remain atomic; only wake ownership is narrowed.

## Qualification

Behavioral tests verify the release value through `Atomics.load`.
