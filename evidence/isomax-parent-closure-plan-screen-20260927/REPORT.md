# IsoMax parent-aligned support-plan screen — 2026-09-27

Status: Stage-4 screen complete; no production promotion.

Control: sparse/no-C1 support-plan application
`b6a87d308bcb75323c15404ed8fd5a166c9feecf`.

Candidate: parent-index-aligned closure plans
`bc7380837f6ba65d513f31e5de89ac766f09df9f` (draft PR #61).

Candidate Verify: green.

Workflow run: `36348168160` — success.
Artifact: `10941676067`.
Digest: `sha256:9f336a9422bd44361e4b2843efd9bcea87ccce0e9137b4409c9b5805d74aa361`.

The candidate stores each support-derived closure directly at the parent-basis
index and replaces the hot map/image-index decode with valid/unchanged bitsets.
No q coordinate membership or solved information is cached.

## Long equal-work control — 353335714

Eight ABBA blocks / 32 fresh Windows processes. All result/search metrics are
identical: 11,755,731 nodes and 11,813,310 cofactors.

Paired candidate deltas:
- solve cycles: **-1.5867%**, 95% descriptive interval **[-2.3376%, -0.8358%]**;
- wall: **-1.4728%** [-2.5002%, -0.4453%];
- CPU: **-1.6008%** [-2.3092%, -0.8924%].

Descriptive means:
- control: 19.813 B cycles, 1685.41 cycles/node;
- candidate: 19.497 B cycles, 1658.55 cycles/node.

Plan arena falls to 283,368,196 bytes.

## Short control — 45461667

Four blocks / 16 fresh processes. Cycle delta +6.25% with a very wide interval
[-6.45%, +18.95%]; no short-work ordering is established.

## Disposition

Retain parent-index alignment as the Stage-4 candidate. It gives a small but
repeatable long-control reduction and removes one dynamic decode layer from every
plan hit. Continue to fixed-three-word output specialization before re-profiling.
