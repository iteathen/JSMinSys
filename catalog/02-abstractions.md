# Higher-level abstraction catalog — Connect4 corpus v0

This catalog groups recurring concepts above individual operators. It records what previous engines chose to represent, not what JSMinSys must preserve.

## A. Representation and geometry

### Board / position state

Recurring responsibilities:

- ownership/occupancy state
- side to move
- move count / ply
- column heights or support state
- legal/playable locations
- terminal status
- reversible history for apply/undo

Observed forms include conventional position objects, packed bitboards, support codes, residual classes, and fixed typed arrays.

**JSMinSys question:** how much of this can be made one representation whose relationships are projections rather than separately maintained facts?

### Winning geometry

Recurring responsibilities:

- winning-line masks
- cell-to-line incidence
- immediate-win tests
- line completion / blockage
- support/landing geometry

This is highly static and is a strong candidate for precomputation or direct structural encoding.

### Coordinate mapping

Recurring operations:

- cell ↔ row/column
- column ↔ playable/landing cell
- reflection / mirrored cell or support code

Historical implementations use division, modulo, floor, tables, and bit transforms.

**Pressure:** redesign representation so row/column decoding is unnecessary or becomes indexing/shift/mask.

## B. Bitset and fixed-width value abstractions

Recurring patterns:

- test/set/clear bit
- subset / implication
- wordwise AND/OR/XOR
- first/next set bit
- popcount
- pack/unpack logical values wider than 32 bits
- low/high word extraction
- all-zero/equality tests

BSFP's packed 42-bit work and exact-solver bitboards are especially useful workload evidence.

**JSMinSys direction:** 32-bit word as the base numerical lane; wider values are compositions of lanes, with cross-word work admitted only where necessary.

## C. Game-state transition abstractions

Recurring responsibilities:

- determine legal moves
- apply a move
- undo a move or restore prior scalar state
- derive resulting playable/support masks
- update terminal/win state
- update residual/proof state

Implementations vary between recomputation, incremental state, transition tables, and reversible history.

**Pressure:** one physical state change should imply as many semantic consequences as possible.

## D. Search abstractions

### Recursive exact search

Observed forms include:

- minimax / negamax
- alpha-beta bounds
- WDL value search
- bounded proof search
- root-action extraction

Primitive needs underneath these are mostly:

- state transition
- conditional control
- comparison
- recursion/iteration
- load/store

### Move ordering / candidate ordering

Recurring inputs:

- center preference
- tactical/immediate wins
- transposition-table hints
- residual/frontier consequences
- forced move information

**Pressure:** ordering should ideally fall out of representation or precomputed rank rather than maintain a rich scoring mechanism per node.

### Bounds and score normalization

Recurring responsibilities:

- alpha/beta bound updates
- score conversion
- terminal score transformation
- WDL encoding

Several historical arithmetic operations occur only because of a chosen score representation.

## E. Memoization / identity abstractions

### Transposition table

Recurring responsibilities:

- key derivation
- index/bucket selection
- tag/identity check
- probe
- store/replace
- optional depth/bound metadata

Observed designs include local tables and shared-worker tables.

**JSMinSys pressure:**

1. false miss may be preferable to collision machinery;
2. overwrite may be preferable to conflict resolution;
3. metadata must justify cache-line cost;
4. exactness belongs in authoritative semantics, not every optimization structure.

### Hash / mix

Recurring blocks use:

- XOR-shift
- `Math.imul`
- word folding
- power-of-two masking

This is a candidate for replacement by direct addressing or structurally stronger keys where possible.

### Canonicalization / symmetry

Recurring responsibilities:

- reflection
- canonical orientation
- structural bucket/key normalization

This can save search work but costs operations. It must be evaluated as a total-cost trade.

## F. Residual / lattice / frontier abstractions

Prominent in IsoMax and BSFP:

- residual requirement sets
- implication/subset relationships
- support lattice
- win-space requirements
- dominance
- minimal/maximal antichains
- WDL frontier buckets
- residual transition classes
- proof/certificate consequences

These are semantically rich abstractions. For JSMinSys they are valuable because many can be reduced to bitset relations such as:

- subset
- intersection
- union
- difference
- zero/nonzero
- indexed transition

The goal is not to import the abstraction names into JSMinSys; it is to identify the repeated low-cost blocks beneath them.

## G. Concurrency / shared-work abstractions

Observed primarily in IsoMax:

- worker identity
- shared transposition table
- work queue
- claim/release
- parent edge
- branch management
- availability/exposure ledger
- generation/version
- recovery/reclamation
- wake/wait

These currently induce atomics, CAS loops, shared writes, and coherence traffic.

**JSMinSys rule:** concurrency abstractions are not fundamental computation. They are admitted only if the chosen execution architecture proves them necessary. Performance-only races, duplicate work, stale hints, and collisions should default to tolerance rather than repair.

## H. Proof / certificate / diagnostics abstractions

Observed:

- exact result certificate
- proof payload
- metrics/profile counters
- diagnostic identities
- qualification assertions

These should normally be outside the hottest kernel unless they are production-semantic.

## Recurrence ranking

### Appears across essentially every solver family

- board/state representation
- winning geometry
- legal move / state transition
- terminal/result test
- search or backward solution traversal
- comparison/test/control
- indexed storage
- bitset/set relations
- result encoding

### Appears across multiple families

- packed fixed-width words
- transposition/cache identity
- hashing/indexing
- move ordering
- symmetry/canonicalization
- frontier/dominance concepts
- precomputed geometry

### Strategy-specific

- alpha-beta score machinery
- residual-class transition pools
- antichain normalization
- shared-worker queueing/claims
- certificates
- elaborate recovery/accounting

Strategy-specific abstractions should be treated as evidence, never as default JSMinSys vocabulary.
