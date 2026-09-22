# Admissible operations — v0

This is the current explicit allow-list for JSMinSys computation.

**Admissible does not mean preferred, required, or equally cheap.** An admissible operation may still be avoided when representation, structural reuse, precomputation, or a cheaper operation eliminates it.

## Arithmetic operators

The ordinary JavaScript arithmetic operators are admissible:

- `+` — addition
- `-` — subtraction / unary negation
- `*` — multiplication
- `/` — division
- `%` — remainder / modulus
- `**` — exponentiation

Increment/decrement syntax (`++`, `--`) is explicitly admissible as well. On the Zen 3 reference profile, native `INC r32` is a 1-cycle, 1-µop ALU operation; `++`/`--` remain semantically reducible to ordinary arithmetic, but their emitted forms may be independently qualified.

## One-cycle auto-admission rule

Any source-level operation whose qualified hot-path lowering is a **single 1-cycle native operation** on a supported reference profile is admissible by default, provided it does not introduce hidden allocation, conversion, memory, synchronization, exception, or deoptimization machinery that makes the source operation materially more expensive than that native shape.

This rule concerns **latency**, not operator popularity. We still record reciprocal throughput and µops separately.

Current operations already inside the allow-list that fit or are expected to fit this class after exact V8 qualification include:

- addition and subtraction
- increment/decrement
- 32-bit bitwise AND/OR/XOR/NOT
- fixed-count 32-bit shifts
- compare/test operations that feed control directly
- simple register/value copy where V8 lowers it to a move or eliminates the move

The native machine being capable of a 1-cycle instruction is not sufficient by itself: JSMinSys records the operation as fully qualified only after the V8-emitted path is inspected.

## Bitwise operators

The current bitwise family is admissible:

- `&` — AND
- `|` — OR
- `^` — XOR
- `~` — NOT
- `<<` — left shift
- `>>` — signed right shift
- `>>>` — unsigned right shift

These are especially important because JS bitwise operations force 32-bit integer semantics and often lower to very small integer-machine operations.

## Comparison operators

The current comparison family is admissible:

- `===`
- `!==`
- `<`
- `<=`
- `>`
- `>=`

A comparison that exists only to feed control may later be costed as a fused compare/test/branch shape rather than as a separately materialized Boolean.

## Logical / selection operators

Currently admissible:

- `!`
- `&&`
- `||`
- conditional selection `?:`

These are admitted as source-level control/value-selection operations. Their actual V8 lowering and branch behavior remain qualification concerns.

## Memory and control capabilities

The minimal machine model also admits equivalent capabilities for:

- constants
- fixed-width indexed load
- fixed-width indexed store
- fixed/indexed address calculation
- zero/nonzero test
- conditional branch
- unconditional jump / repetition

The final library API need not expose these as functions; they are part of the computational vocabulary and cost model.

## Qualified specialized built-ins

Already identified as potentially useful and admissible subject to assembly qualification:

- `Math.imul` — explicit 32-bit multiplication
- `Math.clz32` — 32-bit leading-zero count

Other `Math.*` helpers observed historically (`floor`, `trunc`, `ceil`, `round`, `min`, `max`) remain cataloged demands rather than part of this explicit allow-list until separately admitted.

## Storage direction

- 32-bit words are the default hot numerical lane.
- Wider logical values are composed from additional 32-bit words.
- BigInt is not admissible in the hot substrate absent explicit contrary evidence.
- Typed arrays / fixed typed storage remain the preferred persistent representation.

## Admission versus optimization

The allow-list is intentionally broader than the minimal basis.

For example, `/` and `%` are now legal operations, but a representation that removes them may still be better. Likewise, `*` may be admissible while a shift or precomputed relation is cheaper for a specific block.

The operating rule is:

> Allow the small set of ordinary, directly optimized operators we know we may need; then minimize total physical cost of the actual program rather than artificially minimizing the number of operator names.

New operation families remain disallowed until explicitly admitted.
