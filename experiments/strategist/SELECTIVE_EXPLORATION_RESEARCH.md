# Selective exploration research — 2026-09-27

Research/candidate record, not an implementation or promotion. Local baseline:
JSMinSys `552c9b0dd7b3a8d5d0f08da7f42d6f9c86410364`. Retain the locked
seven-worker / 4M shared / 1M private-per-worker / full-sharing configuration.
No production code, memory setting, move ordering or TT format changes here.

## Primary-source findings

- [Stockfish search.cpp at 0a215d6](https://github.com/official-stockfish/Stockfish/blob/0a215d6c9e48856ef630013b8ab8312941a59057/src/search.cpp):
  iterative deepening retains prior scores/PVs (337–357); aspiration expands
  score windows on failure (380–445); late-move reduced searches can trigger
  deeper re-search (1384–1410); principal-variation search tests challengers with
  narrow windows (1417–1445); singular extensions investigate alternatives to a
  suspected uniquely strong move (1257–1325). This is selective depth and
  evidence reuse, not uniform breadth-first expansion. Its heuristic scores and
  selective pruning are not exact terminal-game proofs.
- [Pascal Pons, iterative deepening/null windows](https://blog.gamesolver.org/solving-connect-four/08-iterative-deepening/),
  checked against [Solver.cpp at d6ba50d](https://github.com/PascalPons/connect4/blob/d6ba50d8aaf2308c769d9bf2abd42d90f34baf41/Solver.cpp):
  the distance-sensitive score permits depth-related exploration through score
  thresholds. The implementation retains upper/lower TT bounds. The tutorial
  reports little benefit for its weak WDL solver, whose score interval is small.
  Its strong-solver gain therefore cannot be assumed for IsoMax's three values.
- [Aske Plaat, MTD(f)](https://people.csail.mit.edu/plaat/mtdf.html):
  repeated threshold questions converge using stored lower/upper bounds;
  previous iterations provide guesses. Memory reuse is central, and the author
  explicitly warns about excessive re-search and TT behavior. This suggests
  investigating information retained between our probes, not copying a driver
  while dropping the bounds that make it economical.
- [Leela Chess Zero, PUCT primer](https://lczero.org/dev/lc0/search/alphazero/):
  selection combines estimated value with policy/visit-based exploration.
  Underexplored alternatives can regain attention as visits accumulate. This
  provides a recurring exploration idea, but its neural estimates and per-edge
  statistics are not our exact WDL authority or our current worker cost model.

These are mechanism sources, not performance predictions for this hardware.
No external engine was benchmarked during this research pass.

## What changes the IsoMax interpretation

The [current matched evidence](../../evidence/isomax-wide-handoff-20260927/REPORT.md)
shows that useful shallow exploration exists: B falls from 40,439 to 2,544 visits,
with one probe pass. A rises from 11,406 to 15,904 visits, with four passes and
5,300 horizon stops. This is a lead about repeated probing, not proof that a
one-pass rule identifies every useful position. Removing dormant shallow
machinery did not establish a repeatable speed improvement.

Current native root code already selects a threshold window when CPC leaves two
possible values, and uses a threshold to find a witness for an already-known
root value. Recursive alpha-beta also narrows windows. Therefore “add null-window
search” is not a sufficiently specific new candidate. The unconstrained
three-value root still starts with the historical full window.

The current exact-only TT retains endpoint proofs but not all nonclosing bounds.
A narrow-window return of draw may only bound the value. A horizon stop is
unknown. Neither may be stored as an exact draw. A bound can remove an action
only when its direction and the current query justify that removal; disappearance
from a query frontier does not automatically prove a globally losing move.

PFIF should preserve two different opportunities: cheap proof that alternatives
cannot matter to this query, and cheap discovery of a cutoff witness. Raw width
alone does not distinguish them. Width delta remains an expansion signal; the
yield of the ensuing probe is a separate economic signal.

## Ranked experiments suggested by the comparison

1. **Bounded pass, conditional renewal.** First compare existing deep control,
   current repeated probing, and a single shallow band followed by deep work.
   Use A/B as diagnostic controls and independent completed-solve positions.
   Only after isolating that action, let the strategist renew exploration when
   comparable observations show useful exact/query-bound progress. The existing
   pre-authorized one-band action is the starting point; do not write another
   scheduler. Local command completion executes a prescribed extent, not an
   independent worker strategy. A command may be armed again after later
   expansion: this is not a permanent root-only decision.
2. **Retention audit before stronger probing.** Inspect which already-produced
   sound intervals/query facts are lost between bands and which are already
   retained in private frames. First count this at existing pass boundaries in
   an isolated diagnostic. Any bound-TT extension is a separate candidate with
   equality, polarity, window and lifetime contracts; it is outside the present
   flags-only strategy experiment. No speculative shared-TT mutation.
3. **Root threshold portfolio, separately.** For unconstrained WDL roots only,
   compare the existing root driver against asking win/non-loss questions in
   alternate orders. Both negative answers and witness transport must remain
   sound. This can reuse native recursion, but costs repeated root work and may
   need retained bounds to win. It is not depth widening, is not automatically
   faster, and is not an existing strategist flag action.

Do not directly transplant heuristic LMR fail-low pruning, singularity margins,
neural leaf values, PUCT node statistics or a new materialized frontier. For an
exact solver, a cheap incomplete probe can prioritize later work but cannot
erase an unresolved proof obligation.

## Cost and observation requirements

The strategist owns policy and publishes flags; workers retain the per-completed-
node reader and execute bounded actions. Existing pending snapshots measure
query-stack obligations, not globally distinct q width. Compare deltas only
within compatible solve/region/mode/horizon scopes. A TT exact-store count is
not a measurement of live width or useful eliminations. The presently missing
causal yield signal must be qualified, not assumed available.

Charge observation, active probe work, repeated traversal, control delivery,
preparation, strategist contention and cleanup to the complete operation.
In particular, a strategist deciding slowly must not leave an unbounded shallow
command running; bounded commands limit that exposure. Their bookkeeping still
costs cycles and must beat an observation-only matched control.

Primary selection metric: completed exact solve wall time on the locked pool.
Single-worker cycles-to-solve isolate execution economics. Also retain aggregate
process cycles, visits, probe passes/horizon stops and incomplete outcomes.
Fewer visits or more nodes/sec do not establish a win. The small historical A/B
cases are mechanism tests, not a promotion dataset; include longer completed
solves, draws, mirror controls and independent positions before promotion.

No new tests were run in this research-only pass. The proposed renewal policy,
retention changes and root threshold portfolio remain unqualified candidates.
