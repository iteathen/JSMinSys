# IsoMax Phase-2 packed shared-hash fingerprint experiment

Date: 2026-09-27

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

## Measured pressure

On the shared-admission hard census:
- 214.0M shared probes;
- 150.8M probes reached an occupied slot with the wrong full q key;
- key mismatch was roughly 70% of all probes.

Worker-role specialization was measured and rejected as too small.

## Candidate

The shared cache already stores exact W/D/L in a Uint32 word although only codes
1..3 are used. Reuse the unused high bits as a locator fingerprint:

    packed = (hash & ~3) | exactCode

Probe order:
1. locate slot from the already-computed hash;
2. read even/nonzero sequence;
3. atomically load packed value;
4. if ((packed ^ hash) >>> 2) != 0, fail closed immediately;
5. otherwise perform the existing full q-key comparison;
6. perform the existing final sequence validation;
7. return packed & 3.

Correctness:
- fingerprint mismatch can only cause a cache miss;
- fingerprint equality is never accepted as q identity;
- full q-key equality remains mandatory;
- final sequence validation remains mandatory;
- shared cache remains exact-only;
- no solved-position prior information.

No additional table.
No additional per-slot allocation.
No new hash computation.
Store adds only packing operations before the existing value store.

Update the NEES ledger in the same work and Verify before timing.

Matched 4-worker A/B:
A = `f549dcf...`
B = verified packed-fingerprint revision.

Primary authority:
whole-process cycles on exact `353335714`.

Secondary:
official-hard `35333571`, fixed 120000 ms ceiling.
