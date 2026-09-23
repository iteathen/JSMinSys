# Cycle reduction round-040 — scalar seven-slot selection

## Lower bound

Selecting the maximum of seven candidates requires at least six score comparisons in the comparison model.

`argMaxPlayableSlot7Nonempty32` already reaches that comparison count. Its remaining dominant cost is seven score loads.

## Producer-owned scalar profile

When the score producer already has all seven score values as live scalars, spilling them to `scoresInOrder` and reloading them solely for selection is unnecessary.

`argMaxPlayableSlot7ScalarsNonempty32` consumes the seven values directly and performs the same six strict-greater-than updates.

Tie semantics are unchanged: equal scores keep the earlier/preferred slot.

## Ledger

Current exact-seven array profile:

```text
7*LOAD + 6*COMPARE_SELECT
L1 = 40
L2 = 96
L3 = 341
```

Scalar profile:

```text
6*COMPARE_SELECT = 12 predicted static serial cycles
```

Register-local assignments are treated as eliminable moves under the current NEES snapshot.

## Governing-unit falsifier

This reduction applies only if score production already owns the values as scalars.

If the caller performs seven array loads merely to populate these arguments, or must spill the seven scores for another unavoidable consumer, those costs remain in the governing unit and must be accounted there. This profile is not permission to move loads outside the function and call them free.

## Geometry

The specialization is selected for configured candidate count 7. It does not hard-code board height or any 7x6 mechanical geometry; runtime initialization owns the selection of this profile.
