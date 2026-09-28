# IsoMax Phase-2 hot-helper live recovery

Date: 2026-09-27

Recovered after UI desynchronization.

Canonical research authority advanced to Connect4 `research/semantic-quotient`
at `8a230a814a2ac66d6b0bfb7dd993df13fe785eaf`.

The new IsoGraph result isolates pure coalesced locator-hash reuse as the
preferred completed exact-control candidate:

- retained coalescing+shared draw: `e449df20dc59cc6c1e5b2da78134751a2376f355`
- preferred pure coalesced known-hash reuse: `f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`
- fallback-based all-hot candidate: `48c514e747cb2656666b951f97e0928dda501cf7`

Selective all-noncutoff fallback has not demonstrated incremental completed-tree
value once locator-hash reuse is present. Under the minimum-machinery rule it is
not part of the preferred path.

Therefore this branch starts directly from `f549dcf...`.

The previous helper experiment branch
`experiment/isomax-phase2-shared-hash-hot-helper-20260927` is preserved as
historical implementation evidence. Its latest visible head was
`c75f9dad72db26f98612df68d655e051c3232624`; Verify failed at catalog summary
bookkeeping (156 != 158), not syntax compatibility.

This branch will transplant only the mandatory-known-hash helper specialization:
- compatibility public helpers remain;
- mandatory-known-hash hot probe/store helpers remove the default-path selection;
- full key/sequence validation and exact-only shared semantics remain;
- canonical alpha-beta and generated mirrors use the hot helpers;
- NEES accounting is updated before timing;
- no single-worker qualification.
