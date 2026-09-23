# Cycle reduction round-054 — pack support + ply in physical transition state

## Important boundary

This does **not** reverse the earlier decision to remove rank/ply from reflection.

Reflection remains support-only.

The new profile changes only physical transition storage when configuration proves that support fields plus rank fit one uint32.

## Configuration requirements

For the current packed support profile:

```text
supportBits = 3 * columns
rankShift = supportBits
rankBits = bits required for configured ply range
supportBits + rankBits <= 32
rows <= 7
```

Rows are bounded because each support height uses three bits; a legal increment must not overflow its support field into rank.

Initialization prepares:

```text
rankIncrement
supportMask
combinedDelta[index] = supportDelta[index] + rankIncrement
```

One initialization ADD per move index creates the combined delta.

## Transition reduction

Separate state-owned ply + support requires two loads, two stores, and two arithmetic updates across those facts.

Packed state uses:

```text
packed += combinedDelta
```

or on undo:

```text
packed -= combinedDelta
```

with one load/store/update.

Known-cell one-lane:

- separate state apply: 21-23 L1;
- packed apply: 15.5-17.5 L1;
- separate known-cell undo: 20-22 L1;
- packed undo: 14.5-16.5 L1.

Known-cell two-lane:

- separate state apply: 23-31.5 L1;
- packed apply: 17.5-26 L1;
- separate known-cell undo: 22-30.5 L1;
- packed undo: 16.5-25 L1.

## Extraction costs

From an already-loaded packed word:

- support-only: `code & supportMask` = 1 cycle;
- ply: `code >>> rankShift` = 1 cycle;
- side: shift + parity AND = 2 cycles.

If a node needs both support and ply, one packed state load plus two ALU extractions can be cheaper than two separate state loads. If it needs only one, the extra extraction cycle remains visible in governing-unit accounting.

## Reflection preservation

Before any packed-3 reflection:

```text
support = code & supportMask
reflected = reflectPacked3...(support)
```

No reflection function accepts or manipulates rank bits.

## Qualification

Differential tests compare packed and separate state on runtime-configured one-lane 4x4 and two-lane 7x6 test geometries, including a low-to-high playable-bit crossing. The 7x6 vector is test data, not a generic geometry assumption.
