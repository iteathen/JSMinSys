# Cycle reduction round-062 — cutoff-first alpha-beta child updates

## Invariant

Before processing a child while search continues:

```text
alpha < beta
```

For a maximizing child:

```text
max(alpha, value) >= beta
```

is therefore equivalent to:

```text
value >= beta
```

For a minimizing child, the dual equivalence is:

```text
min(beta, value) <= alpha
iff
value <= alpha
```

## Reordering

Conventional maximizing update:

```text
alpha = max(alpha, value)   // 2
cutoff = alpha >= beta      // 1
```

Cutoff-first:

```text
if value >= beta: cutoff    // 1
alpha = max(alpha, value)   // only non-cutoff
```

So:

- cutoff path: 3 -> 1 cycles;
- non-cutoff path: 3 -> 3 cycles.

The minimizing case is identical by duality.

This is workload-aligned with the pinned alpha-beta loop, which updates a bound and immediately checks cutoff after each child.
