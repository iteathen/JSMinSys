# Phase-2 realized zero-bound cache — experiment cycle ledger

Source authority under test:
`10380f79af68dc1f57455d535814ac0a7eacea33`

Experiment transform:
`experiments/isomax-phase2/bound-realized-hook.mjs`

This ledger is experiment-scoped. If a policy is retained, its operations must
be folded into the canonical JSMinSys addon cycle ledger in the same integration
work.

## Carrier

Existing local exact cache storage is reused:
- stamp: unchanged Uint32Array;
- keys: unchanged Uint32Array;
- value: unchanged Uint8Array.

Codes:
- 1..3: existing exact absolute W/D/L;
- 4: mover-relative LOWER0, value >= 0;
- 5: mover-relative UPPER0, value <= 0.

No new hot data allocation and no second TT.

## Bound probe delta

The existing q hash, slot address and full key equality work are reused.

On a local hit the CPC-only search adds:

```text
C(control.test.u32) + C(control.branch)             exact-vs-bound
+B*( C(control.test.u32)+C(control.branch) )        LOWER0-vs-UPPER0
+B*( C(control.test.u32)+C(control.branch) )        immediate-cutoff test
+B*(1-CUT)*( C(control.test.u32)+C(control.branch)) tighten/no-op test
+CUT*( C(runtime.field.store) )                     cutoff counter
```

where:
- B = 1 for a bound hit, 0 for exact;
- CUT = 1 when the bound immediately closes the current window.

Alpha/beta are local scalar values; their assignments are not represented as
heap/typed-memory stores.

Exact hits pay the exact-vs-bound test. This overhead is charged rather than
assumed optimized away.

## Bound store delta

A bound store first protects any current exact occupant:

```text
C(runtime.field.load)             stamp/epoch state
+C(memory.load.u8)                local cache value
+3*C(control.test.u32)
+3*C(control.branch)
+(1-E)*( CALL(publishSpan32)
       +C(memory.store.u8)
       +C(memory.store.u32) )
```

E = 1 when a current exact occupant blocks the bound store.

There is **no shared-cache store** for bound codes.

## Search-derived store predicates

Search-only and combined arms add tests at existing return/cutoff seams:

- forced terminal fail-high:
  `C(control.test.u32)+C(control.branch)` for `value===0`;
- recursive child fail-high:
  `C(control.test.u32)+C(control.branch)` for `best===0`;
- completed non-exact fail-low:
  tests for `best===0 && alphaOrig>=0`.

Each admitted store then pays the full bound-store expression above.

## CPC-derived store predicates

CPC-only and combined arms add tests after mover-relative CPC interval
construction:

- `semanticLo===0 && semanticHi===1`;
- else `semanticLo===-1 && semanticHi===0`.

An admitted store pays the full bound-store expression.

## Exact/public-cache preservation

The public exact-cache wrapper adds a value-class test so codes 4/5 are never
returned as exact values.

The generic/Four-Front recursive lane adds the same exact-only filter and does
not consume bounds in this experiment.

## Promotion authority

Static accounting above makes every new operation class visible. Performance
authority remains matched Windows `QueryProcessCycleTime` whole-solve evidence,
because node count and exact-cache traffic intentionally change.

No candidate may be retained on node count alone.
