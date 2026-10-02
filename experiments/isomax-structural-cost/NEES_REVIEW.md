# Prepared closure realization audit

Authority: NEES Draft0.5, iteathen/NEES revision
7650bef0aecc0d2b226ecf253a1f8937ccf89d69, SPEC/CONFORMANCE/NODE_V8_METHODS/
COST_ACCOUNTING. This is a scoped NEES-EXTREME review of the changed cofactor
neighborhood, not a new universal certification of the entire solver.

Semantic owner: the reference RBA cofactor and canonical coordinate contract.
E1 functions run for child transitions inside the E0 recursive solver. COLD
owns geometry, containment compilation, storage, kernel choice and workers.
Governing unit: full four-worker structural-prefix plus one exact root solve,
including initialization/JIT and cleanup. No per-node diagnostics are present.
Node27 nightly b59840b593, V8 14.6.202.34-node.36, Windows x64/i5-12600K,
four P-core workers0/2/4/6, shared4GiB and private576MiB each.

## Realization and causal costs

The closure transformation is DERIVATION/REPRESENTATION, with LOCALITY and
JIT-ENGINE terms coupled to whole execution. A slower first implementation is
not a falsifier of its structural parent. Screens compare realizations; promotion
requires a qualified composite, not a count of fewer operations.

| Repeated cost | Disposition | Mechanism / limit |
|---|---|---|
| Child-basis cardinality discovery | SUPERSEDED | Grouped exact shape sets do not need boundaries |
| Per-image subset predicate across child basis | SUPERSEDED | Geometry containment compiled once |
| Failed global-ID membership lookups in CSR | SUPERSEDED | Native mask intersection with existing child set |
| Per-node aggregate allocation / table growth | REMOVED | All spans and tables allocated before search |
| Unused CSR offsets/IDs in selected profile | REMOVED | Mask-only compiler retains only grouped arrays |
| Table references per active source image | REMOVED in source | Hoisted after terminal exits; compiler evidence separate |
| Repeated shape-word base calculation | REMOVED in source | Hoisted outside bit enumeration |
| Dense removal helper dispatch | REMOVED | Cold-selected dense module loads prepared table directly |
| Geometry scalar property interpretation | REMOVED | Generated standard constants; general fallback retained |
| Sparse removal helper | REQUIRED fallback / UNVERIFIED-DEBT cost | Budget0 remains valid; performance qualified on dense profile |
| Child basis materialization, sorted bit emission | REQUIRED by current representation / UNVERIFIED-DEBT | Needed by CPC/identity; full transition compiler is separate work |
| Child-index publication | REQUIRED by current grouped realization | Exact local-coordinate translation, bounded preallocated scratch |
| write0/write1 tests for each emitted bit | UNVERIFIED-DEBT | Splitting loops trades code size for branches; not declared free |
| Separate word/mask arrays | COUPLED / UNVERIFIED-DEBT | 5 bytes/group versus8 interleaved; locality/extra view tradeoff |
| Bounds guards, spills, JIT warmup | UNVERIFIED-DEBT | Inspect actual compiled caller; never priced as zero |
| Shared TT atomics / behavior reads | Inherited REQUIRED contract | Unchanged synchronization and STOP semantics |

Applicable method families: M01/M02/M03 cold narrowing/stable fields; M09 native
bounded integers; M11/M13 capacity/lifetimes; M15/M16/M19/M42 derived tables and
required work; M17/M20/M38 kernel selection/code size; M35/M36 external diagnostics;
M44-M52 scoped machine evidence, causal roles, complete cost and regression surface.
No hot native/FFI or new coordination boundary is introduced. Existing generic
engine debt is inherited, not automatically NOT-APPLICABLE or COSTED-OUT.

## Symbolic cost ledger

For one nonterminal cofactor, let n be parent basis count, cn child basis count,
u the unabsorbed surviving images, G(i) the nonzero global superset-word groups,
and K(i) the actual child supersets after intersection. These are semantic
counts, not instrumented hot counters.

- Preparation: 625x625 bounded predicate domain per worker, then typed storage.
- Basis: 20 clears + n removal/table/bit insertions + 20-word sorted emission.
- Map: cn child-index stores.
- Source traversal: n coordinate tests, removal reads and ownership guards;
  each surviving image requires image-bit absorption and publication.
- Group closure: sum over u of G(i) word-index/mask/seen loads and bitwise AND;
  sum of K(i) set-bit extraction, inverse load, target address and coordinate ORs.
- Cost terms remain C(load locality), C(store), C(branch prediction), C(clz),
  C(bounds/representation guard), C(spill), C(JIT/setup), C(GC if realized).

No operation is assigned zero cycles because V8 may optimize it. External
whole-process QueryProcessCycleTime supplies the numerical total. PMU cache/
memory-stall and exact per-node frequencies remain unavailable. Raw sampled
profiles explain prioritization, not an invented closed cycle attribution.

Regression surface: both players, every legal child on deterministic walks,
reflection, exact basis/key, stale scratch including bit31, absorption/ownership,
first wins before full-board draw, dense/sparse tables, general dimensions,
deterministic full TT contents across orders, STOP/reuse, real worker cleanup.
Generated source remains derived from the same authority; packaging must copy
the qualified bytes and retain both cold-selected worker entry points.
