# IsoMax Phase-2 plan — CPC six-state WDL proof mask

Date: 2026-09-28
Status: completed local representation experiment; rejected for lack of a
whole-solve cycle improvement. See [RESULT.md](RESULT.md). Historical RED/GREEN
commits and the original planned protocol are preserved below.

Selected continuation baseline:
`be7c2887defcefb37080fa61de7ce1dc38dc2990`

Performance-qualified runtime parent:
`7b1cbf0ddb77173cf614bde32b6bd2cdb459820e`

The selected continuation is runtime-byte-identical to the qualified parent and
adds the source-neutral PR116 generated-ledger repair.

## Research source

Core-0.20 DP/DTS established the exact six nonempty WDL proof carrier:

```
P0 absolute LOSS = 100
DRAW             = 010
P0 absolute WIN  = 001

UNKNOWN          = 111
DRAW_OR_WIN      = 011
LOSS_OR_DRAW     = 110
```

Refinement is set intersection / bitwise AND. Mask zero is contradiction.

Generic proof-bound refinement is historical; the current experiment tests only
the economics of this representation in the current CPC/search composition.

## Current representation target

CPC currently owns:

```
interval: Uint32Array(2)
```

using absolute P0-oriented endpoint values 1..3.

Every nonterminal CPC call initializes/writes those endpoints and search later
loads both endpoints to recover mover-relative semantic bounds.

The private exact/bound cache is deliberately out of scope. Its packed tag
already occupies three value bits and changing its exact codes would add
conversion work on frequent private exact hits.

## Candidate

Replace CPC scratch interval endpoints with one local proof-mask word:

```
proofMask: Uint8Array(1)
```

CPC operations:
- initial UNKNOWN = 111;
- P0 cannot win => AND 110;
- P1 cannot win => AND 011;
- exact value v in current absolute code 1..3 =>
  `1 << (3-v)`;
- proof mask is exact iff it is a power of two;
- nonexact nonunknown mask is CPC_BOUND.

Search boundary:
- retain existing CPC kind, restriction and forced-action contracts;
- decode the mask to mover-relative lo/hi exactly once per consumed CPC result;
- use a packed constant/table-free nibble decode rather than reconstructing
  arrays;
- preserve exact value/public cache codes 1..3 outside CPC.

No CPC close-only fusion is included. That candidate was independently rejected
in both V1 and V2.

## Exactness gates

- exhaustive six-mask interval correspondence;
- AND refinement matches endpoint intersection for every ordered valid pair;
- contradiction mask zero fails closed in controls;
- checked terminal and nonterminal CPC paths agree;
- all existing CPC fixture results preserve kind and semantic interval;
- solver WDL/root move controls unchanged;
- behavior/root-frontier generated sources remain authoritative.

## Accounting / benchmark

All source changes update NEES/JSMinSys cycle ledgers and source seals together.

A = `be7c2887...` continuation baseline.
B = one-word CPC proof-mask candidate.

4 workers = 1 wide + 3 deep.
rootFrontier=true.
shared=4,194,304.
local=1,048,576.
sharedSampleMask=0.
Node 26.7.0.

Primary exact fixture: `353335714`, eight balanced pairs.
Authority: whole-process cycles.

Secondary hard fixture `35333571`, 120000 ms ceiling; censored on timeout.

Reject if the completed exact whole-process interval does not establish an
improvement.

PR84 remains draft: its separate official-hard production promotion gate is
unresolved.
