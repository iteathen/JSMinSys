# Recurring whole-block solution catalog — Connect4 corpus v0

A “block” is a recurring multi-operation solution pattern below an application abstraction but above individual machine-like primitives.

The purpose of this catalog is to expose opportunities for:

- fusion
- deletion
- precomputation
- representation redesign
- qualification as a reusable JSMinSys block only when the block itself is cheaper than repeated open-coded construction

## 1. Bit membership

### Test bit

Concept:

```text
word & mask != 0
```

Used for:

- occupancy
- ownership
- requirement membership
- winning-line incidence
- frontier/set membership

Likely basis:

- load
- AND
- zero/nonzero test
- branch/select

### Set bit

```text
word := word | mask
```

Likely basis:

- load
- OR
- store

### Clear bit

```text
word := word & inverseMask
```

Potentially avoid runtime NOT by storing/precomputing inverse masks.

### Toggle/difference

```text
word := word XOR mask
```

Useful for reversible state and symmetric difference.

## 2. Fixed-width word composition

Recurring in bitboards and packed 42-bit representations.

### Wordwise logical operation

For N 32-bit lanes:

```text
dst[i] = a[i] OP b[i]
```

where OP is AND/OR/XOR.

Properties:

- embarrassingly lane-local
- no carry
- easy to unroll for fixed widths
- strong candidate for keeping representations aligned to 32-bit boundaries

### Zero/equality across words

```text
(a0 | a1 | ... | an) == 0
```

or lane comparisons.

### Cross-word shift

Only required when the representation demands bit transport across lane boundaries.

**Pressure:** arrange logical fields so hot operations remain word-local and cross-word transport is rare.

### Multiword add/subtract

Carry/borrow propagation is required only for representations that truly need integer-like arithmetic across lanes.

**Pressure:** do not implement generic wide arithmetic until a real block proves it necessary.

## 3. First/next set bit

Observed forms use low-bit extraction and `Math.clz32`.

Typical pattern:

```text
bit = word & -word
index = 31 - clz32(bit)
```

Used for:

- iterating legal cells
- frontier members
- packed sets

Candidate decompositions:

- specialized `clz32`
- shift/test loop
- table lookup

This block should be assembly-qualified rather than assumed.

## 4. Popcount

Recurring software popcount blocks use masks, shifts, adds, and sometimes `Math.imul`.

Used for:

- rank/cardinality
- move count
- requirement size
- packed set cardinality

Questions:

- is popcount hot enough to deserve a first-class block?
- does the chosen JS form lower better than alternatives?
- can cardinality be carried structurally instead of recomputed?
- can a representation make popcount unnecessary?

## 5. Coordinate decode

Historical pattern:

```text
column = cell % COLUMNS
row = floor(cell / COLUMNS)
```

This is a recurring **anti-candidate**.

It creates division/modulo/floor demand from representation choice.

Replacement directions:

- encode row/column separately
- use precomputed tables
- choose index geometry that makes extraction mask/shift/index based
- avoid decoding entirely by storing/propagating the needed relation

## 6. Legal / landing cell derivation

Recurring responsibilities:

- derive playable cells from support/height/occupancy
- reject full columns
- identify forced or singleton moves

Potential basis:

- indexed load
- mask/AND/OR
- shift
- zero test
- precomputed geometry

This is a strong target for representation-driven fusion.

## 7. Winning-line test

Observed strategies:

- line masks + subset/equality test
- bitboard directional shift/AND chains
- line-incidence traversal

Potential block shapes:

```text
(owned & lineMask) == lineMask
```

or directional packed-bit propagation.

The winning geometry is static; runtime work should be minimized by precomputation/layout.

## 8. Apply / undo state transition

Recurring block:

1. identify target cell
2. write ownership/occupancy
3. update support/playability
4. update side/ply
5. update residual/search-derived state
6. later restore previous state or reverse transition

This block is a major representation test.

**Preferred direction:** one compact state transition should make multiple semantic consequences fall out. Avoid separately maintained mirrors of the same physical fact.

## 9. Hash / mix32

Recurring structure:

```text
x ^= x >>> k
x = imul(x, constant)
x ^= x >>> m
...
```

Used for:

- TT/cache indexing
- residual-class lookup
- structural signatures

Candidates:

- keep as qualified block if its total value exceeds cost
- replace with direct addressing
- derive index from already-structured state
- tolerate more collisions if collision handling costs more than false misses

## 10. Power-of-two table indexing

Recurring pattern:

- size table to a power of two
- hash/index
- `index = hash & (capacity - 1)`

The hot operation is cheap; the capacity-normalization work is cold.

JSMinSys should separate hot lookup from cold sizing.

## 11. Transposition/cache probe

Typical block:

1. derive index
2. load tag/key
3. compare identity
4. on hit load value/metadata
5. on miss optionally replace

Potential extensions:

- second slot / associativity
- age/depth/bound metadata
- locking/reservation

**Default fault policy:** false miss/overwrite first. Add collision machinery only if measured total cost demands it.

## 12. Canonical reflection / symmetry

Recurring block:

- derive reflected representation
- compare orientations
- choose canonical orientation/key

Potential value: fewer search states.

Potential cost: extra transforms/comparisons on every affected node.

This is a total-cost block, not automatically a primitive.

## 13. Subset / implication / dominance

Very common in BSFP/IsoMax semantic structures.

For bitsets:

```text
A subset B  <=>  (A & ~B) == 0
```

or equivalent formulations.

Used for:

- residual requirement implication
- antichain dominance
- frontier coverage
- ownership/set containment

This is a major example of a high-level semantic relation collapsing into a tiny bit block.

## 14. Frontier / antichain normalization

Typical block:

1. compare candidate against existing entries
2. reject if dominated
3. remove entries dominated by candidate
4. insert candidate

Potential costs:

- repeated subset tests
- shifting/moving storage
- allocation if represented poorly

Representation/layout may be more important than the individual comparisons.

## 15. Residual transition

Recurring in IsoMax:

- current residual class
- action/cell
- indexed transition to next class

Ideal shape:

```text
next = transition[class, action]
```

This is a good example of pushing semantic computation into precomputed indexed structure.

## 16. Move/order selection

Recurring forms:

- rank candidates
- choose first/strongest
- forced-move short circuit
- use cached hint

Potential primitive basis:

- load
- compare/test
- branch
- small fixed scan

Avoid generalized sorting where fixed small selection suffices.

## 17. Alpha-beta / bound update

Typical pattern:

```text
value = -search(child, -beta, -alpha)
alpha = max(alpha, value)
if alpha >= beta: cutoff
```

This creates:

- negation/subtraction demand
- comparison
- conditional branch

For WDL-only representations, alternative encodings may remove arithmetic.

## 18. Shared atomic claim/release

IsoMax-specific recurring block:

1. load state
2. compare expected state
3. CAS/exchange
4. possibly retry
5. publish/notify/release

This is expensive relative to ordinary ALU work and creates coherence traffic.

**Default JSMinSys stance:** not a universal block. First test whether duplicate work, overwrite, stale data, or lossy ownership is cheaper.

## 19. Shared queue enqueue/dequeue

Typical block:

- head/tail state
- slot state
- CAS/reservation
- generation/currentness
- wake/wait

This is a strong candidate for architectural deletion rather than primitive optimization.

## 20. Capacity growth / rehash

Recurring cold-path block:

- choose larger power-of-two capacity
- allocate
- copy/rehash
- replace backing storage

This should not contaminate the hot computational basis. Prefer preallocation/sealed capacity where practical.

## Initial block priority for JSMinSys

The first blocks worth lowering against the candidate symbol set are:

1. bit test
2. set/clear bit
3. fixed-width wordwise AND/OR/XOR
4. zero/equality across words
5. first-set-bit
6. popcount
7. subset/implication
8. legal/landing-cell derivation
9. winning-line test
10. apply/undo transition
11. TT probe/replace
12. residual indexed transition
13. fixed small candidate selection

These cover a large fraction of the meaningful work while avoiding premature commitment to solver-specific machinery.

## 21. Fixed-lane relational set

Recurring packed relational carriers often use three, six, or eight uint32 lanes.
The admitted profiles keep these widths explicit instead of introducing arbitrary-width
objects or wide-integer semantics. Operations cover exact equality, subset/dominance,
and lane-local Boolean joins/intersections.

## 22. Multiword antichain skyline

Six-word fixed records may be maintained as a subset-minimal antichain. The block
rejects dominated candidates, removes retained generators dominated by a new
candidate, and admits only within caller-owned fixed capacity. A streamed pairwise
OR product performs immediate skyline absorption without materializing a Cartesian
product.

## 23. Wide exact-key transposition operations

Eight-word identities use a locator only to choose a probe start. Exact equality
still compares every identity word. Publication writes the complete key before
publishing the dense id slot; synchronization and lifetime remain caller-owned.

## 24. Exact interval evidence

Durable semantic [lower, upper] evidence is distinct from alpha/beta search
windows. Tightening is monotone intersection; incompatible evidence reports a
conflict. Fixed-degree up-to-seven min/max reductions provide Bellman-style
aggregation without allocating candidate objects.

## 25. Sparse basis transform / remap

Prepared action-major maps can transform sparse ordered IDs through caller-owned
bitset scratch, deduplicate them, and emit canonical ascending IDs. Three-word
packed coordinates may be remapped through a prepared local-index permutation.
The block carries no board/game semantics.

## 26. Intrusive generation-stamped work list

A caller-serialized intrusive list may coalesce duplicate membership, remove an
arbitrary member in O(1), pop from the head, and stamp the item generation at
publication. The block intentionally performs no hidden Atomics; applications
must supply the synchronization regime when shared execution requires one.

## 27. Fixed seven-slot mask

Seven-slot candidate sets use one scalar mask for membership, add/remove, and
least-set-slot selection. This avoids manufacturing parallel membership arrays
for small fixed-degree decisions.

## 28. Immutable span publication

A caller-owned scalar copy publishes a fixed derived span without allocation or
bulk-copy machinery. Publication ordering, lifetime, and aliasing preconditions
remain explicit at the governing application unit.
