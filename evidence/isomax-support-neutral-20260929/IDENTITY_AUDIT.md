# Current IsoMax identity audit — owner correction

2026-09-29. **Decision A for the original owner-neutral-token idea. No new worker mechanism is needed to realize that equivalence.** No further semantic reduction is established by this audit. The question of a minimal possible WDL identity remains open; this is not a claim that q is the mathematically coarsest state representation.

## Revision and scope

Fetched live JSMinSys refs. Main is `93aca1758718bcbf0635c11a957a67ca6387d50c`. Selected localhost source remains `6bbba7c71c60afb1018a22b6d5c03f495f5d2c9e`, as named by the unchanged selected memory profile. The inspected cofactor/ingress/canonicalization source is identical between these revisions. Main uses full-q cache equality; the selected research line uses the qualified lossless compact8 equality. Do not confuse storage compression with an additional semantic quotient.

The withdrawn experiment `de8394ab44bea9892f1cbb8a84160efb753a4cc3` is not the selected solver and is not the audit authority. Its runtime changes have been removed from this working branch. No support/column assumption is used to choose a new optimization.

## Exact path and identity

1. Cold `connect4RbaFromMoves` creates q and its basis. Selected host passes `positionCode:false`. Root history is retained for cold initialization of ordering state, not for TT identity.
2. `connect4RbaCofactorKnownHeight` increments the played height and rank. A mover singleton completion ends the game before exhaustion. Otherwise it maps residual shapes through the move: own requirements lose the played cell, opponent requirements containing it disappear, and the resulting coordinates are closed upward in the child support-local basis. Duplicate/absorbed requirements are represented by the same upset, not distinguished by originating line or token history.
3. `connect4RbaCanonicalize` compares support with its reflection first, then coordinates on a support tie; it permutes basis and coordinates consistently. A separate orientation bit transports literal actions.
4. For standard 7×6, the TT hashes the canonical 14-word q and verifies equality using a lossless 8-word packing of that same q. `mixSpan32Locator32` selects a direct-map slot; hash collisions do not establish equality. Private caches can fall through to the shared exact cache.

For standard 7x6, execution q is fourteen u32 words:

```
q[0..6]  = seven column heights
q[7]     = (rank << 2) | terminalCode
q[8..10] = P0 upset coordinate (up to 69 support-local basis bits)
q[11..13]= P1 upset coordinate (same basis)
```

Terminal codes: 0 nonterminal, 1 P0 loss, 2 draw, 3 P0 win. Side to move is rank parity. Geometry is fixed by the prepared solve/cache context.

Both selected private and shared caches store these eight exact key words:

| Stored lane | Content |
|---|---|
| 0,1 | h0, h1 |
| 2 | h2..h6, three bits each; terminal code in bits15..16 |
| 3,4 | P0 coordinate words0,1 |
| 5,6 | P1 coordinate words0,1 |
| 7 | low5 bits of P0 word2 plus low5 bits of P1 word2 shifted5 |

Rank is omitted from stored equality because legal ingress/cofactor/reflection preserve `rank=sum(heights)`. Tail padding is omitted because legal construction makes it zero. The full14 hash still includes those derived fields; this cannot split equal valid compact keys because they reconstruct the same valid full q. Nonstandard/compatibility cache paths retain full-q equality.

Private epoch and value tag, shared sequence/version and value, direct-map slot, and worker metrics are cache-management/result metadata, not additional game identity. Shared values remain exact-only. Private LOWER0/UPPER0 codes are separate proof values for the same q, not key fields.

## What ownership is already forgotten

For fixed geometry, support and terminal status, two legal histories producing the same P0 and P1 residual upsets produce the same q and the same exact TT identity, after reflection canonicalization. The histories may differ in token ownership wherever those differences leave the surviving requirements unchanged. Originating line labels, multiplicity of equal requirements, and absorbed larger requirements do not introduce distinct residual coordinates.

For the original gray-token condition, changing historical ownership without changing any surviving winning requirement therefore adds no identity distinction. RBA has already taken that quotient. Occupancy is not erased: heights still describe it. This argument does not identify ownership-neutral tokens with irrelevant columns.

Fresh rerun of the existing exhaustive legal4x4 audit:

- 161,029 physical states;
- 42,168 explicit neutral-token classes;
- 34,461 non-reflection-canonicalized RBA q classes;
- zero neutral-token classes split across q; maximum q per neutral class=1;
- 15,182 q classes combine more than one explicit neutral-token class;
- 13,259 nonterminal q classes contain multiple physical positions.

This reproduces subsumption, including before terminal play. It is exhaustive for4x4, not an exhaustive7x6 experiment. The general explanation comes from the residual construction above, not extrapolation of the counts. Test log: `owner-audit-repeat.txt`.

## Remaining fields: semantic requirement versus execution convenience

| Component | Distinction / necessity / current treatment |
|---|---|
| P0/P1 residual upsets | Future winning requirements of each named player. They affect completion and blocking; dropping them generally changes WDL. Same upset already has one bit encoding for a fixed support basis. This does not prove every bit independent over reachable states. |
| Heights | Occupancy frontier, legal columns and the physical cell reached by each action. They affect access to requirements, first-win timing and exhaustion. No general height-removal equivalence is established. A fieldwise removal is not justified by owner-neutrality. |
| Rank/side | Needed for mover polarity/exhaustion; derivable on legal states. Rank is an execution convenience and already absent from compact equality; no independent side field is stored. |
| Terminal status | Necessary in the full state domain to distinguish ended-game outcomes. Production recursive TT queries receive nonterminal q, so these bits are constant there; omitting constant bits cannot merge any additional such states. Public/general cache paths are broader. |
| Basis and basis size | Support/geometry-derived execution indexing. Needed to interpret/update coordinate bits, but not stored as TT identity. Different supports can change bit meanings; raw coordinate equality cannot independently justify a new cross-support quotient. |
| Literal orientation | Required for physical move transport, not scalar WDL. Already excluded from TT; reflection canonicalization already merges mirror q. No new reflection quotient is missing here. |
| Root history / live-line state / move rows | Cold setup and advisory search ordering. Not TT identity. Live-line state may retain line-provenance distinctions beyond the reduced q, but cache equality does not compare it. Thus the entire worker is not identical to its semantic q. |
| Depth, alpha/beta, scratch, worker identity | Execution/proof context, excluded from keys. Valid bound/exact publication rules handle context; current key does not force it into identity. |

## Is TT forced to use the whole execution representation?

No. It already excludes history, advisory state, basis storage, depth and orientation, and stores a compact projection of q. However its semantic equivalence is currently **exact canonical q equality**; compact8 is lossless, not coarser. Search and TT still share a full-q locator. A genuinely coarser identity would need both an equivalence proof and a locator consistent with that equivalence, followed by exact collision verification. None is introduced here.

Reflection work is performed at the state boundary for canonical reuse and action transport. Basis transformation is needed for native residual execution as well as interpretation; it is not merely reconstruction demanded by a TT carrying token owners. There is no recursive physical-board reconstruction to satisfy TT equality. Rank/padding packing is cache-only representation work; it creates no extra semantic distinctions.

## Evidence and next step

No surviving owner-neutral split in the current q/TT was demonstrated. Same-q repetition after eviction, separate worker-local caches, or a new epoch is not evidence of a finer semantic identity. The earlier column-based census is historical evidence from a withdrawn hypothesis, not authority to select the next quotient. Its bounded observations do not qualify a standard7x6 removal.

**Decision A:** the original ownership optimization is already realized. No new worker machinery, cache schema or hot-loop change is warranted for it. Evidence is insufficient to remove other semantic information generally.

Owner-approved disposition: Connect4 issue #174's proposed new runtime mechanism is **not planned**. Additional worker cost for the original gray-token idea is zero: it requires no added computation. The column/support-capacity hypothesis is separate, unqualified research and is not continued by this audit. Preserve the clean ten-minute localhost run as a general performance baseline, not as justification for a new quotient.

If additional validation is desired, the smallest next experiment is read-only: take legal history pairs with equal support, terminal status and both residual upsets; verify equal canonical q, full locator hash and actual private/shared compact equality (including reflected pairs). Sufficient merge condition: those conditions hold, or the histories are related by the already-proved reflection transport. This is not claimed necessary for every possible equal-WDL pair. It validates the existing boundary; it does not propose a new quotient or benchmark candidate.

Verification after removing the withdrawn candidate: catalog170 units, both generated-source freshness checks, and nine ownership/cofactor/cache tests pass. Source files under addons/tools again match the selected6bbba7c solver. The hardware profile and original clean600s performance baseline remain unchanged and separate from this semantic audit.
