# Connect Four rank-local pre-search seam

Status: frozen implementation design, research-qualified integration only

## Scope

This seam sits in front of IsoMax search. It does not modify CPC, RBA search, Lazy SMP workers, or BSFP.

It consumes only the actual current move history plus the prepared Connect Four geometry. It does not enumerate descendants, recurse, query a TT, consult an oracle, or consume solved W/D/L.

The seam is two LEGO pieces:

1. a pure rank-local landing certificate;
2. a thin move-selector composition that either returns the local move or delegates the unchanged position to Lazy SMP.

## Rank-local measurement

For each legal column c, let e(c) be its current legal landing cell.

From the current ownership only:

- A(P,c) = number of still-live mover winning lines containing e(c);
- B(P,c) = number of still-live opponent winning lines containing e(c), hence killed by occupying e(c);
- H(P,c) = number of empty cells remaining above e(c) in column c after the landing.

A line is live for a player exactly when it contains no stone owned by the opponent.

Candidate x Pareto-dominates candidate y iff

A(P,x) >= A(P,y) and B(P,x) >= B(P,y)

with at least one strict inequality.

The implementation must expose the complete candidate table, including landing cell, A, B, H, and the columns that dominate each candidate.

## Conservative certificate rule

The local seam returns a move only when:

1. there is exactly one Pareto-maximal legal landing under (A,B); and
2. that unique maximum has H > 0.

If the unique maximum has H = 0, the local seam returns UNRESOLVED. It does not discard that maximum and choose a runner-up. This is the explicit structural-resource boundary: local incidence dominance is not licensed after the selected landing exhausts its own column resource.

If multiple Pareto maxima remain, the result is UNRESOLVED.

This rule is deliberately narrower than the research v0/v4 policies. It contains no phase repair projection, deadline projection, response enumeration, or symmetry tie-break.

## Required controls

Standard 7x6, 1-based notation shown here:

- empty -> 4;
- 4 -> 4;
- 44 -> 4;
- 444 -> 4;
- 4444 -> 4;
- 44444 -> UNRESOLVED, reason UNIQUE_MAX_EXHAUSTS_COLUMN;
- 41 -> 4.

For 44444 the measurement is still allowed to report c4 as the unique incidence maximum, (A,B)=(6,6). The important result is that the certificate refuses to turn that measurement into a move because H=0.

The runtime must not encode the literal opening sequence 44444. These results must emerge from the same state-local rule applied to the supplied move history.

## IsoMax composition

The existing runLazySmpConnect4Rba32 function remains unchanged.

A new wrapper first calls the rank-local certificate:

- CERTIFIED -> return the structural move without spawning workers;
- UNRESOLVED -> call runLazySmpConnect4Rba32 on the exact same position.

This means deviations are ordinary inputs. After 4,1 the next invocation evaluates 41 directly; it does not try to return to an expected opening line.

## Claim boundary

This module is an additive research integration. It proves only that the declared local rule reached its own certificate condition. It does not promote the rule to a universal perfect-play theorem.

Oracle evidence may validate controls but is never a runtime premise.

Production CPC is read-only. BSFP is untouched.
