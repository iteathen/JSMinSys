# Cycle reduction round-091 — scalar two-word interner fusion

The pinned IsoMax residual block transition already computes changed chunk words as live scalars `next0` and `next1`.

The prior interner boundary immediately materializes those scalars into `resultBits`, then reloads both words for hashing, reloads the source words again for each exact-key equality attempt, and reloads them again on a new chunk before dense-key publication. That scratch round-trip is not semantic state.

Round 090 supplied a 10-cycle direct power-of-two index that accepts the pair as scalars. This round carries those same producer-owned scalars through exact probing and publication.

- `probe2x32IdSlot32` loads only the hash-slot id and stored dense-key words.
- A hit returns the existing nonnegative dense id.
- An empty slot returns `~slot`, preserving hit-versus-insert state without an output object.
- `publish2x32IdSlot32` stores the dense exact pair and hash-slot id directly from the producer scalars.

Exact two-word equality remains authoritative. Hash/index/id are addressing only.

## Governing-unit deletion

For the pinned changed-slot producer, a direct hit deletes 2 transient scratch stores, 2 source-key loads for hashing, and 2 source-key loads for exact comparison. At the NEES L1 reference and minimum local-store throughput this is at least:

`4*LOAD + 2*STORE_COST = 17`

static serial-ledger cycles deleted before counting additional collision candidates.

A direct empty miss followed by insertion deletes the same two scratch stores, two hash-source loads, and two publication-source loads. Every additional occupied equality candidate deletes two more source-key loads.

No work is moved to the caller: `next0` and `next1` already exist as unavoidable masking results. Dense key stores on insertion, hash-slot publication, count updates, growth checks, stored-key comparison loads, and collision traversal remain visible.

## Falsifiers

- reject when the caller does not already own both exact key words as live scalars;
- reject if obtaining scalar keys requires loading or materializing the same source array first;
- reject when occupied ids can exceed the safe `id << 1` dense-pair addressing range;
- reject if the interner requires concurrent atomic publication semantics;
- retain a materialized key buffer when an independently required downstream consumer needs it strongly enough to offset the deleted scratch traffic.
