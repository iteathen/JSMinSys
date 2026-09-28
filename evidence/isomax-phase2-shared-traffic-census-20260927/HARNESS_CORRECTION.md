# Census harness correction

The first hosted census attempt completed but its event counters were not
admissible: counters were private to each worker and were copied to the host only
when that worker returned through normal completion. In the exact solve only the
winning worker flushed counters, while aggregate shared-cache statistics covered
all workers.

No conclusion was drawn from that partial rank distribution.

Correction:
- allocate a dedicated SharedArrayBuffer in the diagnostic host;
- give each worker a disjoint Uint32 counter slice;
- update counters in place during search;
- read all worker slices after exact completion or cancellation.

Workers never write another worker's slice, so no atomic RMW is required for the
diagnostic counters. Instrumented timing/cycles remain invalid.

First attempt workflow:
`36384183029`, artifact `10953239072`,
digest `sha256:8cb27fb851c29aeb12c544760d9aef47a9a8dd70c4ed6e1adc1348129eca35f4`.
