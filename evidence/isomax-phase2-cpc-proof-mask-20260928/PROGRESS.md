# CPC proof-mask execution checkpoint

Plan: PLAN.md; canonical Connect4 CPC_PROOF_MASK_PLAN.md at 1c96bf6d.
Base: be7c2887defcefb37080fa61de7ce1dc38dc2990.
RED preserved: b4b1495f2ff403441e974456062d65ecf22e427e,
Verify36461231312: only the two new representation assertions failed.

## Implementation

- Replaced CPC endpoint scratch with Uint8Array(1); all exact/bound/restrict
  paths publish one nonzero convex proof mask. Local scalar refinement uses AND.
- Search, generic Four-Front and root consume the same table-free nibble
  constant 0xd905eaf0. Low endpoint is used for exact publication; high endpoint
  is decoded only when needed in recursive search. Cache codes remain 1..3.
- Existing tactical/first-win/forced/preemption/advisory tests retain semantic
  assertions through a test-local interval oracle. Diagnostic tool compares masks.
- Authoritative behavior/frontier generators regenerate both variants; actual
  Git-normalized source blobs are resealed. K/STOP_TEST remains separated.
- Added all-six-state/mover decode checks and reused terminal scratch checks.

Ruling: keep proof refinement in a scalar until return instead of repeatedly
writing/reloading the byte. Helpers do not read proof scratch during evaluation;
one byte is published on every return. This changes representation traffic, not
the proof or cache policy. No CPC close-only fusion or general weak store added.

Independent review found inherited CPC endpoint accounting was incomplete, so
subtracting old endpoint operations caused undercounts. Recounted direct u32 and
object-field traffic with executed-path indicators; a RED/GREEN regression
protects initial resets, forced writes, unknown reads and early advisory resets.
Corrected the cold scratch inventory to 11+3P+F arrays and20 object fields.
Non-proof aggregate arithmetic/control terms remain conservative source-operation
models, not claims of exact emitted instructions or Intel cycle measurements.

## Correctness / accounting controls

The baseline RED reproduced locally before implementation. Initial178-test full
suite passed; later terminal/accounting regressions require a fresh final suite.
Differential control compares the pinned baseline's original CPC source against
the candidate over24757 evaluations, 4x4/7x6/8x5, both frontier policies and both
advisory modes. Kinds, decoded proofs and every other scratch field agree.
Sampled masks1/2/4/6/7 occurred; algebra/decoder tests separately exhaust all six,
including mask3. This is finite differential evidence, not new game theory.

`differential.mjs` is cold correctness infrastructure. Its module main performs
one synchronous Git process/read (unbounded IO latency), source decoding and
data-URL compilation (nonzero size-dependent cost), geometry preparation,
bounded trial/prefix loops, ingress and paired CPC calls, object/typed-array
comparisons and final JSON output. Functions/map/set/array/string use belongs to
this cold control only. It is never imported by solver workers or used as timing
evidence. `tools/bench-rba-cpc-ab.mjs` diagnostic loop now reads two proof bytes
instead of four endpoints, compares masks/kinds and records scalar masks; its
existing cold initialization/solve/repeat/report cost remains nonzero. CI smoke
output is correctness integration evidence, not single-worker qualification.

## Remaining gates

Full local Verify equivalents, GREEN hosted Verify, clean fixed source commits,
four-worker matched whole-process measurement, accepted/rejected disposition,
canonical Connect4 result. No performance claim is made at this checkpoint.

## GREEN and fixed-source measurement checkpoint

Candidate source: 7f74e324457c4237590bc6b0f924852f6d728e4c.
Full local suite180/180; catalog, both generator checks, geometry/frontier
audits, schema,80-module syntax and both required CI smoke scripts passed.
Hosted normal Verify36464380804 passed verify/schema/node-compatibility.
Independent review's direct-traffic finding and L/LL definition are repaired.

Matched local command, using clean detached source worktrees:

```text
node experiments/isomax-phase2/cpc-proof-mask-source-ab.mjs evidence/isomax-phase2-cpc-proof-mask-20260928/local-exact C:/r/isomax-p2-proof-mask-A C:/r/isomax-p2-proof-mask-B 353335714 8 90000
```

The primary90000ms application ceiling matches the established primary runner;
hard fixture ceiling remains120000ms. Configured workers4 (0 wide,1/2/3 deep),
mask0, shared4194304/local1048576. Available host parallelism16 is recorded and
does not change configured workers. QueryProcessCycleTime measures the same
whole host/worker bracket as the established Windows authority, but local and
hosted measurements remain separately labelled populations.

The cold AB/sample scripts derive from the already-qualified source-runner
pattern; they add fixed SHA/clean/config/result/cleanup checks, preserve every
child stdout/stderr and record all samples incrementally. Controller module-main
and git helper include process/IO latency (unbounded, not zero); loop and
filter/map/find/reduce/mean callbacks cost O(samples*metrics) plus JSON byte cost.
They execute outside the sampled child process. Sample module-main includes
module/geometry/profile/FFI setup before the bracket and all selected host/worker
operation inside it. Result reduce/map/every callbacks and JSON output are
post-bracket. No benchmark helper runs inside recursive search. These cold costs
are declared rather than silently treated as zero; no source-ledger number is
substituted for measured Intel process cycles.
