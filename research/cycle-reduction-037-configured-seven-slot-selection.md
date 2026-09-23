# Cycle reduction round-037 — configured seven-slot selection

## Why a width-specific profile is valid here

This does **not** change the generic JSMinSys contract to 7 columns.

Board/candidate geometry is chosen at runtime initialization and then immutable. The generic `argMaxPlayableSlot32(scores, count)` remains available for every configured count. When initialization observes exactly seven move slots, it may select a separate exact-count implementation with no hot dispatch.

This is the same profile-selection principle used for one-lane/two-lane transitions and configured reflection widths.

## Nonempty invariant

The exact profile is selected only inside a node class where at least one playable candidate is already established.

It seeds:

```text
bestIndex = 0
bestScore = scores[0]
```

and scans slots 1..6 with strict-greater updates. If slot 0 is unplayable, its minimum sentinel is replaced by the first playable score. Strict-greater updates preserve preferred-order tie semantics.

An all-unplayable input violates this profile's precondition and must use the generic selector when that state is meaningful.

## Cycle ledger

Six loop iterations, loop-index maintenance, count checks, paired-count preparation, and tail handling disappear.

The exact scan is:

```text
7*LOAD + 6*COMPARE_SELECT
```

Using the current upper compare/select ledger of 2 cycles:

- L1: `7*4 + 12 = 40`;
- L2: `7*12 + 12 = 96`;
- L3: `7*47 + 12 = 341`.

Generic seven-slot move-slot selector:

- L1: 57;
- L2: 113;
- L3: 358.

Reduction: 17 additive serial cycles at each listed cache level.

These are NEES static ledgers, not wall-clock latency claims.

## Queue candidate audit

The shared-queue candidate was also challenged this round. The pinned IsoMax execution at `a26ef2254c850243f68505eeff1d849ad0f4f0c0` does not permit silently dropped credit: its conserved worker ledger explicitly rejects dropped accounting, duplicate remote reaches are detected/yielded, and dead-worker recovery exists.

Therefore JSMinSys does not add an overwrite/drop/duplicate-work queue profile on the current evidence. The already-added nonblocking try paths remain the safe relaxation unless a different fault policy is explicitly established.

## Qualification

Behavioral tests compare the exact seven-slot selector to the generic move-slot selector on the existing scored candidate vector. The generic selector retains the all-unplayable sentinel test.
