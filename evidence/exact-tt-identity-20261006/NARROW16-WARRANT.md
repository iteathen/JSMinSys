# Narrow16 investigation

Freeze before replay: retain full32bit sequence and proof/index protocol. A
nonterminal standard7x6 q with one active coordinate word per owner has lanes
9/10/12/13 zero. Heights21bits reconstruct full rank/metadata. Retain lane8,
omit lane11, compare index+partial hash. The same reversible-mixer proof applies.
Four native words:seq/tag,partial hash/proof,heights,lane8 =16bytes. No lookup
reconstruction or BigInt. Private version uses native proof in the sequence word.

Worker admission is outcome-independent n<=32, which guarantees the four omitted
high words zero on normalized frames. Unadmitted q produces a TT miss and skips
TT publication; residual-order frontier and full exact search remain unchanged.
Do not infer a value or action from eligibility. Avoid computing hash/support
for unadmitted frames. Generic dimensions retain the existing cold wider fallback.

First compare16-byte-only admission with24-byte full coverage at the same entry
counts. Any lost early/middle-rank sharing is part of the full-solve cost. If
16-only loses, test a separately frozen mixed wider/narrow table at predeclared
capacities before rejecting the parent idea. No individual state/carrier exceptions
or outcome-dependent admission. No performance conclusion before correctness,
cycle ledger, JIT and a complete localhost empty7x6 solve with six pinned workers.
