# JSMinSys

JSMinSys is an experimental project for deriving a minimal-cost computational substrate for high-performance JavaScript.

The current normative draft is [SPEC.md](SPEC.md). JSMinSys is a strict NEES-EXTREME execution profile: NEES supplies the governing optimization, evidence, qualification, and cost-accounting standard; JSMinSys adds narrower admissible data, operations, blocks, and mechanical sealing.

The project works upward from the cheapest qualified operations rather than downward from conventional software abstractions. The initial workload corpus is the Connect4 solver family; Connect4 is a proving workload, not part of the JSMinSys API.

## Method

1. Catalog the primitive operations actually demanded by real implementations.
2. Catalog recurring higher-level abstractions built from those primitives.
3. Catalog recurring whole-block solutions.
4. Map all three layers onto a minimal computational basis.
5. Challenge every operation: remove it, derive it, or justify it by total physical cost.
6. Qualify admitted JavaScript forms against optimized V8 assembly and CPU cost data.
7. Prefer representation changes, structural reuse, doing nothing, and lazy handling over added machinery.

## Optimization order

1. Design or redesign the representation for leverage.
2. Do nothing.
3. Do the laziest thing that works.
4. Exploit existing structure.
5. Redesign the representation when the structure is not doing enough work.
6. Add machinery only under extreme pressure.

## Numerical direction

The working hypothesis is a 32-bit word domain for hot computation. Wider logical values are composed from additional 32-bit words rather than BigInt unless measurement produces contrary evidence.

## Status

Draft 0.2 implementation bootstrap. The current function catalog implements every research block expressible with the admitted vocabulary; missing-primitive cases are isolated in `catalog/deferred-primitives.md`. See `SPEC.md` for normative intent and `catalog/` for the Connect4-derived research inventory.


## Admission principle

Slow operations are allowed when their cost can be accounted for faithfully. JSMinSys makes cost visible; it does not forbid an operation merely because it is expensive. Application authors decide whether a function's cost is justified.

## Implementation status

The current catalog implementation is exported from `src/index.mjs`.

- 55 catalog functions implemented
- 20 of 20 research blocks implemented
- typed capacity allocation admitted and costed through NEES
- coordinate decode is implemented only as a comparison/reference anti-candidate
- `Number.isInteger` was reviewed and rejected as unnecessary inside the sealed scope

Run:

```sh
node tools/verify-catalog.mjs
node --test test/*.test.mjs
```

to verify catalog/admission consistency and behavior.
