# CPC guard-survival kernel — NEES conformance record

Authority: NEES Draft 0.5 @ `7650bef0aecc0d2b226ecf253a1f8937ccf89d69`.
Runtime profile: Node 26.7.0 / V8 14.6, x86-64 AMD Zen 3 reference cost profile.
Scope: standard 7x6 CPC/RBA constructive guard-survival proof kernel.

## Semantic boundary

The kernel consumes an already-ingressed exact RBA state plus the compact odd-row
guard proof side-state and a requested odd survival horizon. It returns:

- `1`: constructive survival certificate found;
- `2..8`: first attacker trigger column 1..7 not closed by the frozen proof grammar.

It does not produce W/D/L, exact remoteness, solved oracle evidence, or a best move.
Failure is not an attacker forced-completion certificate.

RBA remains the semantic board identity. The kernel does not add a physical
bitboard, 49-bit position identity, explicit gray-token identity, move-history key,
or second live-line state. The qualified RBA neutral-token quotient remains
authoritative.

The additional odd-row mask is proof-resource state, not a second board identity.
It records only the ownership information required by the frozen guard theorem.

## Execution classes

- COLD: `prepareConnect4GuardSurvival32`; geometry/profile guard, typed storage,
  proof memo and scratch preparation.
- E3: root import and `proveConnect4GuardSurvival32`.
- E0: `searchGuardSurvival32` recursive survival proof.
- E1: exact RBA cofactors, residual/deadline scans, pairing-template proof,
  response-mask construction, guard transitions and proof-memo operations.

## Structural changes from research runner

Removed from E0/E1:

- `Map` class memoization;
- base64/string state keys;
- `Map`/object response candidates;
- `Set` response-cell and template carriers;
- per-node result/witness objects;
- per-transition typed-array allocation;
- physical 49-bit board identity;
- gray physical-code identity;
- dynamic template objects for frontier-response discovery.

Replacement:

- fixed 43-frame RBA word/basis arena;
- caller-owned cofactor destination spans;
- 7-bit candidate response masks;
- numeric proof return codes;
- fixed typed scratch for minimal residuals, deadlines and pairing search;
- NEES-ledgered direct-map proof memo;
- inherited lossless standard-7x6 RBA 14-to-8-word compact key storage.

The synchronized-template frontier response union is rendered directly as a
column parity mask. Bounded template coverage still performs the exact finite
pair/length search but uses fixed scratch rather than aggregate construction.

## Proof memo identity

For standard 7x6 the memo stores:

[
8 	ext{lossless compact RBA words}
+ 1 	ext{guard-mask word}
+ 1 	ext{horizon word}.
]

Hash/slot identity is addressing only. A hit requires exact stored-key equality.
Direct-map collision/replacement yields a miss/recompute and cannot create proof
acceptance. The memo is single-owner. Shared-worker publication is outside this
scope and would require its own synchronization protocol.

## Governing optimization unit

Primary performance unit: one complete candidate-6 survival proof at a declared
horizon on the same Node/runtime/runner profile.

Local proxies such as allocation count, key width and memo hit count are
diagnostic only. Promotion requires unchanged proof result and lower governing
wall/CPU/memory cost or an explicitly justified larger tradeoff.

## NEES cost accounting

Every declared function in:

- `addons/rba-connect4-proof-memo.mjs`
- `addons/cpc-connect4-guard-survival.mjs`

has a decomposed cycle ledger in `catalog/addon-cycle-ledger-v0.json`.
The source blobs are guarded by git-blob SHA. Changing either decomposed source
without refreshing the ledger fails `tools/verify-catalog.mjs`.

The recursive template and survival costs are represented as explicit recurrence
edges, not a legacy symbolic whole-body placeholder. Memory, branch, arithmetic,
typed-allocation and call costs remain named.

## NEES disposition

- Physical-position/gray-code memo identity: SUPERSEDED by exact RBA identity.
- String/base64 memo key: REMOVED.
- General `Map` class memo: REMOVED.
- Per-node aggregates/witness objects: REMOVED from proof kernel.
- Per-node q allocation: REMOVED through caller-owned frame arena.
- Response candidate collections: REMOVED through 7-bit masks.
- Full RBA key storage in standard 7x6 memo: SUPERSEDED by existing lossless
  compact profile.
- Finite synchronized pairing search: REQUIRED by current frozen theorem grammar;
  further algebraic compression remains UNVERIFIED-DEBT.
- Recursive JS call structure: REQUIRED by current proof rendering; iterative or
  schema-closure replacement remains UNVERIFIED-DEBT until governing-unit evidence.
- Single-owner direct-map replacement misses: TRADEOFF; correctness-neutral bounded
  memory in exchange for possible recomputation.
- Guard side-state itself: ENABLING proof resource. Further quotienting through RBA
  is UNVERIFIED-DEBT until an observation-preserving congruence is proven.

## Falsifiers

Reject or revise this realization if any of the following occurs:

- established D15/D19/D21/D23/D25 certificate changes;
- exact RBA cofactor behavior differs from the frozen proof grammar;
- compact memo collision produces a false hit;
- synchronized response-mask rendering differs from complete-template response union;
- governing proof runtime/memory is worse without a larger measured benefit;
- hot allocation/deoptimization reappears;
- Node/V8/profile change invalidates load-bearing cost assumptions.

## Promotion gate

Before promotion beyond research:

1. `node tools/verify-catalog.mjs`;
2. exact proof-memo tests;
3. guard-survival D15 structural regression;
4. full JSMinSys test suite;
5. Connect4 D19/D25 matched governing-unit qualification;
6. retained generic RBA geometry tests;
7. no claim of v5 or exact remoteness from survival evidence alone.
