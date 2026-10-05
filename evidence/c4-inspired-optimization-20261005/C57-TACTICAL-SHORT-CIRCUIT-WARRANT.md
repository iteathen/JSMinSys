# C57 independent tactical groups / proof-driven short circuit

Frozen before replay. Owner asks for nested inexpensive gates, independent
fall-through and likely-success ordering. Do not claim likelihood is measured
on the real search merely from source intuition.

Current order: singleton restriction, current-mover pair WIN, previous-mover
whole-reservoir WIN/NONLOSS, target WIN, ordinary exact search. Failed routes
already fall through independently. C56 separately assesses sufficient
window-bound cutoff before the stronger target certificate.

## Proposed isolated order experiment

After C56 disposition, put the whole-reservoir response route before the pair
route. Preserve singleton collection first. A response WIN returns LOSS as
before. Response NONLOSS means current mover cannot WIN, so pair-WIN detection
is provably unnecessary on that branch even when the window still needs
LOSS-versus-DRAW search. On response0, run pair finder then target proof with
normal fall-through. Target stays available on NONLOSS branches where the
window has not already cut. All original exact/bound/root-witness semantics,
ordering, TT protocols, dimensions, capacities and machine settings remain.

No aggregate flag lattice or additional stored proof state. The response enum
already exists. A high-cost response rejection could delay a cheap positive
pair proof, so actual full solves decide; source call counts are not performance.

## Independent applicability/frequency diagnostic

Before implementation, freeze a proxy cohort:512 physically generated legal
first-win-stopped7x6 walks, xorshift seed20261005. At each rank choose uniformly
among current legal nonwinning placements using physical rules alone; stop
when none exist. Record current q before advancing. No W/D/L/oracle/book/search
results used to generate or filter it. Exclude own immediate-win states and
dual-opponent-frontier states from the worker-body denominator because those
are handled before the compared routes. Query independent pair, response and
target certificates, reporting counts by rank and all incompatibility checks.
This is a declared structural proxy, not production search likelihood. No hot
solver counters or reporting observers; diagnostic collection is offline.

Actual generated-body tests must show failed response0 still reaches the pair
route, NONLOSS skips it, and window0 cutoff suppresses needless target work.
Both mover gauges, all original windows, cache bounds, target truth, legal
root witnesses and unchanged physical proof gates apply. Complete100dimension
physical sweep and four-worker oracle precede optimized diagnostics/timings.

Record immediate retained parent, then compare repeated full7x6 prepared-empty
wall on unchanged512MiBprivate/4GiBshared/2400/9600/fourPcores. Restore rejected
child completely. C51/C52 broad certificate ancestry survives any rejected
physical order; no witness-specific exceptions or unknown=>false-value rule.
