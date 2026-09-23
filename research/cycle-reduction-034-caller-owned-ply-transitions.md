# Cycle reduction round-034 — caller-owned ply transition profiles

## Decision boundary

This is an integration-selected alternative, not a universal replacement.

The pinned Connect4 incumbent corpus at `3c7524321d49c11c3cb6c519425e3bd0ed4bb42b` already carries search depth/ply as a live recursive scalar in `components/incumbent/search.mjs`, while its mutable position also maintains `position.ply`. In that ownership shape, maintaining the same rank fact in the JSMinSys transition state is duplicate work.

The pinned IsoMax corpus at `a26ef2254c850243f68505eeff1d849ad0f4f0c0` instead has recursion consume `state.ply`. For that ownership shape, deleting the state word would merely move the required work into the caller. The existing state-owned-ply transition profiles therefore remain valid and necessary.

## Structural change

Four optional transition profiles store only mechanical board state:

- one lane: `playableLo`, `supportCode`;
- two lanes: `playableLo`, `playableHi`, `supportCode`.

They do not load, store, increment, or decrement ply. The caller continues to derive side from its already-owned rank with `ply & 1`.

No move-history word is restored. Undo still consumes the exact column supplied by its recursive caller. Runtime-configured width/cell-count and precomputed `supportDelta` remain unchanged.

## Governing cycle ledger

| profile | before | after | structural deletion |
|---|---:|---:|---|
| one-lane apply/undo | 25-27 L1 / 57-59 L2 | 19.5-21.5 L1 / 43.5-45.5 L2 | one state load, one state store, one ply add/sub |
| two-lane apply/undo | 27-35.5 L1 / 59-75.5 L2 | 21.5-30 L1 / 45.5-62 L2 | same duplicate rank maintenance |

The one-lane expression becomes `3*LOAD + 3*STORE + 6..8 ALU/control`.

The two-lane normal expression becomes `3*LOAD + 3*STORE + 8..12 ALU/control`; the cross-lane-above case is `4*LOAD + 4*STORE + 12 ALU/control`.

These are NEES additive static serial ledgers for `node26-v8-14.6/x86_64-amd-zen3`, not wall-clock latency claims.

## Falsifier / no-false-win rule

Do **not** select a caller-owned-ply profile if the integration would have to create and update a new caller-side mutable ply solely to satisfy this primitive. That would move rather than delete the work and invalidates the claimed governing-unit reduction.

Select it only when rank/ply already exists independently for recursion, identity, depth, terminal scoring, or another unavoidable owning requirement.

## Qualification

Behavioral tests compare the compact profiles against the state-owned profiles for:

- a runtime-configured <=32-cell geometry;
- a runtime-configured two-lane geometry;
- apply and undo symmetry;
- the low/high-lane boundary transition.

The 7x6 geometry used in one test is test data only; the functions remain runtime-parameterized.
