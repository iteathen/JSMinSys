# IsoMax Phase-2 cache identity meta-elision experiment

Date: 2026-09-28
Status: structural exact-identity candidate.

Baseline:
`f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862`.

## IsoGraph / MSS identity proof

Current q state contains:
- one support height word per column;
- one meta word: rank in bits >=2 and terminal code in bits 0..1;
- p0 residual coordinate words;
- p1 residual coordinate words.

For every q admitted to the exact/local-bound caches:

1. Gravity support is gap-free by construction.
2. Root rank is 0 and every legal cofactor increments exactly one support height
   and rank by one.
3. Therefore, for every reachable state:
   `rank = sum(column heights)`.
4. Cacheable current q states are nonterminal:
   - root terminal positions return before search;
   - terminal cofactors are consumed by the parent and are not recursively
     entered as cacheable q;
   - exact cache stores resolve the current nonterminal q, not the terminal
     child.
5. Therefore cacheable meta is exactly
   `(sum(column heights) << 2)`.
6. Reflection permutes support heights and preserves their sum.

Thus meta is a deterministic function of support on the cache boundary and is
not an independent identity component.

Observed validation:
the shared mismatch-prefix census recorded exactly zero mismatches at word 7
(the standard 7x6 meta slot) across four exact solves and the official-hard
120-second census.

## Candidate representation

Keep the full search state, including meta.

Reorder the state record so cache identity is a contiguous prefix:
- support heights;
- p0 coordinate words;
- p1 coordinate words;
- meta last.

Add `cacheKeyWords = metaOffset`.

For standard 7x6:
- full state remains 14 words;
- exact/local-bound/shared cache identity becomes 13 words.

For arbitrary configured geometry:
- full state remains `columns + 1 + 2*coordWords`;
- cache identity becomes `columns + 2*coordWords`.

The existing locator hash, local key copy/equality and shared key copy/equality
then operate on the exact 13-word identity prefix without a skip branch.

## Correctness boundaries

- No probabilistic fingerprint replaces equality.
- Support + p0 + p1 equality remains exact q identity because meta is derived.
- Shared cache remains exact-only.
- LOWER0/UPPER0 remain private.
- Full sharing remains enabled.
- No solved-position prior.
- No single-worker qualification.

## Required implementation

Update:
- geometry offsets and cacheKeyWords;
- canonical reflection secondary comparison to exclude trailing meta;
- local cache preparation/validation to use cacheKeyWords;
- shared exact cache creation/validation to use cacheKeyWords;
- 7x6 and 4x4 unrolled local equality widths from 14/7 to 13/6;
- generated behavior/root-frontier mirrors;
- arbitrary-geometry and endpoint-cache tests;
- NEES cycle ledger/source closure.

Verify before timing.

## Benchmark

Matched 4-worker A/B:
A = `f549dcf...`
B = fixed verified candidate.

Primary exact:
`353335714`, eight balanced AB/BA blocks.

Secondary:
`35333571`, unchanged 120000 ms fixed window.

Primary acceptance authority:
whole-process cycles on completed exact controls.
