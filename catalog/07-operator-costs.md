# Operator cycle-cost catalog — v0

This catalog tracks physical cost for admissible JSMinSys operations.

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
| `===` / `!==` | CMP/TEST plus materialize or branch | context-dependent | context-dependent | context-dependent | must inspect use-site lowering |
| `< <= > >=` | CMP plus materialize or branch | context-dependent | context-dependent | context-dependent | must inspect use-site lowering |
| `!` | TEST/CMP/select | context-dependent | context-dependent | context-dependent | must inspect use-site lowering |
| `&&` / `||` | short-circuit control flow | data/context-dependent | data/context-dependent | variable | block-level cost |
| `?:` | branch or conditional-select shape | data/context-dependent | data/context-dependent | variable | block-level cost |
| `Math.imul` | `IMUL r32,r32` target shape | 3 | 1.00 | 1 | native cost verified; JS lowering qualification still required |
| `Math.clz32` | LZCNT/BSR-family target | pending | pending | pending | native + V8 qualification pending |

## Verified native references

### ADD, register-register, 32-bit

uops.info AMD Zen 3:

- latency: 1 cycle
- measured throughput: 0.25 cycles/instruction
- executed μops: 1

Source: https://uops.info/html-instr/ADD_01_R32_R32.html

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
