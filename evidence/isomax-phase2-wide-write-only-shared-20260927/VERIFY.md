# Wide-worker shared-write-only verification

Date: 2026-09-27

Candidate solver revision:
`0b533c151faf8e6208ff80ff30168d40066cd6e7`

Draft PR:
#102 — IsoMax Phase2: wide worker shared-write-only

Verify workflow:
`36389690107` — success.

Passed:
- add-on catalog / NEES ledger verification;
- schema;
- Node compatibility;
- behavior generator --check;
- root-frontier generator --check;
- root-frontier audit;
- runtime geometry audit;
- full test suite;
- CPC/alpha-beta benchmark sanity;
- add-on benchmark sanity.

Topology semantics:
- worker 0 remains wide/root-frontier;
- worker 0 retains shared exact publication through cache.shared;
- worker 0 sets only cache.sharedRead=null before timing/search;
- workers 1..3 retain normal shared read/write;
- no single-worker qualification.

Ledger:
- 156/156 units decomposed;
- no missing units;
- cold sharedRead initialization and worker-0 role selection accounted.
