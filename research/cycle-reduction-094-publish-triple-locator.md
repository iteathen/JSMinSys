# Cycle reduction round-094 — fuse canonical triple publication with locator

The pinned IsoMax ordinary transition-cache key path uses caller-owned three-word scratch as a multi-value return channel.

Canonical key production determines three exact scalars, writes them to scratch, and the caller later needs those stored coordinates for exact probing and recursive lifetime.

The locator, however, does not need the scratch representation. A store-then-hash composition writes all three coordinates and immediately reloads all three solely to feed the mixer.

`publish3x32Locator32` keeps the required scratch publication but computes the same round-086 joint locator from the already-live producer scalars.

## Governing-unit deletion

Unchanged work:

- three scratch stores required for multi-value publication;
- the full 16-cycle joint triple locator;
- later caller loads of the three scratch coordinates required to retain exact key scalars;
- exact-key collision checks.

Deleted work:

- three scratch loads between publication and hashing.

Under the NEES L1 reference that is **12 static serial-ledger cycles removed per prepared key**.

The fused function costs:

`18 + 3*STORE_COST`

where 18 is the 16-cycle locator plus two indexed-address increments for the three-word publication.

No caller work is introduced and no identity semantics change.

## Bit-pattern rule

The pinned scratch is Int32-backed while support is logically uint32. Publication preserves the same low 32 bits. The locator uses 32-bit arithmetic and therefore observes identical bits; downstream consumers that require unsigned numeric magnitude continue to normalize explicitly.

## Falsifiers

- the caller does not independently need the three-coordinate scratch publication;
- key coordinates are not already live at the publication point;
- generated code reloads scratch despite the scalar source expressions;
- the fused body prevents inlining or creates register spills that exceed the deleted three loads;
- the locator is incorrectly promoted from addressing to semantic identity.
