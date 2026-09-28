# Phase-2 optimization — carry known q hash into shared exact cache

Date: 2026-09-27

## Baseline

Current hard-workload lead:
`4161b37e949adf05d3e10978547a40adf15a2743`

This is the all-noncutoff shared-fallback arm:
- both LOWER0/UPPER0;
- same-q weak-bound coalescing;
- shared publication of newly exact draws;
- shared exact fallback after every non-cutoff private weak-bound hit.

It is exact-derived neutral but reduced the official-hard fixed-window cycles and
nodes by about 15% on its first screen.

## Structural inefficiency

Every recursive q already computes:

    cacheHash = mixSpan32Locator32(q)

for the local direct-map slot.

When the same q then probes or stores the shared exact cache, the shared helper
currently executes `mixSpan32Locator32` again over the full q.

This duplicate locator work appears in:
- selective weak-bound shared fallback;
- ordinary private-miss shared exact probe;
- exact shared publication;
- coalesced exact-draw shared publication.

The shared cache still validates the full q key under its sequence protocol.
Reusing the locator hash does not weaken correctness.

## Arms

A — current all-noncutoff shared-fallback baseline.

B — **fallback hash reuse only**
- shared helper accepts an optional already-known hash;
- selective weak-bound fallback passes `cacheHash`;
- existing ordinary shared probes/stores remain unchanged.

C — **all hot shared hash reuse**
- selective fallback passes `cacheHash`;
- private-miss shared exact probe passes `hash`;
- exact shared store passes `hash`;
- coalesced exact-draw shared store passes `hash`.

The shared helper retains default hash computation for external/cold callers that
do not provide a known hash.

## Measurement

Standard 4-vCPU GitHub Windows runner:
- 4 workers;
- 1 wide + 3 deep;
- rootFrontier=true;
- shared exact 4M;
- local exact 1M/worker.

Primary exact:
- `353335714`, six balanced blocks.

Secondary hard:
- `35333571`, fixed 120-second ceiling.

Primary metric: whole process solve cycles.

## Cycle accounting

Explicitly charge:
- known-hash/default-path selection test/branch in shared helpers;
- remove `CALL(mixSpan32Locator32)` only when KH=1;
- all atomic key/value/sequence operations remain unchanged.

No hash or cache operation may disappear from the ledger merely because its
input is now carried from the caller.
