# Cycle reduction round-086 — joint triple locator mixing

The pinned transition cache keys ordinary nodes by three exact numeric coordinates. Hash output only chooses a probe start; all coordinates are compared exactly before a hit is accepted.

Independent per-coordinate avalanche is therefore unnecessary work. A joint locator computes:

x = imul(a,C1) XOR imul(b,C2) XOR imul(c,C3)
hash = imul(x XOR (x >>> 16), C4)

Static serial ledger: 16 cycles.

A composition that independently applies the existing 5-cycle mix32 to each coordinate, combines each with an FNV-style multiply, then applies a final mix32 is about 32 serial-ledger cycles.

Correctness does not depend on collision freedom: exact tuple equality remains mandatory. Qualification checks coordinate sensitivity and a deterministic 4096-sample low-byte distribution sanity control.

This is a locator optimization only. Never substitute the hash for exact identity.
