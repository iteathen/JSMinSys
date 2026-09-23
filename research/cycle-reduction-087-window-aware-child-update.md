# Cycle reduction round-087 — window-aware child update triage

The pinned incumbent search updates best value, then alpha/beta, then tests cutoff after every recursive child.

At a maximizing node before each child:

value <= alpha < beta

Therefore classify the raw child score in this order:

1. score >= beta: cutoff; score is necessarily new best.
2. score > alpha: continue; score is necessarily new best and new alpha.
3. score <= alpha: alpha is unchanged; only compare score with value if best identity/value still needs updating.

The minimizing case is the exact dual under alpha < beta <= value.

Relative to cutoff-first plus a best compare/select and a separate bound compare/select, continuing children drop from about five serial operations to two when they move the bound and three in the residual best-only region. Cutoff remains one comparison.

This is not speculative branch reordering: the inequalities are maintained by ordinary alpha-beta semantics and are visible in the pinned incumbent caller.
