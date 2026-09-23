# Cycle reduction round-050 — high-10-bit popcount table profile

## Geometry/profile observation

A two-lane configured mask may use only a small prefix of the high lane.

When the high lane has at most 10 live bits:

```text
0 <= hi < 1024
```

an exact high-lane count can be looked up from a 1024-entry Uint32 table.

This is not a universal 42-cell maximum. Configurations with more than 10 high-lane bits retain the fused two-lane SWAR path; one-lane configurations retain `popcount32`.

## Initialization

`fillPopcount10Table32` builds a 4 KiB table with:

```text
table[value] = table[value >>> 1] + (value & 1)
```

The setup ledger is explicit:

```text
STORE_COST + 1023*(LOAD + STORE_COST + 5)
```

The memory footprint and setup work are therefore not hidden.

## Hot exact count

The low lane uses the existing 14-cycle SWAR count. The high lane is one table load, followed by one add:

```text
14 + LOAD(table[hi]) + 1
```

Scenarios:

- L1: 19 cycles;
- L2: 27 cycles;
- L3: 62 cycles.

The fixed fused two-lane SWAR profile remains 25 cycles.

Therefore this profile is selected only when cache/workload evidence supports a sufficiently hot table. It is deliberately not presented as universally faster.

## Qualification

Tests build the table, verify boundary counts, and compare representative high<=10 vectors against `popcount2x32`.
