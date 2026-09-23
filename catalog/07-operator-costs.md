# Operator cycle-cost catalog — v0

> **NEES authority notice:** This file is a historical/research snapshot from the JSMinSys bootstrap. NEES Draft 0.5+ is the authoritative source for cost profiles, cycle accounting, evidence semantics, and function-ledger interpretation. If this file conflicts with NEES, NEES wins. JSMinSys retains only admission/restriction policy.


This catalog tracks physical cost for admissible JSMinSys operations.

## Cycle-model completeness invariant

Every admissible emission must have a cycle mapping in `cycle-model-v0.json`. Admission without a cost model is invalid.

Current coverage:

- admissible emissions: **62**
- cycle-mapped emissions: **62**
- missing mappings: **0**

The map uses fixed, ranged, symbolic-expression, or unbounded models so no operation is silently treated as zero-cost merely because its exact runtime path is variable.

See `08-function-cycle-accounting.md` for aggregation rules.

## Important: what “cycles” means

There is no architecture-independent single cycle count for a JavaScript operator.

Each operation therefore carries two distinct cost layers:

1. **JS/V8 lowering** — the optimized native instruction sequence produced for the qualified operand shape.
2. **Native instruction cost** — latency, reciprocal throughput, μops, and memory effects on a named CPU profile.

The first reference profile is **AMD Zen 3 / x86-64**, because the Connect4 evidence corpus has run on AMD EPYC 7003-class hardware. AMD documents EPYC 7003 as Zen 3. This is a reference profile, not a claim that JSMinSys targets only Zen 3.

Primary native-cost source: uops.info, March 2026 dataset.

Definitions:

- **latency**: dependent-result delay in cycles.
- **reciprocal throughput**: steady-state cycles per independent instruction.
- **μops**: executed micro-operations where available.

A value is not treated as an actual JavaScript operator cost until its optimized V8 assembly is inspected.

## Current reference table

| JS operation | Candidate native shape | Zen 3 latency | Zen 3 reciprocal throughput | μops | Qualification |
|---|---|---:|---:|---:|---|
| `+` | `ADD r32,r32` | 1 | 0.25 | 1 | native cost verified; JS lowering must be checked per shape |
| `++` | `INC r32` candidate | 1 | 0.25 | 1 | native cost verified; exact JS lowering pending |
| `--` | `DEC/SUB r32,1` candidate | ~1 | ~0.25 | ~1 | expected simple ALU; exact native/JS qualification pending |
| `-` | simple `SUB r32,*` | 1 | 0.25 | 1 | representative SUB form verified; exact JS form pending |
| `*` | `IMUL r32,r32` when integer-specialized | 3 | 1.00 | 1 | native cost verified; ordinary `*` lowering pending |
| `/` | possible integer `IDIV r32` path | 9–14 dependency-dependent | 6.00 | 2 | native reference only; JS guards/semantics may add work |
| `%` | possible remainder result of integer divide | 9–14 dependency-dependent | 6.00 | 2 | native reference only; may share divide machinery |
| `**` | no assumed single instruction | variable | variable | variable | unqualified |
| `&` | integer AND | expected simple ALU | expected simple ALU | expected 1 | exact native/JS qualification pending |
| `|` | integer OR | expected simple ALU | expected simple ALU | expected 1 | exact native/JS qualification pending |
| `^` | integer XOR | expected simple ALU | expected simple ALU | expected 1 | exact native/JS qualification pending |
| `~` | integer NOT/XOR-mask equivalent | pending | pending | pending | pending |
| `<<` | fixed-count SHL | 1 | 0.50 | 1 | representative shift cost verified |
| `>>` | fixed-count SAR/SHR depending lowering | ~1 | ~0.50 | ~1 | exact signed lowering pending |
| `>>>` | fixed-count SHR | 1 | 0.50 | 1 | representative shift cost verified |
| `===` / `!==` | CMP/TEST plus materialize or branch | 1 for native compare/test stage | 0.25 for representative CMP | 1 for compare/test stage | whole JS expression remains context-dependent |
| `< <= > >=` | CMP plus materialize or branch | 1 for native compare stage | 0.25 for representative CMP | 1 for compare stage | whole JS expression remains context-dependent |
| `!` | TEST/CMP/select | context-dependent | context-dependent | context-dependent | must inspect use-site lowering |
| `&&` / `||` | short-circuit control flow | data/context-dependent | data/context-dependent | variable | block-level cost |
| `?:` | branch or conditional-select shape | data/context-dependent | data/context-dependent | variable | block-level cost |
| `Math.imul` | `IMUL r32,r32` target shape | 3 | 1.00 | 1 | native cost verified; JS lowering qualification still required |
| `Math.clz32` | LZCNT/BSR-family target | pending | pending | pending | native + V8 qualification pending |

## One-cycle admission rule

A source-level operation is automatically admissible when its qualified hot-path lowering is a single 1-cycle native operation on a supported reference profile and no hidden JS/V8 machinery materially increases that cost. The catalog still distinguishes native latency from complete JS-expression cost.

Current one-cycle native reference shapes include ADD, representative SUB, INC, fixed-count shifts, CMP, and register MOV/copy. Bitwise AND/OR/XOR/NOT are expected to join this class once their exact emitted 32-bit forms are captured for the target Node/V8 build.

## Verified native references

### MOV / value copy, register-register, 32-bit

uops.info AMD Zen 3 reports register MOV with measured dependency latency 0 via move elimination, 0.17–0.25 cycle throughput, and 1 executed µop when not eliminated.

Source: https://uops.info/html-instr/MOV_89_R32_R32.html

### ADD, register-register, 32-bit

uops.info AMD Zen 3:

- latency: 1 cycle
- measured throughput: 0.25 cycles/instruction
- executed μops: 1

Source: https://uops.info/html-instr/ADD_01_R32_R32.html

### INC, 32-bit

uops.info AMD Zen 3:

- latency: 1 cycle
- measured throughput: 0.25 cycles/instruction
- executed µops: 1

Source: https://uops.info/html-instr/INC_R32.html

### CMP, representative 32-bit compare

uops.info AMD Zen 3 reports a 1-cycle register-to-flags latency, 0.25-cycle measured loop throughput, and 1 executed µop for `CMP r32, imm32`.

Source: https://uops.info/html-instr/CMP_R32_I32.html

This is the native compare stage only; materializing a Boolean or branching can add work depending on the emitted sequence.

### SUB, representative 32-bit simple form

uops.info AMD Zen 3 reports for `SUB r32, imm8`:

- latency: 1 cycle
- measured throughput: 0.25 cycles/instruction
- executed μops: 1

Source: https://uops.info/html-instr/SUB_R32_I8.html

Exact register-register and actual V8 lowering should still be captured during qualification.

### IMUL, register-register, 32-bit

uops.info AMD Zen 3:

- latency: 3 cycles
- measured throughput: 1.00 cycle/instruction
- executed μops: 1

Source: https://uops.info/html-instr/IMUL_R32_R32.html

### Integer division reference

For `IDIV r32`, uops.info AMD Zen 3 reports operand-dependent latencies roughly 9–14 cycles and measured reciprocal throughput of 6 cycles, with 2 executed μops.

Source: https://uops.info/html-instr/IDIV_R32.html

This is **not yet the cost of JavaScript `/` or `%`**. V8 may emit guards, special-case checks, floating operations, or another path depending on the proven operand representation and required JS semantics.

### Fixed-count shifts

Representative Zen 3 `SHL/SHR r64, imm8` measurements are:

- latency: 1 cycle
- throughput: 0.50 cycles/instruction
- μops: 1

Sources:

- https://uops.info/html-instr/SHL_R64_I8.html
- https://uops.info/html-instr/SHR_R64_I8.html

We still need exact 32-bit V8-emitted forms for authoritative JSMinSys entries.


## Newly admitted observed-gap operations

The cycle figures below use the Zen 3 reference profile. For source forms that are not a single native instruction, the entry is a decomposition or lower-bound/reference shape rather than a claim of fixed JavaScript latency.

| Source operation | Reference shape / decomposition | Zen 3 cycle characterization | Notes |
|---|---|---|---|
| `=` | register move / memory store | **0 effective dependency cycles** if move-eliminated; memory store throughput about **0.5 cycles** for a simple 32-bit store | actual typed-array store depends on address/bounds/JIT path |
| `+=` | ADD + write-back | **1-cycle ALU core**; memory-resident update adds load/store dependency, with measured Zen 3 memory-RMW latency around **7 cycles** for representative `ADD m32,r32` | register-local form may remain one ADD |
| `-=` | SUB + write-back | **1-cycle ALU core** + memory cost if resident in memory | exact memory form pending |
| `*=` | IMUL + write-back | **3-cycle multiply core** + memory cost | exact JS lowering pending |
| `&=` | AND + write-back | expected **1-cycle ALU core** + memory cost | exact Zen 3/V8 form pending |
| `|=` | OR + write-back | expected **1-cycle ALU core** + memory cost | exact Zen 3/V8 form pending |
| `^=` | XOR + write-back | expected **1-cycle ALU core** + memory cost | exact Zen 3/V8 form pending |
| `<<=` | SHL + write-back | **1-cycle shift core** + memory cost | exact JS form pending |
| `??` | nullish test + branch/select | **1-cycle-class test** plus control; total variable | branch prediction and value representation dominate |
| `?.` | nullish test + guarded access | **1-cycle-class test** plus access/control; total variable | property/index access dominates |
| `instanceof` | type/prototype tests | **variable, multi-operation** | not representable by one stable instruction cost |
| `typeof` | tag/type discrimination | **variable; lower bound ~1 cycle for a simple tag test** | actual path depends on value representation |
| `void` | result discard | **0 additional cycles** when the discarded result needs no materialization | operand evaluation still costs whatever it costs |
| `Math.floor` | V8 `NumberFloor` / Float64 round-down | **0 additional on an already integral/Smi fast path; floating path variable** | V8 explicitly has Smi and Float64 paths |
| `Math.trunc` | V8 `NumberTrunc` / Float64 round-to-zero | **0 additional on an already integral/Smi fast path; floating path variable** | Float64 path uses a hardware rounding/conversion shape when supported |
| `Math.ceil` | V8 `Float64Ceil` | **0 additional on Smi fast path; floating path variable** | same qualification rule |
| `Math.round` | V8 `Float64Round` | **0 additional on Smi fast path; floating path variable** | exact emitted x64 sequence must be captured |
| `Math.min` | scalar min / compare-select | native scalar double min can be **1 cycle** on Zen 3 | JS NaN/signed-zero semantics may add guards |
| `Math.max` | scalar max / compare-select | native scalar double max is **1 cycle** on Zen 3 | JS NaN/signed-zero semantics may add guards |
| `Atomics.load` | sequentially consistent atomic load | **cache/coherence dependent; not assigned a single cycle** | lower bound is a memory load; shared-line state dominates |
| `Atomics.store` | sequentially consistent atomic store | **cache/coherence dependent; not assigned a single cycle** | ownership/coherence dominates |
| `Atomics.compareExchange` | locked CMPXCHG-style RMW | representative Zen 3 locked RMW throughput about **7.7–7.8 cycles**, with operand latencies up to roughly **12 cycles** | contention/cache-line migration can be much worse |
| `Atomics.exchange` | locked XCHG-style RMW | representative Zen 3 throughput about **7.5 cycles**, with address/data dependencies up to roughly **10 cycles** | contention can dominate |
| `Atomics.add` | locked XADD-style RMW | representative Zen 3 throughput about **7.7–7.8 cycles**, memory dependency around **8 cycles** | coherence/contended cost can be far larger |
| `Atomics.sub` | locked arithmetic RMW equivalent | use **~8-cycle uncontended locked-RMW class** as provisional reference | exact V8 instruction form pending |
| `Atomics.wait` | wait/futex-like blocking path | **unbounded / scheduler-scale** | not meaningfully expressible as a fixed CPU-cycle primitive |
| `Atomics.notify` | wake/notification path | **variable; scheduler/cache dependent** | may enter runtime/OS machinery |

### Evidence notes for the newly admitted gap set

- V8's current Math builtins explicitly split `ceil`, `floor`, `round`, and `trunc` into Smi and Float64 paths.
- Zen 3 scalar `VMAXSD` measures 1-cycle latency and 0.5-cycle reciprocal throughput.
- Zen 3 locked `XADD` measures roughly 7.65–7.82 cycles reciprocal throughput.
- Zen 3 locked `CMPXCHG` is in the same roughly 7.7–7.8-cycle throughput class.
- Zen 3 memory `XCHG m32,r32` measures about 7.5 cycles reciprocal throughput.
- A representative Zen 3 memory read-modify-write `ADD m32,r32` has a 7-cycle memory dependency.
- A simple 32-bit immediate memory store measures 0.5-cycle reciprocal throughput on Zen 3.

These are native reference costs, not guarantees for every JavaScript use site.

## Cost-record schema

Every admitted operation should eventually carry:

```text
operation
source_form
operand_domain
V8/Node version
architecture
emitted_assembly
native_instruction_ids
latency_cycles
reciprocal_throughput_cycles
executed_uops
loads
stores
branch_shape
cache/coherence_notes
deoptimization/guard_notes
qualification_status
evidence
```

## Rules

1. Never convert native instruction latency directly into “JavaScript operator latency” without inspecting V8 output.
2. Keep latency and throughput separate.
3. Count surviving guards, conversions, loads/stores, and branches.
4. Memory costs are recorded separately from ALU cost.
5. A representation that deletes an operation beats a cheaper implementation of that operation.
6. Costs are profile-specific. Add CPU profiles rather than overwriting old results.
7. If V8 changes the lowering, requalify the affected operation.

## Next qualification order

Prioritize the operations most likely to form the minimal hot basis:

1. `+`
2. `&`
3. `|`
4. `^`
5. `<<`
6. `>>>`
7. zero/equality test feeding a branch
8. ordered compare feeding a branch
9. `Math.clz32`
10. `Math.imul`
11. `-`
12. `*`
13. `/`
14. `%`
15. `**`

The order reflects likely hot-path value, not admissibility.
