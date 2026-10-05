# CPC research recovery before minimal-worker experiment

Recovered canonical Connect4 research ref: research/semantic-quotient at e597ca5a80393b9e05ddc76d61fc7c568b28daf1 (2026-10-04 live fetch). No research outcomes/holdouts opened.

## Authority and scope

Current logic authority: research/isograph/CONNECT4_LOGIC_AUTHORITY_1_2.md and frozen successor package. L4 keeps CPC/NDC premises, timing, resources and realizability as guarded proof facts. It does not identify proof state with ordinary q without a derivability argument.

C4-0006 (Candidate structural specification, not silently promoted) gives the target-truncated event count N(t)=(W-1)H-ply+r+1. Its section 2 expressly says CPC is not a standalone ownership oracle. The zero-reservation absolute field q0=((W-1)H+r) mod2 is a projection under a valid reservoir, not an unconditional WDL decoder. Sections 3/7 retain response, precedence and deadline obligations. C4-0007 owns nested proof closure.

Read provenance: docs/research/2026-09-09-universal-strategic-algebra.md, 2026-09-14-cpc-control-potential-unification.md, 2026-09-14-cpc-residual-middle-isomorph.md, 2026-09-24-cpc-optimization-lineage.md. The historical optimization lineage is implementation evidence, not authority to restore mixed CPC/NDC semantics. Current production module was split by JSMinSys 42753bc/1729438/4b925eb/9d928a4 into a win-only certificate and legacy NDC consumer.

## Current certificate and limitations

The current win-only evaluateConnect4CpcWin32 implements one sufficient whole-reservoir response strategy, narrower than the general target-reservoir calculus. Controller is the previous mover; opponent moves next. Even remaining column tails pair adjacent lower/upper cells. Odd tails pair their frontier cells across columns in column order, then pair vertically above them. Total remaining event count must be even. This specific theorem therefore certifies only the player occupying the second member of the remaining pairs; it is not a complete CPC implementation or a complete scalar evaluator.

The strategy is legal: when the opponent takes a lower vertical cell, the upper response becomes playable; paired frontier endpoints are both initially available, and both are consumed before vertical play above them. All pairs are disjoint. The opponent cannot take any fixed upper response or both endpoints of a frontier pair. Requiring every opponent winning residual to contain one such obstruction prevents an opponent win before response. Requiring one controller residual entirely in fixed response cells guarantees a controller win by exhaustion if play has not already ended in a controller win. Existing first wins take precedence. The proof uses no solved outcomes.

Unresolved returns 0. It is never draw or loss evidence. An adapter may convert a positive certificate to a controller win only, and cannot infer anything from 0. Historical broad NDC interval/restriction logic will not be imported into this experiment.

## Proposed equivalent implementation

For a live cell at row r above frontier h, the current fixed-response predicate is equivalent to r>h AND parity(r)!=parity(H). Proof: if H-h is even, fixed cells have odd delta; if odd, fixed cells have positive even delta (at least2). In both cases r has parity opposite H and lies strictly above h. Geometry can precompute response-compatible cells/shapes. Height checks remain dynamic.

Remaining-tail parity equals (cellCount-rank) mod2; avoid rescanning all columns just to compute it. Derive odd-frontier partners once per certificate call using preallocated scratch, not once for every uncovered opponent residual. Preallocate all tables/scratch during worker initialization. General dimensions remain geometry input. No hot counters.

These are algebraically equivalent candidates, not yet independently qualified. Qualification must include literal-board response policy reconstruction, exact outcome validation after candidate execution on small boards, general dimensions/reflection, boolean agreement with the existing implementation, and negative/unresolved controls. Passing equivalence alone does not validate a potentially defective inherited theorem. The timed comparison is full empty-board four-worker localhost solve with unchanged memory/runtime/affinity; failed/censored timing is not a performance promotion.
