# Cycle reduction round-089 — sentinel-owned exact triple probe

The pinned IsoMax transition cache stores exact q identity in three scalar arrays and separately stores a `used[]` occupancy byte.

That duplicates one physical fact. During a prepared probe the loop first loads `used[slot]`, then loads `p0[slot]` for exact identity. After the loop, prepared get/store reloads `used[slot]` to rediscover whether the terminal slot was an exact hit or empty.

The first exact coordinate already has a spare representation value. Residual class IDs are nonnegative and the only gameplay terminal class is `RESIDUAL_TERMINAL_WIN = -1`. A different reserved negative int32 value can therefore mark an empty key0 slot.

Selected representation:

- initialize every key0 slot to the reserved sentinel once;
- load key0 first during probing;
- sentinel means empty;
- otherwise reuse that same loaded scalar for key0 equality;
- return an exact-hit slot as a nonnegative index;
- return an empty slot as `~slot`, preserving terminal probe state in the scalar result.

Hot governing-unit effect relative to the separate-occupancy representation:

- every occupied collision step deletes one occupancy load;
- an exact-hit probe deletes the occupancy load for the terminal occupied slot;
- prepared get/store can replace the post-probe occupancy reload with a scalar sign test;
- insertion no longer stores a separate occupancy byte;
- the `used[]` allocation/working-set is unnecessary for this selected representation.

Miss encoding is not free. The probe pays one NOT to encode an empty slot, and insertion pays one NOT to recover the slot. Those operations remain visible. Cold sentinel initialization is also explicit:

`fillI32Sentinel32 = 2 + N*(3 + STORE_COST)`

where N is configured capacity.

Direct probe ledgers under predicted control:

- empty primary slot: `LOAD + 3` (7 cycles at L1);
- exact primary hit: `3*LOAD + 8` (20 cycles at L1);
- each occupied collision removes one memory load versus the separate `used[]` + key0 representation, with deeper exact-prefix comparisons still fully accounted.

This profile does not weaken identity: all three coordinates must still match. The locator remains addressing only.

Falsifiers:

- reject if the configured key0 domain cannot reserve a sentinel distinct from every valid coordinate, including terminal values;
- reject if the table may become completely full and therefore lose a terminating sentinel slot;
- reject at integration if measured governing-unit probe behavior or generated code does not retain the loaded key0 scalar and the deleted memory traffic fails to materialize;
- retain the separate-occupancy representation when another independently required consumer needs `used[]` strongly enough to outweigh its probe/store/working-set cost.
