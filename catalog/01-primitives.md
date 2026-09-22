# Primitive operation catalog — Connect4 corpus v0

This is an empirical inventory, not the JSMinSys instruction set.

## Corpus

Pinned source snapshots used for the first pass:

- incumbent minimax / exact oracle: `3c7524321d49c11c3cb6c519425e3bd0ed4bb42b`
- IsoMax: `a26ef2254c850243f68505eeff1d849ad0f4f0c0`
- BSFP: `abdf7b0993f07bd6087669848c2dda91dff65608`

Survey scope: executable solver/state/search/storage files, excluding benchmarks, tests, reports, and most qualification scaffolding.

Counts below are approximate lexical counts after stripping comments and string literals. They are useful for demand-shape, not as a replacement for an AST-level census.

## Scalar operators observed

| Operation | Incumbent | IsoMax | BSFP | Total | Initial interpretation |
|---|---:|---:|---:|---:|---|
| `+` | 151 | 221 | 27 | 399 | strong candidate; near hardware floor |
| `-` | 96 | 171 | 32 | 299 | common; challenge whether all uses need first-class subtraction |
| `*` | 28 | 92 | 22 | 142 | mixed hot/cold; challenge before admission |
| `/` | 9 | 6 | 7 | 22 | sparse; often coordinate/sizing work; strong removal candidate |
| `%` | 0 | 4 | 3 | 7 | sparse; often coordinate decoding; strong removal candidate |
| `**` | 0 | 16 | 2 | 18 | mostly capacities/constants; not a hot-basis requirement |
| `++` | 77 | 69 | 0 | 146 | syntactic increment; reducible to add |
| `--` | 3 | 8 | 0 | 11 | syntactic decrement; reducible to subtract/add |

## Bitwise operators observed

| Operation | Incumbent | IsoMax | BSFP | Total | Initial interpretation |
|---|---:|---:|---:|---:|---|
| `&` | 72 | 187 | 37 | 296 | strong primitive candidate: projection/masking |
| `|` | 39 | 127 | 43 | 209 | strong candidate: union/packing |
| `^` | 12 | 12 | 0 | 24 | lower frequency but high leverage |
| `~` | 1 | 12 | 11 | 24 | possibly derivable from XOR with all-ones |
| `<<` | 36 | 23 | 11 | 70 | strong candidate: bit-position transport |
| `>>` | 22 | 93 | 31 | 146 | signed transport/extraction |
| `>>>` | 9 | 93 | 31 | 133 | unsigned transport/coercion |

## Comparison and control-valued operators observed

| Operation | Incumbent | IsoMax | BSFP | Total |
|---|---:|---:|---:|---:|
| `===` | 87 | 160 | 40 | 287 |
| `!==` | 28 | 170 | 30 | 228 |
| `<` | 85 | 163 | 61 | 309 |
| `<=` | 5 | 19 | 8 | 32 |
| `>` | 45 | 155 | 67 | 267 |
| `>=` | 29 | 68 | 12 | 109 |
| `&&` | 32 | 107 | 9 | 148 |
| `||` | 27 | 98 | 36 | 161 |
| logical `!` | 11 | 92 | 37 | 140 |
| ternary `?:` | 26 | 85 | 23 | 134 |

These are not automatically separate machine primitives. Comparison can often feed control directly; Boolean composition may be folded by the compiler; some predicates may disappear under a better representation.

## Built-ins observed in solver code

### Math

Observed union:

- `Math.imul`
- `Math.clz32`
- `Math.floor`
- `Math.trunc`
- `Math.ceil`
- `Math.round`
- `Math.min`
- `Math.max`

Interpretation:

- `imul` and `clz32` are serious primitive candidates because they can expose specialized integer hardware.
- `floor`, `trunc`, `ceil`, `round`, `min`, and `max` are historical demands, not yet admitted primitives.
- several `floor`/division/modulo uses are coordinate-decoding artifacts and should be challenged at the representation layer.

### Typed storage

Observed in the surveyed corpus:

- `Int8Array`
- `Int16Array`
- `Int32Array`
- `Float64Array`
- `SharedArrayBuffer`

Additional implementations in the wider research corpus also used other typed layouts and BigInt-based experiments. BigInt is historical evidence only; it is not a current JSMinSys target.

### Atomics

IsoMax's shared-worker implementation uses:

- `Atomics.load`
- `Atomics.store`
- `Atomics.compareExchange`
- `Atomics.exchange`
- `Atomics.add`
- `Atomics.sub`
- `Atomics.wait`
- `Atomics.notify`

These belong to one concurrency strategy and must not be promoted into the universal core merely because they exist.

## Memory / addressing primitives demanded by the workload

Independent of JavaScript syntax, the implementations require some form of:

- constant materialization
- indexed load
- indexed store
- fixed offset calculation
- sequential/adjacent-word access
- branch target / loop state
- function or block entry/return
- comparison/test feeding conditional control

For a minimal machine these are more fundamental than many arithmetic operators.

## Provisional classification

### Universal/core capability class

Not yet a final symbol set, but the workload requires equivalents of:

- state/memory
- read
- write
- conditional decision / branch
- repetition or recursion

A Turing-complete machine needs state and conditional control in addition to value transformation. JSMinSys should keep this distinct from convenience arithmetic.

### Hardware-floor candidates

Operations whose native forms are cheap enough that synthesizing them from a smaller logical basis may be false minimalism:

- add
- AND
- OR
- XOR
- fixed shifts
- equality/zero test
- ordered comparison where genuinely required
- specialized `clz32` / `imul` if assembly qualification confirms advantage

### Challenge-before-admission

- subtraction as a separate primitive
- multiplication
- division
- modulo
- exponentiation
- floor/ceil/trunc/round
- min/max
- general Boolean combinators
- atomics
- allocation/growth

The question is never “did an old implementation use this?” It is “does admitting this operation reduce the minimum total physical cost of the target workload?”

## Next pass

Replace this lexical inventory with an AST census and annotate every occurrence by:

- hot / warm / cold
- representational necessity vs convenience
- expected V8 lowering
- native instruction class
- latency / reciprocal throughput / µops
- memory traffic
- whether a representation change can delete the operation
