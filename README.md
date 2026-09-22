# JSMinSys

JSMinSys is an experimental project for deriving a minimal-cost computational substrate for high-performance JavaScript.

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

Research bootstrap. No primitive vocabulary is authoritative yet. See `catalog/` for the first Connect4-derived inventory.
