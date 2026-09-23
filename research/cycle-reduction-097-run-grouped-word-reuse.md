# Cycle reduction round-097 — reuse consecutive immutable word loads

The pinned IsoMax move-order classifier scans precompiled pair incidence in term-ID order. That ordering already groups equal residual-word indices consecutively, but the earlier classifier reloaded the same immutable residual word for every incidence entry.

The selected profile keeps only two caller scalars: the current word index and current word bits. A load occurs only at a run boundary.

For N incidence entries grouped into G consecutive word runs:

`2*N + G*LOAD + BM`

At the L1 reference, this beats unconditional `N*LOAD` when `G < N/2`.

## Pinned governing evidence

The accepted issue-99 implementation used this exact structural method.

Instrumentation showed residual word loads falling:

- 5,014,701 -> 1,397,941;
- 19,330,402 -> 5,197,217;
- 11,036,740 -> 3,320,500.

Separate uninstrumented paired timings preserved exact decisions/work:

- serial median 1578.33 -> 1436.89 ms (~9.0% lower);
- one-worker 1921.90 -> 1810.81 ms (~5.8% lower);
- four-worker 1636.86 -> 1587.20 ms (~3.0% lower).

The profile adds no cache object, allocation, sorting, or mutable metadata. The prepared incidence order is already the source of grouping.

## Falsifiers

- equal word indices are not consecutive;
- word contents can change during the scan;
- run lengths are too short to beat equality/control overhead;
- branch prediction or register pressure erases the deleted loads;
- reuse requires any memory-resident cache state.
