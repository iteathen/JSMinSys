# Admissible data types and storage — v0

This file tracks data representations that JSMinSys is allowed to use.

**Admissible does not mean preferred in every location.** Data types and storage forms still have to justify their cache footprint, conversion behavior, and V8 lowering.

## Confirmed scalar domain

### `uint32`

Status: **admissible**

JSMinSys treats an unsigned 32-bit word as the default hot numerical lane.

Intended uses:

- packed state
- masks
- indices where the domain fits
- counters where the domain fits
- hash fragments
- table entries
- flags/bitfields
- components of wider logical values

Working rule:

> If more than 32 logical bits are required, compose additional 32-bit words before considering a wider numeric system.

Examples:

- 32 bits: 1 × uint32
- 64 logical bits: 2 × uint32
- 96 logical bits: 3 × uint32
- 128 logical bits: 4 × uint32

Cross-word carry, borrow, and shifts are implemented only where the representation actually requires them.

## Typed arrays

Status: **admissible storage family**

Typed arrays are allowed as fixed-width, contiguous storage.

### Confirmed first-class typed-array form

- `Uint32Array`

This is the default typed storage for 32-bit words unless a narrower representation is proven better for a particular structure.

### Construction

`new Uint32Array(length)` is admitted as the normalized operation `Uint32Array.construct`.

Construction is not presumed cheap. Its NEES cycle count is parameterized by requested length, V8 allocation path, page state, and GC/runtime state.

### Other typed-array element widths

These are members of the admissible storage family but require use-specific qualification before becoming preferred forms:

- `Int8Array`
- `Uint8Array`
- `Uint8ClampedArray`
- `Int16Array`
- `Uint16Array`
- `Int32Array`
- `Float32Array`
- `Float64Array`

Their use should be driven by:

- actual required range/precision
- cache density
- load/store behavior
- sign semantics
- V8 lowering
- whether widening/conversion introduces more cost than the storage saves

## Excluded typed-array forms

Because the current hot-substrate rule excludes BigInt, the following are **not admissible** in the hot substrate:

- `BigInt64Array`
- `BigUint64Array`

They may be reconsidered only if direct evidence overturns the current fixed-multiword approach.

## Backing memory

Admissible:

- `ArrayBuffer`
- `SharedArrayBuffer` when shared-memory execution itself has been justified

`SharedArrayBuffer` admission does not imply that atomics, shared mutation, or multiworker protocols are preferred. Shared-memory coherence cost must be counted separately.

## Representation rules

1. Prefer the narrowest representation that satisfies the real domain without creating conversion or reconstruction overhead.
2. Keep hot structures contiguous.
3. Prefer fixed capacity / preallocation in hot systems.
4. Separate hot fields from cold fields when doing so reduces cache-line traffic.
5. Do not widen a value merely for convenience.
6. Do not create a general wide-number abstraction when a fixed number of 32-bit lanes suffices.
7. Representation is revisable: if the current layout makes common operations expensive, redesign the layout before adding machinery.
