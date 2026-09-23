# Round 104 — integrated RBA + exact-TT add-on

Status: implemented on `research/isomax-rba-primitives-v1`; complete application integration and
governing-unit qualification remain required.

## Purpose

Round 101 provided relational primitives, round 102 worker mechanics, and round
103 cold branch-manager lifecycle. This round composes the persistent relational
state graph so an application does not need to reimplement TT identity/lifetime
and RBA dependency storage around every solver.

## Selected specialization

The add-on deliberately selects:

- eight uint32 q words;
- up to 69 immutable basis IDs per q;
- up to seven dependency edges per q; and
- ordered exact value codes 1..3.

This is a specialized reusable add-on, not a new generic database/TT framework.

## Owned by the add-on

- exact eight-word interning with full equality after locator selection;
- basis publication on insertion and reuse on hits;
- refs, generations, execution ownership, queue/event membership and recycling;
- monotone lower/upper evidence and exact closure;
- scalar-only or materialized dependency rows;
- generation-checked child pins and incoming-parent lists;
- ready queue and coalesced event queue;
- worker-side prepared branch publication with direct retained-child handoff;
- manager-side dependency attachment;
- generic minimizing/maximizing Bellman interval reconciliation;
- pruning/release of exact or interval-irrelevant child pins;
- parent signaling, unresolved-child enqueue, detach, root handle and DONE signal.

## Still application-owned

The add-on does not know Connect4 or any other game. It does not define:

- the semantic meaning of the eight q words;
- RBA cofactor/preimage/front operators;
- how child q is generated or canonicalized;
- the meaning of dependency labels;
- which nodes are minimizing/maximizing;
- root witness/tie policy;
- proof/certificate identity;
- external replay/ingress; or
- result/status presentation.

Therefore no board conversion, fallback solver or second semantic identity is
introduced by this add-on.

## Qualification

Tests cover exact interning/basis reuse, queue->execution ownership, prepared
dependency publication and local child retention, topology attachment, exact
Bellman propagation/pruning, parent event signaling, pin release/recycling,
DONE publication and transaction ownership.

The hot functions are composed from admitted JSMinSys operations/helpers.
`createRbaTt8x32` is cold. Application adoption must still run the transitive
hot-scope verifier and compare complete worker+RBA+TT+manager cost.
