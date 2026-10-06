# C58 compiled response matching constraints — frozen algebraic child

Parent: retained family after C54frontier disposition; record exact source.
No unqualified stacking or productionCPC/NDC/BSFP modification. This is an
independently derived sufficient response-capacity constraint, not a claim that
its matchings literally identify UC4A's three unknown exchange relations.

## Gap and proof

C51pairs odd live frontiers in ascending columns, one legal common policy.
Every perfect matching of those currently playable distinct-column frontiers
also defines a legal policy: answer a frontier trigger at its unmatched mate;
then vertically pair each remaining even column tail. Partners are disjoint,
initially supported and remain available until the pair is triggered. The
controller is previous mover, opponent moves next, remainingcapacity even,
nonterminal first-win-stopped state. Same upper response cells stay guaranteed.

For any one jointly chosen matching M, deny an opponent requirement Riff it
contains a fixed upper response cell OR both members of an edge of M. A policy
covering EVERY opponent residual proves controllerNONLOSS. A guaranteed own
residual entirely in fixedupper cells promotes the SAME policy toWIN. Never
combine blockers from incompatible matchings or inferDRAW from failedWIN.

## Tiny Boolean constraint kernel

Compile geometry/outcome-independent perfect matchings for0,2,4,6odd frontier
slots atinit:1,1,3,15matchings. For each local frontier subset, precompute a
nativeu16mask of matchings having an internal pair. During denial maintain
one scalar feasibleMask; intersect it with each uncovered residual's coverage
mask. feasibleMask0 rejects the whole route; nonzero supplies one COMMON
legal policy, not independent choices per requirement. With4odd frontiers the
three alternative pairings are constrained algebraically, no recursive search.

Local slot index0..5maps to actual u32columns, so physicalwidth33does not alias
column0and32. For more than6odd frontiers use unchangedC51ascending policy;
general boarddimensions continue to work, tactical completeness only bounded
bydeclared resource family. Do not hardcode board7x6, solved prefix, matching
labels, score data or an outcome-selected exception. Existing target-truncated
WINtheorem and deadline remain unchanged.

## Optimized realization

Reuse prepared response geometry and own-guarantee tables. Allocate oddIndex
and oddColumns native arrays before ready. Cheap meta/controller/capacity gates
first, one support pass for local slots, opponentdenial first, optional own
guarantee only after fullfeasibility. Fixedupper-blocked residuals do not enter
matching constraints. Otherwise build local subset with one at-most4cell pass,
then one native maskload/AND; replace old nestedmate scans. No hotmatching
enumeration, allocations, reporting, asyncdependency or selectedpolicy object.
The cold85u16coverage entries and smallplan generation do not justify an Ecore
helper. Parent maskscratch is not retained across recursion; only the completed
0/1/2certificate escapes. Preserve independent pair/target fall-through.

## Gates

Missing API/complete-policy contract REDfirst. Independent physical oracle
enumerates literal pairings and all live physical lines without candidate
tables. Complete first-win-stopped4x3/3x4states, both canonical frames and both
controller guards; every new1must prove currentLOSS and every2current<=DRAW
against independent physical minimax. OldC51positive must remain positive, old
WINmust remainWIN; produce fresh new positives without witness patches.
Test no-common-matching conflicts,1frontier requirements, unsupported cells,
duplicate resources, wrongtempo/terminal, poisoned/disjoint frames, largewidth
fallback and actual8worker windows/rootwitness/TTbounds.100dimension physical
coverage/four-worker minimax before actualoptimized JIT and repeated full7x6.

Compare immediatelyretained parent on fixedactuallocalhost config. Added
constraint reads/slot setup can lose even if pruning improves. No statistical
or performance promotion from a proxy; restore rejected runtime/ledger/tests
cleanly, keep bounded theory/evidence. Do not confuse this safe region with a
total decoder for UC4A or treat a failed child as falsifying the broad algebra.
