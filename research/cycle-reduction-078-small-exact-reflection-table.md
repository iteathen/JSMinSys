# Cycle reduction round-078 — exact C3/C4 reflection cache profiles

The register reflectors are already cheap at small widths:

- C2: 4 cycles
- C3: 6 cycles
- C4: 9 cycles
- C5: 11 cycles

A full exact table is worthwhile only where its footprint remains plausibly L1-resident and the lookup is strictly cheaper than the register network.

C3 needs 2^9 = 512 Uint32 entries = 2 KiB.
C4 needs 2^12 = 4096 Uint32 entries = 16 KiB.

The lookup costs one LOAD: 4 L1 / 12 L2 / 47 L3.

Thus it is an L1 optimization for C3/C4, not a universal replacement. C2 gains nothing over its 4-cycle register path, while C5 would require 128 KiB and is excluded.

fillReflectExactSmall32 has an explicit setup ledger composed from the already-qualified direct reflector. Caller-owned allocation remains separately costed.
