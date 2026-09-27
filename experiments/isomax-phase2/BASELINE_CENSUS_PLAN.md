# IsoMax Phase 2 baseline census plan

Status: measurement plan; run only after the exact Phase-1 winner SHA is frozen.

## Purpose

Phase 2 is mechanism-neutral. Before choosing the first mutation, measure where
the qualified Phase-1 solver spends **avoidable whole-solve work**, including
both per-node cost and unnecessary search.

All census runs are instrumented diagnostics. Their elapsed time/cycles are not
performance evidence.

## Required outputs

For each production-relevant control, collect by rank/depth where practical:

### Search shape
- visited nodes;
- legal actions before CPC;
- actions surviving CPC restriction/preemption;
- branch count actually searched;
- cutoff child ordinal;
- first-child cutoffs;
- fail-high / fail-low / exact-return counts;
- siblings scored/materialized but never searched;
- terminal child count;
- forced-transition count and chain length.

### Ordering economics
- live-line score evaluations;
- score/order work per node;
- winning/best child's ordinal in the final order;
- first-child exact/cutoff rate;
- static-center tie behavior;
- exact-cache/proof witness availability before scoring;
- whether a witness points to the eventual first/best child.

### CPC economics
- CPC exact / bound / restrict / none;
- forced-column events;
- preemption counts;
- CPC calls that produce no search-space restriction;
- rank distribution for each CPC outcome.

### Exact-cache / TT economics
- private exact hits by rank;
- shared hits where applicable;
- hit-before-CPC fraction;
- hit-after-parent-transition opportunities;
- candidate exact best/refutation witness availability, if present;
- overwrite/replacement distribution if measurable without changing semantics.

### Child work
- cofactors constructed;
- canonicalizations;
- live-line child transitions;
- child metadata/order work produced for siblings never searched;
- repeated support/transition work still observable after Phase-1 plans.

## Controls

At minimum:
- long local control `353335714`;
- short completed Fhourstones control `45461667`;
- selected six-deep/one-wide whole-solve controls after local diagnostics.

The exact Phase-1 SHA becomes the source for all census runs. No census is
authoritative if it silently falls back to an older intermediate arm.

## First decision gates

Use measured counts to choose among:

1. **witness-first ordering/reuse** if exact/proof hints frequently identify the
   eventual cutoff/best child;
2. **lazy sibling materialization** if substantial child/order work is produced
   for siblings never searched;
3. **CPC selective gating/reuse** if many expensive CPC calls yield no
   pruning-relevant fact;
4. **structural quotient/transition reuse** if the same child geometry or exact
   witness repeats strongly;
5. **search-window/algorithm redesign** if cutoff/order distributions imply the
   current alpha-beta windowing is leaving large avoidable subtrees.

Do not select a Phase-2 implementation from static code inspection alone.

## Durability

Commit:
- the exact frozen Phase-1 denominator;
- census hook/source guards;
- workflow run/artifact IDs;
- raw/summary results;
- first candidate disposition.

No diagnostic result should exist only in chat/session state.
