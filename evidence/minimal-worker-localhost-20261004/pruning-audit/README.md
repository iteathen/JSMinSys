# Terminal and pruning diagnostic, 2026-10-04

Source under test: 7c67fb14dd735c4d1bed5a01961c40fe12ceda15 (worker includes the win cutoff and restored exact sharing). Production source and support libraries were not changed in this diagnostic.

## Independent terminal checks

A separate physical-cell board implementation scans horizontal, vertical and both diagonal directions. For 300 seeded legal games each on 7x6, 7x5 and 4x4, every legal next move was compared with the actual cofactor return, with canonical reflection transported back to physical columns at each step. Total 99750 comparisons, zero mismatches. This includes wins for both players, full-board draws, and reflected intermediate states. This is bounded evidence, not exhaustive qualification of all 7x6 states.

## Four-worker control-flow probes

Diagnostic-only copies of the current worker record node entries, cofactor calls, terminal detections, exact/bound cache returns and cutoffs. Counters exist only in the generated copy outside production. Four workers use cold 16384-entry shared/private caches, with a 1500 ms cooperative diagnostic stop. These runs are pathology/correctness probes, not performance comparisons against the full-memory benchmark.

- 414142: column 4 immediately wins for the first player. Each worker returns after one node and one cofactor.
- 141412: column 1 immediately wins for the first player. All workers remain inside the first root action, column 4, until diagnostic cancellation. They never visit root column 1. Combined node entries 5799272, despite an immediate legal win.
- 4141213: column 1 immediately wins for the second player. Again all workers enter root column 4 and never reach column 1 before cancellation. See raw trace for counts.

Actual terminal detections and alpha-beta/max-win cutoffs occur hundreds of thousands of times within these traces. This falsifies the broad explanation that win detection or pruning never runs. It demonstrates delayed discovery of an immediately winning alternative: terminal detection occurs only for the action currently being expanded, after earlier siblings may have required an arbitrarily large recursive proof.

The current negamax loops center-first, constructs one child, and immediately recurses before inspecting subsequent actions. It does not scan the current playable singleton residuals before recursion. It also has no current-opponent-threat forced-column restriction, tactical exact closure or live-line ordering. The minimal-worker authority explicitly excludes CPC/NDC/live-line/restriction/interval mechanisms; these omissions are architectural scope choices, not evidence of a broken import. Do not restore the whole old stack without an explicit isolated proposal.

## Independent result check

Sixteen generated nonterminal late positions (eight each 7x6 and 7x5, seven/eight empty cells) were solved by the uninstrumented current worker with four workers. A separate physical-board minimax evaluated outcomes and optimal legal moves after each timed solver returned. All sixteen matched, with cleanup verified. Oracle outputs were never passed into the solver. These relatively small controls do not qualify early-game performance or prove absence of all correctness errors.

## Old-package control and caveat

The frozen prepared package associated with 1b843981 was also run on the same three tactical roots, with four workers and small cold caches. It returned exact on 414142 and 4141213, but timed out on 141412. Do not claim the fast package already handles every immediate-win root properly.

Source inspection explains the distinction: its recursive solver scans playable singleton threats and accepts exact tactical closure before recursion. At the root, however, an exact winning value is retained as rootExact and the code still searches ordered child moves to obtain a witness move. The root tactical evaluation does not directly supply the winning action. That can postpone an already known immediate winning alternative. Thus the root weakness predates the minimal rebuild, while loss of recursive tactical closure broadens the exposure.

The minimal worker also invokes the generic cofactor/canonicalization exports; the old dense kernel invoked the dense/prepared exports. The generic profile already selects dense removal tables and three-word coordinate operations where applicable, so this is not proof of a sparse fallback. The remaining dispatch/loop differences require profiling before attributing cost.

## Disposition

No further production edits or full empty-board timing run were performed. Terminal detection and pruning work on the checked paths. The concrete next repair candidate is current-position immediate-win discovery before descending into any child, with an exact winning move transported correctly through reflection at the root. It should use prepared RBA singleton information and be implemented in the owning support-library boundary, with initialization and hot-loop cost constraints preserved. Mandatory threat handling and broader NDC/CPC restoration are separate changes, not bundled into that candidate. No claim is made that this alone restores the historical 35-second result.

Reproduction: run audit.mjs and oracle-and-prior.mjs with the recorded localhost Node runtime at the paths encoded in these scripts. They require the source revision and frozen prior package identified above. Raw instrumented totals are diagnostic work counts, not comparable production timing metrics.
