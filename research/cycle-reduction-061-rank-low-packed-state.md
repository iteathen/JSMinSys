# Cycle reduction round-061 — rank-low packed support+ply layout

Round 054/055 established that support and rank can share one physical uint32 when the configured bit budget permits.

The original layout placed support low and rank high. That gives:

- support extraction: one AND;
- rank extraction: one shift;
- side extraction: shift + AND = 2 cycles.

The transition functions themselves only add/subtract a precomputed combined delta. They do not depend on field order.

## Rank-low layout

Place rank in the low bits and support above it.

Initialization prepares:

```text
combinedDelta = 1 + (supportDelta << rankBits)
```

under the same no-field-overflow invariants.

Extraction becomes:

```text
ply     = packed & rankMask
support = packed >>> rankBits
side    = packed & 1
```

Costs:

- ply: 1 cycle;
- support: 1 cycle;
- side: 1 cycle.

Support-only reflection therefore remains one extraction operation, while side-to-move improves from 2 to 1 cycle.

Both layouts remain valid compatibility profiles; rank-low is preferred when side parity is hot.
