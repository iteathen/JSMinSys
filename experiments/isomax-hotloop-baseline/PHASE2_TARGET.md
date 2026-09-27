# IsoMax Phase 2 — second cumulative 50% campaign

Status: owner directive, 2026-09-27.

## Objective

After Phase 1 establishes its qualified winner, improve IsoMax by an **additional
50% cumulatively** relative to that qualified Phase-1 line.

The target is deliberately mechanism-neutral. Any exact improvement may
contribute, including:

- fewer CPU/process cycles per visited state;
- fewer visited states / a smaller search tree;
- better move ordering or pruning;
- cheaper primitives or data movement;
- better cache/TT economics;
- structural compression or quotienting;
- evaluator/CPC/cofactor redesign;
- Lazy-SMP work-efficiency improvements;
- representation changes;
- algorithm redesign;
- any other change that improves exact whole-solve effectiveness.

Do not optimize to a single local metric when total solve cost gets worse.

## Baseline

The Phase-2 experimental denominator is now frozen after the Stage-10
confirmation falsifier:

- SHA: `10380f79af68dc1f57455d535814ac0a7eacea33`
- retained Stage-9 exact 7-column/radix-7 plan-key specialization;
- cumulative retained Phase-1 chain: approximately 0.50339 of the original C1
  worker cost (~49.66% reduction).

The owner directed Phase 2 to begin from the best retained/current line even
though Phase 1 finished just short of its nominal 50% threshold. Stage-10
point-estimate wins are excluded because higher-power confirmation did not
retain them.

This is an experimental/research denominator, not a production-promotion claim.

## Acceptance metric

Correctness and semantic equivalence remain mandatory.

For equal-search-work changes, process cycles and wall time may be compared
directly and cycles/node remains useful.

For structural/search/algorithm changes that alter visited work, judge the
candidate on **whole-solve effectiveness**, including at minimum:

- exact W/D/L and root witness;
- total process cycles;
- wall time;
- visited nodes;
- cofactors;
- CPC/cache/TT/search counters relevant to the changed mechanism;
- memory/resource effects;
- multiworker whole-solve behavior before promotion.

A candidate is useful when it improves the total exact solve even if one local
metric regresses.

Phase-2 target:

    qualified Phase-2 whole-solve cost <= 0.50 * qualified Phase-1 baseline cost

A chain of independently measured effects may contribute cumulatively, but do
not multiply unrelated/noisy ratios blindly. Re-anchor with direct matched
whole-solve comparisons at major milestones and before final qualification.

## Search-space reduction is first-class

Phase 1 concentrated heavily on worker-cycle cost. Phase 2 explicitly treats
node reduction as equally valuable. A more expensive node is acceptable if the
search tree shrinks enough to reduce total exact solve cost.

Every experiment should therefore record whether it is primarily:
- per-node cost reduction;
- node/search-work reduction;
- both;
- or structural/algorithmic replacement.

## Provenance boundary

The strict IsoMax information rule remains unchanged.

Admissible:
- rule/geometry-derived information;
- general algorithms;
- strategies learned through admissible research, provided they do not encode
  solved-position answers;
- current-state/runtime deductions.

Not admissible:
- precomputed W/D/L or best moves;
- disguised solved-position tables/masks/classifiers;
- solution-derived state labels crossing into IsoMax as answers.

BSFP may teach general strategy/structure but may not provide its solved
position answers.

## Repository durability / UI desync rule

The UI has repeatedly desynchronized. From this point forward:

1. commit the campaign target before new experimental work;
2. commit experiment plans before long runs when practical;
3. commit accepted **and rejected** results promptly;
4. checkpoint after each material discovery or benchmark stage;
5. keep exact SHAs, workflow run IDs, artifact IDs/digests and dispositions in
   repo evidence;
6. never leave the only copy of a result in chat/session state.

Prefer small durable checkpoints over large uncommitted batches.

## Immediate transition

1. finish the active Phase-1 confirmation runs;
2. freeze the exact qualified Phase-1 winner and direct baseline;
3. profile/census that exact winner;
4. begin Phase 2 from broad leverage again rather than continuing only with
   micro-optimizations;
5. explicitly reconsider search-tree reduction, structural simplification and
   algorithm changes alongside primitive-cycle work.
